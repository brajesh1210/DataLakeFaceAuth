export interface User {
  id: string;
  name: string;
  employeeId: string;
  department: string;
  projectSite: string;
  mobile: string;
  faceRegistered: boolean;
  registeredAt: number;
  initials: string;
  avatarColor: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  employeeId: string;
  timestamp: number;
  type: 'check-in' | 'check-out';
  method: 'face' | 'manual';
  confidence: number;
  gpsLat: number;
  gpsLng: number;
  synced: boolean;
  livenessScore: number;
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
