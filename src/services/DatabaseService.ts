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
      `CREATE TABLE IF NOT EXISTS leave_applications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        leave_type TEXT NOT NULL,
        date INTEGER NOT NULL,
        reason TEXT,
        status TEXT NOT NULL DEFAULT 'Pending',
        applied_at INTEGER NOT NULL,
        reviewed_at INTEGER,
        reviewed_by TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );`,
      'CREATE INDEX IF NOT EXISTS idx_leave_user ON leave_applications(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_leave_status ON leave_applications(status);',
    ];

    for (const query of queries) {
      await this.db.executeSql(query);
    }

    // Safely add role column if it doesn't exist
    try {
      await this.db.executeSql(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'employee'`);
    } catch (e) {
      // Column already exists, ignore
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

  // --- Phase 5 Additions ---

  async getUserByEmployeeId(empId: string): Promise<User | null> {
    if (!this.db) {
      return null;
    }
    const [results] = await this.db.executeSql(
      'SELECT * FROM users WHERE employee_id = ? LIMIT 1',
      [empId],
    );

    if (results.rows.length > 0) {
      const row = results.rows.item(0);
      return {
        id: row.id,
        name: row.name,
        employeeId: row.employee_id,
        department: row.department,
        role: row.role,
        projectSite: row.project_site,
        mobile: row.mobile,
        registeredAt: row.registered_at,
        faceRegistered: true, // simplified assumption
        initials: row.name ? row.name.substring(0, 2).toUpperCase() : '??',
        avatarColor: '#1976D2',
      };
    }
    return null;
  }

  async createUser(user: User): Promise<void> {
    if (!this.db) {
      throw new Error('Database not open');
    }
    await this.db.executeSql(
      `INSERT INTO users (id, name, employee_id, department, role, registered_at, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [
        user.id,
        user.name,
        user.employeeId,
        user.department,
        user.role || 'employee',
        user.registeredAt,
      ],
    );
  }

  async createLeaveApplication(leave: any): Promise<string> {
    if (!this.db) {
      throw new Error('Database not open');
    }
    await this.db.executeSql(
      `INSERT INTO leave_applications (id, user_id, user_name, leave_type, date, reason, status, applied_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        leave.id,
        leave.userId,
        leave.userName, // assuming it's available or we can just fetch
        leave.leaveType,
        leave.date,
        leave.reason || null,
        leave.status,
        leave.appliedAt,
      ],
    );
    return leave.id;
  }

  async getLeaveApplications(userId?: string): Promise<any[]> {
    if (!this.db) {
      return [];
    }
    let query = 'SELECT * FROM leave_applications';
    let params: any[] = [];
    if (userId) {
      query += ' WHERE user_id = ?';
      params.push(userId);
    }
    query += ' ORDER BY applied_at DESC';

    const [results] = await this.db.executeSql(query, params);
    const rows = results.rows;
    const leaves = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows.item(i);
      leaves.push({
        id: row.id,
        userId: row.user_id,
        userName: row.user_name,
        leaveType: row.leave_type,
        date: row.date,
        reason: row.reason,
        status: row.status,
        appliedAt: row.applied_at,
        reviewedAt: row.reviewed_at,
        reviewedBy: row.reviewed_by,
      });
    }
    return leaves;
  }

  async updateLeaveStatus(
    id: string,
    status: string,
    reviewedBy: string,
  ): Promise<void> {
    if (!this.db) {
      return;
    }
    await this.db.executeSql(
      `UPDATE leave_applications SET status = ?, reviewed_at = ?, reviewed_by = ? WHERE id = ?`,
      [status, Date.now(), reviewedBy, id],
    );
  }

  async getAttendanceByMonth(
    userId: string,
    year: number,
    month: number, // 0-indexed
  ): Promise<any[]> {
    if (!this.db) {
      return [];
    }
    
    // Calculate start and end timestamps for the given month
    const startDate = new Date(year, month, 1).getTime();
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();

    const [results] = await this.db.executeSql(
      `SELECT * FROM attendance_records 
       WHERE user_id = ? AND check_in_time >= ? AND check_in_time <= ?
       ORDER BY check_in_time ASC`,
      [userId, startDate, endDate],
    );

    const rows = results.rows;
    const records = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows.item(i);
      const d = new Date(row.check_in_time);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      records.push({
        date: dateStr,
        status: 'present',
        checkInTime: row.check_in_time,
      });
    }
    return records;
  }

  async getUserCount(): Promise<number> {
    if (!this.db) return 0;
    const [results] = await this.db.executeSql('SELECT COUNT(*) as count FROM users');
    return results.rows.item(0).count;
  }

  async getTodayAttendanceCount(): Promise<number> {
    if (!this.db) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [results] = await this.db.executeSql(
      'SELECT COUNT(DISTINCT user_id) as count FROM attendance_records WHERE check_in_time >= ?',
      [today.getTime()]
    );
    return results.rows.item(0).count;
  }

  async getPendingLeavesCount(): Promise<number> {
    if (!this.db) return 0;
    const [results] = await this.db.executeSql(
      "SELECT COUNT(*) as count FROM leave_applications WHERE status = 'Pending'"
    );
    return results.rows.item(0).count;
  }

  async getUserAttendanceStats(userId: string): Promise<{ present: number; absent: number; rate: number; lastAttendance: number | null }> {
    if (!this.db) return { present: 0, absent: 0, rate: 0, lastAttendance: null };

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    
    // Total days elapsed in current month up to today
    const elapsedDays = Math.max(1, now.getDate());

    const [results] = await this.db.executeSql(
      'SELECT check_in_time FROM attendance_records WHERE user_id = ? AND check_in_time >= ?',
      [userId, startOfMonth]
    );

    const rows = results.rows;
    const uniqueDays = new Set<string>();
    let lastAttendance: number | null = null;

    for (let i = 0; i < rows.length; i++) {
      const ts = rows.item(i).check_in_time;
      if (!lastAttendance || ts > lastAttendance) {
        lastAttendance = ts;
      }
      const d = new Date(ts);
      uniqueDays.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    }

    const present = uniqueDays.size;
    const absent = elapsedDays - present;
    const rate = Math.round((present / elapsedDays) * 100);

    return { present, absent, rate, lastAttendance };
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
