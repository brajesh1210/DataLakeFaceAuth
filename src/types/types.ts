export interface User {
  id: string;
  name: string;
  employeeId: string;
  department: string;
  role?: 'admin' | 'employee';
  projectSite: string;
  mobile: string;
  faceRegistered: boolean;
  registeredAt: number;
  initials: string;
  avatarColor: string;
}

export interface LeaveApplication {
  id: string;
  userId: string;
  leaveType: 'Casual' | 'Sick' | 'Annual' | 'Maternity' | string;
  date: number; // unix timestamp
  reason?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedAt: number;
  reviewedAt?: number;
  reviewedBy?: string;
}

export interface DailyAttendance {
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent' | 'leave';
  checkInTime?: number;
  checkOutTime?: number;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  employeeId: string;
  
  checkInTime?: number;
  checkOutTime?: number;
  latitude?: number;
  longitude?: number;
  checkOutLatitude?: number;
  checkOutLongitude?: number;
  livenessScore: number;
  checkOutLiveness?: number;
  faceConfidence?: number;
  checkOutConfidence?: number;
  deviceId?: string;
  synced: boolean;
  syncedAt?: number;

  // Legacy mapped fields
  timestamp: number;
  type?: 'check-in' | 'check-out';
  method?: 'face' | 'manual';
  confidence?: number;
  gpsLat?: number;
  gpsLng?: number;
}

export type AuthStage =
  | 'searching'
  | 'detected'
  | 'liveness'
  | 'recognizing'
  | 'success'
  | 'failure';

export type LivenessChallenge = 'blink' | 'smile' | 'turn';

export interface FaceEmbedding {
  id: string;
  userId: string;
  embedding: Float32Array;
  qualityScore: number;
  createdAt: number;
}
