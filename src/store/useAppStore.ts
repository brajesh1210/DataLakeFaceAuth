import {create} from 'zustand';
import type {User, AttendanceRecord, FaceEmbedding} from '../types/types';
import {
  storage,
  StorageKeys,
  persistJSON,
  loadJSON,
} from '@services/StorageService';
import {databaseService} from '@services/DatabaseService';

// ─── Mock Data Factories ────────────────────────────────────────

const AVATAR_COLORS = ['#0A3D7A', '#1976D2', '#F57C00', '#388E3C', '#D32F2F'];

const MOCK_PROJECT_SITES = [
  'NH-48 Delhi-Jaipur',
  'NH-44 Delhi-Agra',
  'NH-66 Mumbai-Goa',
  'NH-8 Delhi-Mumbai',
  'NH-2 Delhi-Kolkata',
];

const GPS_LOCATIONS = [
  {lat: 28.6139, lng: 77.209}, // Delhi
  {lat: 26.9124, lng: 75.7873}, // Jaipur
  {lat: 27.1767, lng: 78.0081}, // Agra
  {lat: 19.076, lng: 72.8777}, // Mumbai
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function createMockUsers(): User[] {
  const users: User[] = [
    {
      id: 'u1',
      name: 'Rahul Kumar',
      employeeId: 'EMP12345',
      department: 'Field Engineer',
      projectSite: MOCK_PROJECT_SITES[0],
      mobile: '9876543210',
      faceRegistered: true,
      registeredAt: Date.now() - 86400000 * 30,
      initials: 'RK',
      avatarColor: AVATAR_COLORS[0],
    },
    {
      id: 'u2',
      name: 'Priya Sharma',
      employeeId: 'EMP12346',
      department: 'Surveyor',
      projectSite: MOCK_PROJECT_SITES[1],
      mobile: '9876543211',
      faceRegistered: true,
      registeredAt: Date.now() - 86400000 * 25,
      initials: 'PS',
      avatarColor: AVATAR_COLORS[1],
    },
    {
      id: 'u3',
      name: 'Amit Singh',
      employeeId: 'EMP12347',
      department: 'Inspector',
      projectSite: MOCK_PROJECT_SITES[2],
      mobile: '9876543212',
      faceRegistered: true,
      registeredAt: Date.now() - 86400000 * 20,
      initials: 'AS',
      avatarColor: AVATAR_COLORS[2],
    },
    {
      id: 'u4',
      name: 'Neha Gupta',
      employeeId: 'EMP12348',
      department: 'Supervisor',
      projectSite: MOCK_PROJECT_SITES[3],
      mobile: '9876543213',
      faceRegistered: true,
      registeredAt: Date.now() - 86400000 * 15,
      initials: 'NG',
      avatarColor: AVATAR_COLORS[3],
    },
    {
      id: 'u5',
      name: 'Vikram Patel',
      employeeId: 'EMP12349',
      department: 'Field Engineer',
      projectSite: MOCK_PROJECT_SITES[4],
      mobile: '9876543214',
      faceRegistered: false,
      registeredAt: Date.now() - 86400000 * 10,
      initials: 'VP',
      avatarColor: AVATAR_COLORS[4],
    },
  ];
  return users;
}

function createMockAttendance(users: User[]): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const now = Date.now();
  let idCounter = 1;

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const dayBase = now - 86400000 * dayOffset;
    // 2-3 users per day
    const usersForDay = users.slice(0, dayOffset < 3 ? 3 : 2);

    for (const user of usersForDay) {
      const gps =
        GPS_LOCATIONS[Math.floor(Math.random() * GPS_LOCATIONS.length)];
      const checkInHour = 8 + Math.floor(Math.random() * 2);
      const checkInMin = Math.floor(Math.random() * 60);
      const checkInTime = new Date(dayBase);
      checkInTime.setHours(checkInHour, checkInMin, 0, 0);

      records.push({
        id: `att-${idCounter++}`,
        userId: user.id,
        userName: user.name,
        employeeId: user.employeeId,
        timestamp: checkInTime.getTime(),
        type: 'check-in',
        method: 'face',
        confidence: 90 + Math.floor(Math.random() * 10),
        gpsLat: gps.lat + (Math.random() - 0.5) * 0.01,
        gpsLng: gps.lng + (Math.random() - 0.5) * 0.01,
        synced: dayOffset > 1, // recent records pending
        livenessScore: 0.85 + Math.random() * 0.14,
      });

      // Add checkout for most
      if (Math.random() > 0.2) {
        const checkOutTime = new Date(dayBase);
        checkOutTime.setHours(
          checkInHour + 8 + Math.floor(Math.random() * 2),
          checkInMin,
          0,
          0,
        );
        records.push({
          id: `att-${idCounter++}`,
          userId: user.id,
          userName: user.name,
          employeeId: user.employeeId,
          timestamp: checkOutTime.getTime(),
          type: 'check-out',
          method: 'face',
          confidence: 88 + Math.floor(Math.random() * 12),
          gpsLat: gps.lat + (Math.random() - 0.5) * 0.01,
          gpsLng: gps.lng + (Math.random() - 0.5) * 0.01,
          synced: dayOffset > 1,
          livenessScore: 0.83 + Math.random() * 0.16,
        });
      }
    }
  }

  // Sort newest first
  records.sort((a, b) => b.timestamp - a.timestamp);
  return records;
}

