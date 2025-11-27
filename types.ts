export enum TreatmentType {
  PHYSIOTHERAPY = 'Physiotherapy',
  SPORTS_MASSAGE = 'Sports Massage',
}

export type UserRole = 'admin' | 'therapist';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}

export interface Session {
  id: string;
  therapistId: string;
  therapistName: string;
  patientName: string;
  treatmentType: TreatmentType;
  durationMinutes: number;
  timestamp: string; // ISO string
  signatureDataUrl: string; // Base64 image
  notes?: string;
}

export interface PayrollReport {
  totalSessions: number;
  totalHours: number;
  breakdown: {
    physioCount: number;
    massageCount: number;
  };
  aiAnalysis?: string;
}