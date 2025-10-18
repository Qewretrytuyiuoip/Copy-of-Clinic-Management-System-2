import { User, UserRole, Patient, Treatment, Session, Appointment, Payment, DoctorAvailability, SessionTreatment, Gender, DaySchedule, PatientPhoto, ActivityLog, ActivityLogActionType } from '../types';
import { API_BASE_URL } from '../config';

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


// --- API FUNCTIONS ---

const simulateDelay = <T,>(data: T): Promise<T> => new Promise(res => setTimeout(() => res(data), 500));

// Helper for authenticated API calls
const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.error('No auth token found for API request');
        throw new Error('Authentication token not found.');
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`API call to ${endpoint} failed:`, response.status, errorText);
        throw new Error(`API call failed: ${response.statusText}`);
    }

    return response.json();
};

// Auth
export const login = async (email: string, password: string): Promise<User | null> => {
    try {
        // Using FormData to send login credentials as per backend requirements.
        // The browser will automatically set the 'Content-Type' header to 'multipart/form-data',
        // which helps avoid CORS preflight issues and is compatible with many server configurations (e.g., PHP).
        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);

        const response = await fetch(`${API_BASE_URL}login`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            try {
                const errorData = await response.json();
                console.error('Login failed:', response.status, response.statusText, errorData);
            } catch (e) {
                const errorText = await response.text();
                console.error('Login failed with non-JSON response:', response.status, response.statusText, errorText);
            }
            return null;
        }

        const data = await response.json();
        
        const userFromApi = data.user;

        if (userFromApi && userFromApi.id && userFromApi.name && userFromApi.role) {
            const user: User = {
                id: String(userFromApi.id), // Convert numeric ID to string
                name: userFromApi.name,
                email: userFromApi.email,
                role: userFromApi.role, // Assuming API role string matches UserRole enum
            };

            if (data.token) {
                // Store the token for future authenticated requests
                localStorage.setItem('authToken', data.token);
            }
            
            return user;
        }

        console.error('Invalid user data received from API:', data);
        return null;

    } catch (error) {
        console.error('An error occurred during the login API call:', error);
        return null;
    }
};

export const logout = async (): Promise<void> => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        // If there's no token, we can't make an authenticated request.
        // The user is already logged out locally.
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            // Log the error but don't prevent client-side logout.
            console.error('Logout API call failed:', response.status, response.statusText);
        }
    } catch (error) {
        // This could be a network error. Log it.
        console.error('An error occurred during the logout API call:', error);
    }
};

// A single source of truth for fetching all users from the API
// Includes a simple cache to avoid redundant network calls.
let allUsersCache: User[] | null = null;
const getAllUsers = async (forceRefresh: boolean = false): Promise<User[]> => {
    if (allUsersCache && !forceRefresh) {
        return allUsersCache;
    }

    try {
        const usersFromApi = await apiFetch('users/all', { method: 'POST' });
        
        if (!Array.isArray(usersFromApi)) {
            console.error('Expected an array of users from API, but got:', usersFromApi);
            allUsersCache = []; // Reset cache to an empty array
            return [];
        }
        
        allUsersCache = usersFromApi.map((apiUser: any) => ({
            id: String(apiUser.id),
            name: apiUser.name,
            email: apiUser.email,
            role: apiUser.role as UserRole,
        }));
        return allUsersCache;
    } catch (error) {
        console.error("Failed to fetch all users:", error);
        return []; // Return empty array on failure to prevent app crash
    }
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

// Specific CRUD for users (Doctors, Secretaries) to fetch from the API
const createUserCRUD = (role: UserRole) => ({
    getAll: async (): Promise<User[]> => {
        const allUsers = await getAllUsers();
        return allUsers.filter(u => u.role === role);
    },
    getById: (id: string) => simulateDelay(MOCK_USERS.find(item => item.id === id && item.role === role) || null),
    create: async (item: Omit<User, 'id'>): Promise<User> => {
        try {
            const formData = new FormData();
            formData.append('name', item.name);
            formData.append('email', item.email);
            if (!item.password) {
                throw new Error("Password is required to create a new user.");
            }
            formData.append('password', item.password);
            formData.append('role', item.role);

            const token = localStorage.getItem('authToken');
            if (!token) throw new Error("Authentication token not found.");

            const response = await fetch(`${API_BASE_URL}users/add`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to create user: ${errorText}`);
            }

            const responseData = await response.json();
            const createdApiUser = responseData.data;

            if (!createdApiUser || !createdApiUser.id) {
                console.error("Invalid API response after creating user. Full response:", responseData);
                const errorMessage = responseData.message || "Invalid API response after creating user.";
                throw new Error(errorMessage);
            }

            const newUser: User = {
                id: String(createdApiUser.id),
                name: createdApiUser.name,
                email: createdApiUser.email,
                role: createdApiUser.role as UserRole,
            };

            allUsersCache = null; // Invalidate cache after creation
            return newUser;
        } catch (error) {
            console.error("Failed to create user via API:", error);
            throw error;
        }
    },
    update: async (id: string, updates: Partial<User>): Promise<User | null> => {
        try {
            const formData = new FormData();
            formData.append('id', id);

            // Only append fields that are being updated
            if (updates.name) {
                formData.append('name', updates.name);
            }
            if (updates.email) {
                formData.append('email', updates.email);
            }
            // Only send password if a new one is provided and is not empty
            if (updates.password && updates.password.length > 0) {
                formData.append('password', updates.password);
            }

            const token = localStorage.getItem('authToken');
            if (!token) throw new Error("Authentication token not found.");

            const response = await fetch(`${API_BASE_URL}users/edit`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to update user: ${errorText}`);
            }

            const responseData = await response.json();
            const updatedApiUser = responseData.data;

            if (!updatedApiUser || !updatedApiUser.id) {
                console.error("Invalid API response after updating user. Full response:", responseData);
                throw new Error(responseData.message || "Invalid API response after updating user.");
            }

            const updatedUser: User = {
                id: String(updatedApiUser.id),
                name: updatedApiUser.name,
                email: updatedApiUser.email,
                role: updatedApiUser.role as UserRole,
            };
            
            allUsersCache = null; // Invalidate cache after update
            return updatedUser;

        } catch (error) {
            console.error(`Failed to update user with ID ${id} via API:`, error);
            throw error;
        }
    },
    delete: async (id: string): Promise<boolean> => {
        try {
            const formData = new FormData();
            formData.append('id', id);

            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error("Authentication token not found.");
            }

            const response = await fetch(`${API_BASE_URL}users/delete`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to delete user: ${errorText}`);
            }

            allUsersCache = null; // Invalidate cache on successful deletion
            return true;
        } catch (error) {
            console.error(`Failed to delete user with ID ${id} via API:`, error);
            throw error; // Re-throw to be handled by the UI
        }
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