// ─── Store Definition ───────────────────────────────────────────

interface AppState {
  // Auth
  isAuthenticated: boolean;
  currentUser: User | null;
  userRole: 'admin' | 'employee' | null;
  rememberedUsername: string;

  // Users (mock face database)
  registeredUsers: User[];

  // Attendance
  attendanceRecords: AttendanceRecord[];
  pendingSyncCount: number;

  // Network & Sync
  isOnline: boolean;
  lastSyncTime: number | null;
  autoSync: boolean;

  // Actions
  loadFromDatabase: () => Promise<void>;
  login: (user: User) => void;
  logout: () => void;
  registerUser: (
    user: Omit<
      User,
      'id' | 'initials' | 'avatarColor' | 'registeredAt' | 'faceRegistered'
    >,
    embedding: Float32Array,
  ) => Promise<void>;
  addAttendanceRecord: (record: Omit<AttendanceRecord, 'id'>) => Promise<void>;
  markRecordsAsSynced: (ids: string[]) => Promise<void>;
  setNetworkStatus: (online: boolean) => void;
  setAutoSync: (enabled: boolean) => void;
  purge: () => Promise<void>;
  setRememberedUsername: (username: string) => void;
}

// ─── Hydrate from MMKV ─────────────────────────────────────────

function hydrateUsers(): User[] {
  const persisted = loadJSON<User[]>(StorageKeys.REGISTERED_USERS);
  return persisted && persisted.length > 0 ? persisted : createMockUsers();
}

function hydrateRecords(users: User[]): AttendanceRecord[] {
  const persisted = loadJSON<AttendanceRecord[]>(
    StorageKeys.ATTENDANCE_RECORDS,
  );
  return persisted && persisted.length > 0
    ? persisted
    : createMockAttendance(users);
}

const initialUsers = hydrateUsers();
const initialRecords = hydrateRecords(initialUsers);

