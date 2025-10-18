// FIX: Replaced the entire file content which contained logic and a circular import
// with proper type definitions to be used across the application.
// This resolves numerous 'not exported' and 'circular definition' errors.

export enum UserRole {
    Admin = 'admin',
    Doctor = 'doctor',
    Secretary = 'secretary',
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
}

export interface Treatment {
    id: string;
    name: string;
    price: number;
    notes?: string;
}

export interface SessionTreatment extends Treatment {
    sessionPrice: number;
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
    doctorId: string;
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

export interface DaySchedule {
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
