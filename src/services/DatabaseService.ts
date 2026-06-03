import SQLite from 'react-native-sqlite-storage';
import {User, AttendanceRecord, FaceEmbedding} from '../types/types';
import {encryptionService} from './EncryptionService';

SQLite.enablePromise(true);
SQLite.DEBUG(false);

const DB_NAME = 'datalake.db';
const DB_VERSION = '1.0';
const DB_DISPLAYNAME = 'DataLake Offline Database';
const DB_SIZE = 200000;

export class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;
  // Simple LRU-like cache for embeddings could be implemented here. For now, in-memory array.
  private embeddingsCache: FaceEmbedding[] = [];

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.db = await SQLite.openDatabase({
      name: DB_NAME,
      location: 'default',
    });

    // Enable WAL for performance and concurrent access
    await this.db.executeSql('PRAGMA journal_mode=WAL;');

    // Create Tables
    await this.createTables();

    // Load embeddings cache
    await this.loadEmbeddingsCache();

    this.isInitialized = true;
  }

  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not open');
    }

    const queries = [
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        employee_id TEXT UNIQUE NOT NULL,
        department TEXT,
        project_site TEXT,
        mobile TEXT,
        registered_at INTEGER,
        is_active INTEGER DEFAULT 1
      );`,
      `CREATE TABLE IF NOT EXISTS face_embeddings (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        embedding_encrypted TEXT NOT NULL,
        quality_score REAL,
        created_at INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );`,
      `CREATE TABLE IF NOT EXISTS attendance_records (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        employee_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        check_in_time INTEGER NOT NULL,
        latitude REAL,
        longitude REAL,
        liveness_score REAL,
        face_confidence REAL,
        device_id TEXT,
        synced INTEGER DEFAULT 0,
        synced_at INTEGER,
        encrypted_payload TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );`,
      'CREATE INDEX IF NOT EXISTS idx_attendance_synced ON attendance_records(synced);',
      'CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance_records(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_attendance_time ON attendance_records(check_in_time);',
    ];

    for (const query of queries) {
      await this.db.executeSql(query);
    }
  }

  private async loadEmbeddingsCache(): Promise<void> {
    if (!this.db) {
      return;
    }
    const [results] = await this.db.executeSql('SELECT * FROM face_embeddings');
    const rows = results.rows;
    const cache: FaceEmbedding[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows.item(i);
      cache.push({
        id: row.id,
        userId: row.user_id,
        embedding: encryptionService.decryptEmbedding(row.embedding_encrypted),
        qualityScore: row.quality_score,
        createdAt: row.created_at,
      });
    }
    this.embeddingsCache = cache;
  }

  async registerUser(user: User, embedding: Float32Array): Promise<string> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Encrypt embedding
    const encryptedEmbedding = encryptionService.encryptEmbedding(embedding);
    const embeddingId = `emb_${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}`;

    await this.db.transaction((tx: SQLite.Transaction) => {
      tx.executeSql(
        `INSERT INTO users (id, name, employee_id, department, project_site, mobile, registered_at, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          user.name,
          user.employeeId,
          user.department || '',
          user.projectSite || '',
          user.mobile || '',
          user.registeredAt,
          1,
        ],
      );
      tx.executeSql(
        `INSERT INTO face_embeddings (id, user_id, embedding_encrypted, quality_score, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [embeddingId, user.id, encryptedEmbedding, 0.99, Date.now()], // dummy quality score for now
      );
    });

    // Update cache
    this.embeddingsCache.push({
      id: embeddingId,
      userId: user.id,
      embedding: embedding,
      qualityScore: 0.99,
      createdAt: Date.now(),
    });

    return user.id;
  }

  async getAllUsers(): Promise<User[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    const [results] = await this.db.executeSql(
      'SELECT * FROM users WHERE is_active = 1',
    );
    const users: User[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i);
      users.push({
        id: row.id,
        name: row.name,
        employeeId: row.employee_id,
        department: row.department,
        projectSite: row.project_site,
        mobile: row.mobile,
        registeredAt: row.registered_at,
        initials: row.name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase(),
        faceRegistered: true,
        avatarColor: '#1E40AF', // default avatar color
      });
    }
    return users;
  }

  async getUserById(id: string): Promise<User | null> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    const [results] = await this.db.executeSql(
      'SELECT * FROM users WHERE id = ?',
      [id],
    );
    if (results.rows.length === 0) {
      return null;
    }
    const row = results.rows.item(0);
    return {
      id: row.id,
      name: row.name,
      employeeId: row.employee_id,
      department: row.department,
      projectSite: row.project_site,
      mobile: row.mobile,
      registeredAt: row.registered_at,
      initials: row.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase(),
      faceRegistered: true,
      avatarColor: '#1E40AF', // default avatar color
    };
  }

  getAllEmbeddings(): FaceEmbedding[] {
    return this.embeddingsCache;
  }

  async recordAttendance(record: AttendanceRecord): Promise<string> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Create tamper detection payload
    const payloadForHmac = `${record.userId}:${record.timestamp}:${record.type}`;
    const hmac = encryptionService.generateHMAC(payloadForHmac);

    await this.db.executeSql(
      `INSERT INTO attendance_records 
       (id, user_id, employee_id, user_name, check_in_time, latitude, longitude, liveness_score, face_confidence, synced, encrypted_payload)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.userId,
        record.employeeId,
        record.userName,
        record.timestamp,
        record.gpsLat || 0,
        record.gpsLng || 0,
        record.livenessScore || 0,
        record.confidence || 0,
        record.synced ? 1 : 0,
        hmac,
      ],
    );

    return record.id;
  }

  async getRecentAttendance(limit = 50): Promise<AttendanceRecord[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    const [results] = await this.db.executeSql(
      'SELECT * FROM attendance_records ORDER BY check_in_time DESC LIMIT ?',
      [limit],
    );
    return this.mapAttendanceRows(results.rows);
  }

  async getUnsyncedRecords(): Promise<AttendanceRecord[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    const [results] = await this.db.executeSql(
      'SELECT * FROM attendance_records WHERE synced = 0',
    );
    return this.mapAttendanceRows(results.rows);
  }

  async markRecordsSynced(ids: string[]): Promise<void> {
    if (!this.db || ids.length === 0) {
      return;
    }
    const placeholders = ids.map(() => '?').join(',');
    await this.db.executeSql(
      `UPDATE attendance_records SET synced = 1, synced_at = ? WHERE id IN (${placeholders})`,
      [Date.now(), ...ids],
    );
  }

  async clearAllData(): Promise<void> {
    if (!this.db) {
      return;
    }
    await this.db.executeSql('DELETE FROM attendance_records');
    await this.db.executeSql('DELETE FROM face_embeddings');
    await this.db.executeSql('DELETE FROM users');
    this.embeddingsCache = [];
  }

  private mapAttendanceRows(rows: SQLite.ResultSetRowList): AttendanceRecord[] {
    const records: AttendanceRecord[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows.item(i);
      records.push({
        id: row.id,
        userId: row.user_id,
        employeeId: row.employee_id,
        userName: row.user_name,
        timestamp: row.check_in_time,
        type: 'check-in',
        method: 'face',
        confidence: row.face_confidence,
        gpsLat: row.latitude,
        gpsLng: row.longitude,
        synced: row.synced === 1,
        livenessScore: row.liveness_score,
      });
    }
    return records;
  }
}

export const databaseService = new DatabaseService();
