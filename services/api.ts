// FIX: Added PatientPhoto, ActivityLog and ActivityLogActionType to the import list.
import { User, UserRole, Patient, Treatment, Session, Appointment, Payment, DoctorAvailability, SessionTreatment, Gender, DaySchedule, PatientPhoto, ActivityLog, ActivityLogActionType } from '../types';

// --- MOCK DATABASE ---

const generatePatientCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'P';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

export let MOCK_USERS: User[] = [
    { id: 'admin1', name: 'د. مدير', email: 'admin@example.com', role: UserRole.Admin, password: '1' },
    { id: 'doc1', name: 'د. سميث', email: 'smith@clinic.com', role: UserRole.Doctor, password: '1' },
    { id: 'doc2', name: 'د. جونز', email: 'jones@clinic.com', role: UserRole.Doctor, password: '1' },
    { id: 'sec1', name: 'سارة كونور', email: 'sarah@clinic.com', role: UserRole.Secretary, password: '1' },
];

let MOCK_PATIENTS: Patient[] = [
    { id: 'p1', code: generatePatientCode(), name: 'جون دو', age: 34, phone: '555-0101', notes: 'حساسية من البنسلين.', doctorId: 'doc1', gender: Gender.Male, isSmoker: true, drugAllergy: 'بنسلين', chronicDiseases: 'ربو' },
    { id: 'p2', code: generatePatientCode(), name: 'جين رو', age: 28, phone: '555-0102', notes: 'صداع نصفي مزمن.', doctorId: 'doc1', gender: Gender.Female, isSmoker: false, isPregnant: true, drugAllergy: 'لا يوجد', chronicDiseases: 'صداع نصفي' },
    { id: 'p3', code: generatePatientCode(), name: 'بيتر بان', age: 45, phone: '555-0103', notes: '', doctorId: 'doc2', gender: Gender.Male, isSmoker: false },
];

let MOCK_TREATMENTS: Treatment[] = [];

let MOCK_SESSIONS: Session[] = [
    { 
        id: 's1', 
        patientId: 'p1', 
        doctorId: 'doc1', 
        date: '2023-10-26T10:00:00.000Z', 
        notes: 'فحص أولي. يوصى بالتنظيف.',
        treatments: []
    },
    { 
        id: 's2', 
        patientId: 'p1', 
        doctorId: 'doc1', 
        date: '2023-11-02T11:00:00.000Z', 
        notes: 'اكتمل التنظيف.',
        treatments: []
    },
];

let MOCK_APPOINTMENTS: Appointment[] = [
    { id: 'app1', patientId: 'p2', doctorId: 'doc1', date: new Date().toISOString().split('T')[0], time: '14:00', notes: 'متابعة' },
    { id: 'app2', patientId: 'p3', doctorId: 'doc2', date: new Date().toISOString().split('T')[0], time: '10:30', notes: 'استشارة مريض جديد' },
];

let MOCK_PAYMENTS: Payment[] = [
    { id: 'pay1', patientId: 'p1', amount: 250, date: '2023-11-02' },
];

// FIX: Added mock data for patient photos, which was missing.
let MOCK_PATIENT_PHOTOS: PatientPhoto[] = [
    { id: 'ph1', patientId: 'p1', imageUrl: 'https://via.placeholder.com/400x300.png/0000FF/FFFFFF?text=Before', caption: 'صورة قبل العلاج', date: '2023-10-26' },
    { id: 'ph2', patientId: 'p1', imageUrl: 'https://via.placeholder.com/400x300.png/008000/FFFFFF?text=After', caption: 'صورة بعد العلاج', date: '2023-11-02' },
];

// FIX: Added mock activity logs for patient history tracking.
let MOCK_ACTIVITY_LOGS: ActivityLog[] = [
    { id: 'log1', patientId: 'p1', userId: 'sec1', userName: 'سارة كونور', actionType: ActivityLogActionType.Create, description: 'تم إنشاء ملف المريض.', timestamp: '2023-10-26T09:05:00.000Z' },
    { id: 'log2', patientId: 'p1', userId: 'doc1', userName: 'د. سميث', actionType: ActivityLogActionType.Update, description: "تم تحديث ملاحظات المريض.", timestamp: '2023-10-26T10:01:00.000Z' },
    { id: 'log3', patientId: 'p1', userId: 'doc1', userName: 'د. سميث', actionType: ActivityLogActionType.Create, description: 'تمت إضافة جلسة جديدة.', timestamp: '2023-10-26T10:02:00.000Z' },
    { id: 'log4', patientId: 'p2', userId: 'sec1', userName: 'سارة كونور', actionType: ActivityLogActionType.Create, description: 'تم إنشاء ملف المريض.', timestamp: '2023-10-27T14:00:00.000Z' },
    { id: 'log5', patientId: 'p1', userId: 'sec1', userName: 'سارة كونور', actionType: ActivityLogActionType.Create, description: 'تمت إضافة دفعة بقيمة 250$.', timestamp: '2023-11-02T11:05:00.000Z' },
    { id: 'log6', patientId: 'p1', userId: 'doc1', userName: 'د. سميث', actionType: ActivityLogActionType.Delete, description: 'تم حذف صورة "قبل العلاج".', timestamp: '2023-11-02T11:15:00.000Z' },
    { id: 'log7', patientId: 'p1', userId: 'admin1', userName: 'د. مدير', actionType: ActivityLogActionType.Update, description: "تم تحديث رقم الهاتف من '555-0101' إلى '555-0199'.", timestamp: '2024-01-15T16:20:00.000Z' },
];


const createDefaultSchedule = (): DaySchedule[] => {
    return Array.from({ length: 7 }, (_, i) => ({
        day: i,
        isWorkDay: false,
        startTime: '09:00',
        endTime: '17:00',
    }));
};

