import Dexie, { Table } from 'dexie';
import { User, Patient, Treatment, Session, Appointment, Payment, PatientPhoto, ActivityLog, DaySchedule } from '../types';

export interface SyncOperation {
  id?: number;
  endpoint: string;
  method: string;
  payload: Record<string, any>;
  timestamp: number;
}

export class ClinicDB extends Dexie {
  users!: Table<User, string>;
  patients!: Table<Patient, string>;
  treatments_setting!: Table<Treatment, string>;
  sessions!: Table<Session, string>;
  appointments!: Table<Appointment, string>;
  payments!: Table<Payment, string>;
  patient_photos!: Table<PatientPhoto, string>;
  activity_logs!: Table<ActivityLog, string>;
  // FIX: Updated table definition to use a compound primary key [doctorId, day].
  // The original definition had 'id' as a primary key which was optional in the type, causing runtime errors.
  // The type mismatch between the schema and the DaySchedule type also led to a misleading compiler error.
  doctor_schedules!: Table<DaySchedule, [string, number]>;

  syncQueue!: Table<SyncOperation, number>;

  constructor() {
    super('ClinicDatabase');
    // FIX: Add explicit type assertion '(this as Dexie)' to resolve a misleading TypeScript error where the 'version' method was not found on 'this' within the constructor.
    (this as Dexie).version(1).stores({
      users: 'id, &email, role',
      patients: 'id, &code, *doctorIds, name, phone',
      treatments_setting: 'id, &name',
      sessions: 'id, patientId, doctorId, date',
      appointments: 'id, patientId, doctorId, date',
      payments: 'id, patientId, date',
      patient_photos: 'id, patientId',
      activity_logs: 'id, patientId, userId, timestamp',
      doctor_schedules: '[doctorId+day]',

      // Table for offline operations
      syncQueue: '++id, timestamp',
    });
  }
}

export const db = new ClinicDB();