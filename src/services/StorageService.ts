import {MMKV} from 'react-native-mmkv';

export const storage = new MMKV({id: 'datalake-storage'});

export const StorageKeys = {
  AUTH_USER: 'auth.user',
  IS_AUTHENTICATED: 'auth.isAuthenticated',
  REMEMBERED_USERNAME: 'auth.remembered',
  ATTENDANCE_RECORDS: 'attendance.records',
  REGISTERED_USERS: 'users.registered',
  LAST_SYNC_TIME: 'sync.lastTime',
  AUTO_SYNC: 'sync.auto',
} as const;

export function persistJSON<T>(key: string, value: T): void {
  storage.set(key, JSON.stringify(value));
}

export function loadJSON<T>(key: string): T | null {
  const raw = storage.getString(key);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