export const useAppStore = create<AppState>((set, get) => ({
  // Hydrate auth
  isAuthenticated: storage.getBoolean(StorageKeys.IS_AUTHENTICATED) ?? false,
  currentUser: loadJSON<User>(StorageKeys.AUTH_USER),
  userRole: storage.getString('userRole') as 'admin' | 'employee' | null,
  rememberedUsername: storage.getString(StorageKeys.REMEMBERED_USERNAME) ?? '',

  // Hydrate data
  registeredUsers: initialUsers,
  attendanceRecords: initialRecords,
  pendingSyncCount: initialRecords.filter(r => !r.synced).length,

  // Network
  isOnline: true,
  lastSyncTime: storage.contains(StorageKeys.LAST_SYNC_TIME)
    ? storage.getNumber(StorageKeys.LAST_SYNC_TIME) ?? null
    : Date.now() - 7200000, // default 2 hours ago
  autoSync: storage.getBoolean(StorageKeys.AUTO_SYNC) ?? false,

  // ── Actions ─────────────────────────────────────────────────

  loadFromDatabase: async () => {
    try {
      const users = await databaseService.getAllUsers();
      const records = await databaseService.getRecentAttendance(100); // load last 100

      set({
        registeredUsers: users,
        attendanceRecords: records,
        pendingSyncCount: records.filter(r => !r.synced).length,
      });

      // Keep MMKV backup for fast synchronous boot before async SQLite completes
      persistJSON(StorageKeys.REGISTERED_USERS, users);
      persistJSON(StorageKeys.ATTENDANCE_RECORDS, records);
    } catch (e) {
      console.error('[AppStore] Failed to load from database', e);
    }
  },

  login: (user: User) => {
    set({
      isAuthenticated: true,
      currentUser: user,
      userRole: user.role as 'admin' | 'employee',
    });
    storage.set(StorageKeys.IS_AUTHENTICATED, true);
    storage.set('userRole', user.role || 'employee');
    persistJSON(StorageKeys.AUTH_USER, user);
  },

  logout: () => {
    set({
      isAuthenticated: false,
      currentUser: null,
      userRole: null,
    });
    storage.set(StorageKeys.IS_AUTHENTICATED, false);
    storage.delete('userRole');
    storage.delete(StorageKeys.AUTH_USER);
  },

  registerUser: async (userData, embedding) => {
    const newUser: User = {
      ...userData,
      id: `u-${Date.now()}`,
      initials: getInitials(userData.name),
      avatarColor:
        AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      registeredAt: Date.now(),
      faceRegistered: true,
    };

    // Save to SQLite
    try {
      await databaseService.registerUser(newUser, embedding);
    } catch (e) {
      console.error('[AppStore] Failed to save user to DB', e);
    }

    const updated = [...get().registeredUsers, newUser];
    set({registeredUsers: updated});
    persistJSON(StorageKeys.REGISTERED_USERS, updated);
  },

  addAttendanceRecord: async recordData => {
    const record: AttendanceRecord = {
      ...recordData,
      id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };

    // Save to SQLite
    try {
      await databaseService.recordAttendance(record);
    } catch (e) {
      console.error('[AppStore] Failed to save attendance to DB', e);
    }

    const updated = [record, ...get().attendanceRecords];
    const pendingCount = updated.filter(r => !r.synced).length;
    set({attendanceRecords: updated, pendingSyncCount: pendingCount});
    persistJSON(StorageKeys.ATTENDANCE_RECORDS, updated);
  },

  markRecordsAsSynced: async (ids: string[]) => {
    try {
      await databaseService.markRecordsSynced(ids);
    } catch (e) {
      console.error('[AppStore] Failed to sync records in DB', e);
    }

    const idSet = new Set(ids);
    const updated = get().attendanceRecords.map(r =>
      idSet.has(r.id) ? {...r, synced: true} : r,
    );
    const pendingCount = updated.filter(r => !r.synced).length;
    set({
      attendanceRecords: updated,
      pendingSyncCount: pendingCount,
      lastSyncTime: Date.now(),
    });
    persistJSON(StorageKeys.ATTENDANCE_RECORDS, updated);
    storage.set(StorageKeys.LAST_SYNC_TIME, Date.now());
  },

  setNetworkStatus: (online: boolean) => {
    set({isOnline: online});
  },

  setAutoSync: (enabled: boolean) => {
    set({autoSync: enabled});
    storage.set(StorageKeys.AUTO_SYNC, enabled);
  },

  purge: async () => {
    try {
      await databaseService.clearAllData();
    } catch (e) {
      console.error('[AppStore] Failed to purge DB', e);
    }
    const remaining = get().attendanceRecords.filter(r => !r.synced);
    set({attendanceRecords: remaining, pendingSyncCount: remaining.length});
    persistJSON(StorageKeys.ATTENDANCE_RECORDS, remaining);
  },

  setRememberedUsername: (username: string) => {
    set({rememberedUsername: username});
    storage.set(StorageKeys.REMEMBERED_USERNAME, username);
  },
}));
