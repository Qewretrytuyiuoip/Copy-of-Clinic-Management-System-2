// FIX: Replaced the entire file content which contained logic and a circular import
// with proper type definitions to be used across the application.
// This resolves numerous 'not exported' and 'circular definition' errors.

export enum UserRole {
    Admin = 'admin',
    Doctor = 'doctor',
    Secretary = 'secretary',
    SubManager = 'sub_manager',
}

export enum Gender {
    Male = 'male',
    Female = 'female',
}

export interface User {
    id: string;
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    specialty?: string;
    is_diagnosis_doctor?: boolean;
}

export interface Treatment {
    id: string;
    name: string;
    price: number;
    notes?: string;
}

export interface SessionTreatment extends Treatment {
    instanceId: string; // The unique ID of this entry from treatments/all
    sessionId: string; // The session this belongs to
    sessionPrice: number; // Price for this specific session, might be different from base price
    sessionNotes?: string;
    completed: boolean;
    treatmentDate?: string;
    additionalCosts?: number;
}

export interface Session {
    id:string;
    patientId: string;
    doctorId: string;
    date: string; // ISO string
    notes: string;
    treatments: SessionTreatment[];
}

export interface Patient {
    id: string;
    code: string;
    name: string;
    age: number;
    phone: string;
    notes?: string;
    doctorIds: string[];
    gender: Gender;
    isSmoker?: boolean;
    isPregnant?: boolean;
    drugAllergy?: string;
    chronicDiseases?: string;
}

export interface Appointment {
    id: string;
    patientId: string;
    doctorId: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    notes?: string;
    createdBy?: string;
}

export interface Payment {
    id: string;
    patientId: string;
    amount: number;
    date: string; // YYYY-MM-DD
}

export interface PatientPhoto {
    id: string;
    patientId: string;
    imageUrl: string;
    caption: string;
    date: string; // YYYY-MM-DD
}

export interface CreatePatientPhotosPayload {
    patientId: string;
    imageUrls: string[]; // base64 data URLs
    captions: string[];
}

export interface DaySchedule {
    id?: string; // Optional ID from the database for existing schedules
    day: number; // 0 for Sunday, 1 for Monday, etc.
    isWorkDay: boolean;
    startTime: string; // HH:MM
    endTime: string; // HH:MM
}

export interface DoctorAvailability {
    doctorId: string;
    schedule: DaySchedule[];
}

// FIX: Added ActivityLog type definitions for tracking patient history.
export enum ActivityLogActionType {
    Create = 'create',
    Update = 'update',
    Delete = 'delete',
}

export interface ActivityLog {
    id: string;
    patientId: string;
    userId: string; // The user who performed the action
    userName: string;
    actionType: ActivityLogActionType;
    description: string;
    timestamp: string; // ISO string
}