let MOCK_AVAILABILITY: DoctorAvailability[] = [
    { 
        doctorId: 'doc1', 
        schedule: createDefaultSchedule().map(d => {
            if ([1, 3, 5].includes(d.day)) {
                return { ...d, isWorkDay: true };
            }
            return d;
        })
    },
    { 
        doctorId: 'doc2', 
        schedule: createDefaultSchedule().map(d => {
            if ([2, 4].includes(d.day)) {
                return { ...d, isWorkDay: true, startTime: '10:00', endTime: '18:00' };
            }
            return d;
        })
    },
];


// --- MOCK API FUNCTIONS ---

const simulateDelay = <T,>(data: T): Promise<T> => new Promise(res => setTimeout(() => res(data), 500));

// Auth
export const login = (email: string, pass: string): Promise<User | null> => {
    const user = MOCK_USERS.find(u => u.email === email && u.password === pass);
    return simulateDelay(user || null);
};

// Generic CRUD for non-user data
const createCRUD = <T extends { id: string }>(mockData: T[]) => ({
    getAll: () => simulateDelay([...mockData]),
    getById: (id: string) => simulateDelay(mockData.find(item => item.id === id) || null),
    create: (item: Omit<T, 'id'>) => {
        const newItem = { ...item, id: `new${Date.now()}` } as T;
        mockData.push(newItem);
        return simulateDelay(newItem);
    },
    update: (id: string, updates: Partial<T>) => {
        const index = mockData.findIndex(item => item.id === id);
        if (index === -1) return simulateDelay(null);
        mockData[index] = { ...mockData[index], ...updates };
        return simulateDelay(mockData[index]);
    },
    delete: (id: string) => {
        const index = mockData.findIndex(item => item.id === id);
        if (index === -1) return simulateDelay(false);
        mockData.splice(index, 1);
        return simulateDelay(true);
    },
});

// Specific CRUD for users (Doctors, Secretaries) to ensure MOCK_USERS is always the source of truth
const createUserCRUD = (role: UserRole) => ({
    getAll: () => simulateDelay(MOCK_USERS.filter(u => u.role === role)),
    getById: (id: string) => simulateDelay(MOCK_USERS.find(item => item.id === id && item.role === role) || null),
    create: (item: Omit<User, 'id'>) => {
        const newUser = { ...item, id: `new${Date.now()}` } as User;
        MOCK_USERS.push(newUser);
        return simulateDelay(newUser);
    },
    update: (id: string, updates: Partial<User>) => {
        const index = MOCK_USERS.findIndex(item => item.id === id && item.role === role);
        if (index === -1) return simulateDelay(null);
        MOCK_USERS[index] = { ...MOCK_USERS[index], ...updates };
        return simulateDelay(MOCK_USERS[index]);
    },
    delete: (id: string) => {
        const index = MOCK_USERS.findIndex(item => item.id === id && item.role === role);
        if (index === -1) return simulateDelay(false);
        MOCK_USERS.splice(index, 1);
        return simulateDelay(true);
    },
});

const patientCRUD = createCRUD(MOCK_PATIENTS);
const activityLogsCRUD = createCRUD(MOCK_ACTIVITY_LOGS);

export const api = {
    doctors: createUserCRUD(UserRole.Doctor),
    secretaries: createUserCRUD(UserRole.Secretary),
    patients: {
        ...patientCRUD,
        create: (item: Omit<Patient, 'id' | 'code'>) => {
            const newItem = { 
                ...item, 
                id: `new${Date.now()}`, 
                code: generatePatientCode(),
                drugAllergy: item.drugAllergy || '',
                chronicDiseases: item.chronicDiseases || '',
                gender: item.gender || Gender.Male,
                isSmoker: item.isSmoker || false,
                isPregnant: item.isPregnant || false,
            } as Patient;
            MOCK_PATIENTS.push(newItem);
            return simulateDelay(newItem);
        },
    },
    treatments: createCRUD(MOCK_TREATMENTS),
    sessions: createCRUD(MOCK_SESSIONS),
    appointments: createCRUD(MOCK_APPOINTMENTS),
    payments: createCRUD(MOCK_PAYMENTS),
    // FIX: Added patientPhotos CRUD endpoint to the api object.
    patientPhotos: createCRUD(MOCK_PATIENT_PHOTOS),
    // FIX: Added activityLogs CRUD endpoint to the api object.
    activityLogs: {
        ...activityLogsCRUD,
        getByUserId: (userId: string) => simulateDelay(MOCK_ACTIVITY_LOGS.filter(log => log.userId === userId)),
    },
    availability: {
        get: (doctorId: string) => simulateDelay(MOCK_AVAILABILITY.find(a => a.doctorId === doctorId) || null),
        set: (doctorId: string, schedule: DaySchedule[]) => {
            const index = MOCK_AVAILABILITY.findIndex(a => a.doctorId === doctorId);
            const newAvailability = { doctorId, schedule };
            if (index > -1) {
                MOCK_AVAILABILITY[index] = newAvailability;
            } else {
                MOCK_AVAILABILITY.push(newAvailability);
            }
            return simulateDelay(newAvailability);
        },
        getAll: () => simulateDelay(MOCK_AVAILABILITY),
    }
};

// Custom getters
export const getPatientsByDoctor = (doctorId: string) => simulateDelay(MOCK_PATIENTS.filter(p => p.doctorId === doctorId));
// FIX: Corrected a logic error where the function was comparing a variable to itself.
export const getSessionsByPatient = (patientId: string) => simulateDelay(MOCK_SESSIONS.filter(s => s.patientId === patientId));