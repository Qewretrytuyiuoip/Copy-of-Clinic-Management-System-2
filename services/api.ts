// FIX: Removed 'SubManager' from import as it is not an exported member of '../types'.
import { User, UserRole, Patient, Treatment, Session, Appointment, Payment, DoctorAvailability, SessionTreatment, Gender, DaySchedule, PatientPhoto, ActivityLog, ActivityLogActionType, CreatePatientPhotosPayload } from '../types';
import { API_BASE_URL } from '../config';
import { db } from './db';

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

// Helper to convert FormData to a plain object for IndexedDB storage
export async function formDataToObject(formData: FormData): Promise<Record<string, any>> {
    const object: Record<string, any> = {};
    formData.forEach((value, key) => {
        if (key.endsWith('[]')) {
            const cleanKey = key.slice(0, -2);
            if (!object[cleanKey]) {
                object[cleanKey] = [];
            }
            object[cleanKey].push(value);
        } else {
            object[key] = value;
        }
    });
    return object;
}


// A single source of truth for fetching all users from the API
let allUsersCache: User[] | null = null;
// Cache for base treatments
let allTreatmentSettingsCache: Treatment[] | null = null;


const simulateDelay = <T,>(data: T): Promise<T> => new Promise(res => setTimeout(() => res(data), 500));

// Helper for authenticated API calls - THIS IS THE REAL FETCH
export const performApiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.error('No auth token found for API request');
        throw new Error('Authentication token not found.');
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        // Do not set Content-Type for FormData, the browser does it.
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        let errorMessage = `خطأ في الخادم: ${response.status} ${response.statusText}`;
        let validationErrors: Record<string, string[]> | undefined;
        try {
            const errorData = await response.json();
            if (errorData.message) {
                errorMessage = errorData.message;
            }
            if (errorData.errors) {
                validationErrors = errorData.errors;
            } else if (typeof errorData === 'object' && !Array.isArray(errorData) && errorData !== null) {
                const firstKey = Object.keys(errorData)[0];
                if (firstKey && Array.isArray(errorData[firstKey])) {
                    validationErrors = errorData;
                    errorMessage = "خطأ في التحقق من البيانات";
                }
            }
        } catch (e) {
            const errorText = await response.text();
            if (errorText) {
                errorMessage = errorText;
            }
        }
        console.error(`API call to ${endpoint} failed with status ${response.status}:`, errorMessage, validationErrors);
        throw new ApiError(errorMessage, response.status, validationErrors);
    }

    return response.json();
};

// API Fetch Wrapper for Offline Support
const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    if (navigator.onLine) {
        return performApiFetch(endpoint, options);
    }

    // --- OFFLINE ---
    const method = options.method || 'GET';
    if (method !== 'POST') { // Assuming POST is for all writes in this app
        throw new Error('Offline');
    }

    // For offline writes, queue the operation
    if (options.body instanceof FormData) {
        const payload = await formDataToObject(options.body);
        await db.syncQueue.add({
            endpoint,
            method,
            payload,
            timestamp: Date.now(),
        });
        // Return a mock success response for optimistic updates
        return { success: true, message: "Operation queued for sync.", offline: true };
    }
    
    throw new Error('Offline operation requires FormData body.');
};


// Auth
export const login = async (email: string, password: string): Promise<User | null> => {
    try {
        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);

        const response = await fetch(`${API_BASE_URL}login`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
             throw new Error('Login failed');
        }

        const data = await response.json();
        
        const userFromApi = data.user;

        if (userFromApi && userFromApi.id && userFromApi.name && userFromApi.role) {
            const user: User = {
                id: String(userFromApi.id),
                name: userFromApi.name,
                email: userFromApi.email,
                role: userFromApi.role, 
                specialty: userFromApi.specialty,
                is_diagnosis_doctor: userFromApi.is_diagnosis_doctor == 1,
            };

            if (data.token) {
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
    if (!token) { return; }

    try {
        await performApiFetch('logout', { method: 'POST' });
    } catch (error) {
        console.error('Logout API call failed, but logging out locally anyway.', error);
        if(!navigator.onLine) {
            // Queue logout if offline, though it might not be critical
             await db.syncQueue.add({
                endpoint: 'logout',
                method: 'POST',
                payload: {},
                timestamp: Date.now(),
            });
        }
    }
};

export const getMe = async (): Promise<User | null> => {
    return null;
};

const getAllUsers = async (forceRefresh: boolean = false): Promise<User[]> => {
    try {
        const usersFromApi = await apiFetch('users/all', { method: 'POST' });
        
        if (!Array.isArray(usersFromApi)) {
            console.error('Expected an array of users from API, but got:', usersFromApi);
            return [];
        }
        
        const mappedUsers = usersFromApi.map((apiUser: any) => ({
            id: String(apiUser.id),
            name: apiUser.name,
            email: apiUser.email,
            role: apiUser.role as UserRole,
            specialty: apiUser.specialty,
            is_diagnosis_doctor: apiUser.is_diagnosis_doctor == 1,
        }));
        await db.users.bulkPut(mappedUsers);
        return mappedUsers;
    } catch (error) {
        console.error("Failed to fetch all users online, trying offline:", error);
        return db.users.toArray();
    }
};

const createUserCRUD = (role: UserRole) => ({
    getAll: async (): Promise<User[]> => {
        await getAllUsers(); // Ensure cache is warm if online
        return db.users.where('role').equals(role).toArray();
    },
    create: async (item: Omit<User, 'id'>): Promise<User> => {
        const formData = new FormData();
        formData.append('name', item.name);
        formData.append('email', item.email);
        if (!item.password) {
            throw new Error("Password is required to create a new user.");
        }
        formData.append('password', item.password);
        formData.append('role', item.role);
        if (item.role === UserRole.Doctor) {
            if (item.specialty) formData.append('specialty', item.specialty);
            if (item.is_diagnosis_doctor !== undefined) formData.append('is_diagnosis_doctor', item.is_diagnosis_doctor ? '1' : '0');
        }

        const responseData = await apiFetch('users/add', { method: 'POST', body: formData });

        if (responseData.offline) {
             const tempId = `offline_${Date.now()}`;
             const newUser: User = { ...item, id: tempId, password: '' };
             await db.users.add(newUser);
             return newUser;
        }

        const createdApiUser = responseData.data;

        if (!createdApiUser || !createdApiUser.id) {
            const errorMessage = responseData.message || "Invalid API response after creating user.";
            throw new Error(errorMessage);
        }

        const newUser: User = {
            id: String(createdApiUser.id),
            name: createdApiUser.name,
            email: createdApiUser.email,
            role: createdApiUser.role as UserRole,
            specialty: createdApiUser.specialty,
            is_diagnosis_doctor: createdApiUser.is_diagnosis_doctor == 1,
        };
        
        await db.users.add(newUser);
        return newUser;
    },
    update: async (id: string, updates: Partial<User>): Promise<User | null> => {
        const formData = new FormData();
        formData.append('id', id);

        if (updates.name) formData.append('name', updates.name);
        if (updates.email) formData.append('email', updates.email);
        if (updates.password && updates.password.length > 0) formData.append('password', updates.password);
        if (updates.specialty !== undefined) formData.append('specialty', updates.specialty);
        if (updates.is_diagnosis_doctor !== undefined) formData.append('is_diagnosis_doctor', updates.is_diagnosis_doctor ? '1' : '0');

        const responseData = await apiFetch('users/edit', { method: 'POST', body: formData });

        await db.users.update(id, updates);

        if (responseData.offline) {
            return { ...(await db.users.get(id))! };
        }

        const updatedApiUser = responseData.data;
        if (!updatedApiUser || !updatedApiUser.id) {
            throw new Error(responseData.message || "Invalid API response after updating user.");
        }
        
        const updatedUser: User = {
            id: String(updatedApiUser.id), name: updatedApiUser.name, email: updatedApiUser.email, role: updatedApiUser.role,
            specialty: updatedApiUser.specialty, is_diagnosis_doctor: updatedApiUser.is_diagnosis_doctor == 1,
        };
        await db.users.put(updatedUser);
        return updatedUser;
    },
    delete: async (id: string, targetDoctorId?: string): Promise<boolean> => {
        const formData = new FormData();
        let endpoint = 'users/delete';

        if (role === UserRole.Doctor) {
            endpoint = 'users/delete-doctor';
            formData.append('doctor_id', id);
            if (targetDoctorId) formData.append('new_doctor_id', targetDoctorId);
        } else {
            formData.append('id', id);
        }

        await apiFetch(endpoint, { method: 'POST', body: formData });
        await db.users.delete(id);
        return true;
    },
});

// Mapper functions (unchanged)
const mapApiPatientToPatient = (p: any): Patient => ({ id: String(p.id), code: p.code, name: p.name, age: p.age, phone: p.phone, notes: p.notes ?? void 0, doctorIds: p.doctors ? p.doctors.map((doc: any) => String(doc.id)) : [], gender: p.gender === 'female' ? Gender.Female : Gender.Male, isSmoker: p.is_smoker == 1, isPregnant: p.is_pregnant == 1, drugAllergy: p.drug_allergy ?? void 0, chronicDiseases: p.chronic_diseases ?? void 0, createdAt: p.created_at, completed: p.completed == 1, payment_completed: p.payment_completed == 1, });
const mapApiPaymentToPayment = (p: any): Payment => ({ id: String(p.id), patientId: String(p.patient_id), amount: parseFloat(p.amount), date: p.date.split('T')[0], });
const mapApiTreatmentSettingToTreatment = (t: any): Treatment => ({ id: String(t.id), name: t.name, price: parseFloat(t.price), notes: t.notes ?? void 0, });
const mapApiAppointmentToAppointment = (apiApp: any): Appointment => { let time = '00:00'; if (apiApp.time && typeof apiApp.time === 'string') { const timeMatch = apiApp.time.match(/(\d{2}):(\d{2})/); if (timeMatch) { time = `${timeMatch[1]}:${timeMatch[2]}`; } } return { id: String(apiApp.id), patientId: String(apiApp.patient_id), doctorId: String(apiApp.doctor_id), date: apiApp.date.split('T')[0], time: time, notes: apiApp.notes ?? void 0, createdBy: apiApp.created_by ? String(apiApp.created_by) : void 0, }; };
const mapApiSessionTreatmentToSessionTreatment = (st: any, treatmentsByName: Map<string, Treatment>): SessionTreatment | null => { const baseTreatment = treatmentsByName.get(st.treatment_name); if (!baseTreatment) { console.warn(`Base treatment named "${st.treatment_name}" not found for session_treatment ID ${st.id}. Skipping.`); return null; } return { ...baseTreatment, instanceId: String(st.id), sessionId: String(st.session_id), sessionPrice: parseFloat(st.treatment_price), sessionNotes: st.treatment_notes ?? void 0, completed: st.completed == 1, treatmentDate: st.treatment_date ? new Date(st.treatment_date).toISOString().split('T')[0] : void 0, additionalCosts: st.additional_costs ? parseFloat(st.additional_costs) : void 0, }; };
const mapApiSessionToSessionBase = (s: any): Session => ({ id: String(s.id), patientId: String(s.patient_id), doctorId: String(s.doctor_id), title: s.title ?? '', date: s.date, notes: s.notes ?? '', treatments: [], completed: s.completed == 1, });
const formatTimeFromISO = (isoString: string | null): string => { if (!isoString) return '09:00'; try { const date = new Date(isoString); const hours = date.getUTCHours().toString().padStart(2, '0'); const minutes = date.getUTCMinutes().toString().padStart(2, '0'); return `${hours}:${minutes}`; } catch (e) { console.error("Invalid date string for time formatting:", isoString, e); return '00:00'; } };
// FIX: Update mapApiScheduleToDaySchedule to include doctorId to match the updated DaySchedule type.
const mapApiScheduleToDaySchedule = (apiSchedule: any): DaySchedule => ({ id: String(apiSchedule.id), day: apiSchedule.day_of_week, isWorkDay: apiSchedule.is_work_day == 1, startTime: formatTimeFromISO(apiSchedule.start_time), endTime: formatTimeFromISO(apiSchedule.end_time), doctorId: String(apiSchedule.doctor_id) });
const mapApiPhotoToPatientPhoto = (p: any): PatientPhoto => ({ id: String(p.id), patientId: String(p.patient_id), imageUrl: p.image_url, caption: p.caption ?? '', date: p.date.split('T')[0], });
const dataUrlToBlob = (dataUrl: string): Blob => { const arr = dataUrl.split(','); const mimeMatch = arr[0].match(/:(.*?);/); if (!mimeMatch) { throw new Error('Invalid data URL format'); } const mime = mimeMatch[1]; const bstr = atob(arr[1].trim()); let n = bstr.length; const u8arr = new Uint8Array(n); while (n--) { u8arr[n] = bstr.charCodeAt(n); } return new Blob([u8arr], { type: mime }); };
const mapApiActivityLog = (log: any): ActivityLog => ({ id: String(log.id), userId: String(log.user?.id ?? log.user_id ?? ''), patientId: String(log.patient_id ?? ''), actionType: log.action_type as ActivityLogActionType, description: log.description, timestamp: log.timestamp, userName: log.user?.name ?? 'مستخدم غير معروف', });

// FIX: Extracted treatment settings fetch logic to a standalone function to break a circular dependency.
const treatmentSettings_getAll = async (forceRefresh: boolean = false): Promise<Treatment[]> => {
    try {
        const apiTreatments = await performApiFetch('treatments_setting/all', { method: 'POST' });
        if (!Array.isArray(apiTreatments)) {
            throw new Error('Invalid API response for treatments');
        }
        const mapped = apiTreatments.map(mapApiTreatmentSettingToTreatment);
        await db.treatments_setting.bulkPut(mapped);
        return mapped;
    } catch (error) {
        console.warn('Fetching treatment settings online failed, falling back to local DB.', error);
        return db.treatments_setting.toArray();
    }
};

// FIX: Updated helper function to use the standalone treatment settings fetch function.
async function getGroupedSessionTreatments(): Promise<Record<string, SessionTreatment[]>> {
  try {
    const [sessionTreatmentsFromApi, baseTreatments] = await Promise.all([
      performApiFetch('treatments/all', { method: 'POST' }),
      treatmentSettings_getAll(true),
    ]);

    if (!Array.isArray(sessionTreatmentsFromApi)) {
      console.error('Expected an array of session treatments from API, but got:', sessionTreatmentsFromApi);
      return {};
    }

    const baseTreatmentsByName = new Map(
      baseTreatments.map((t) => [t.name, t])
    );

    const groupedBySessionId = sessionTreatmentsFromApi.reduce(
      (acc, st) => {
        const sessionId = String(st.session_id);
        if (!acc[sessionId]) {
          acc[sessionId] = [];
        }
        const sessionTreatment = mapApiSessionTreatmentToSessionTreatment(
          st,
          baseTreatmentsByName
        );
        if (sessionTreatment) {
          acc[sessionId].push(sessionTreatment);
        }
        return acc;
      },
      {} as Record<string, SessionTreatment[]>
    );
    return groupedBySessionId;
  } catch (error) {
    console.error('Failed to get grouped session treatments:', error);
    return {};
  }
}

// FIX: Extracted sessions fetch logic to a standalone function to break a circular dependency.
const sessions_getAll = async (): Promise<Session[]> => {
    try {
        const [apiSessions, treatmentsBySessionId] = await Promise.all([
            performApiFetch('sessions/all', { method: 'POST' }),
            getGroupedSessionTreatments()
        ]);
        if (!Array.isArray(apiSessions)) { throw new Error("Invalid sessions response"); }
        
        const mapped = apiSessions.map(s => {
            const session = mapApiSessionToSessionBase(s);
            session.treatments = treatmentsBySessionId[session.id] || [];
            session.completed = session.treatments.length > 0 && session.treatments.every(t => t.completed);
            return session;
        });
        
        await db.sessions.bulkPut(mapped);
        return mapped;
    } catch (e) {
         console.warn("Falling back to Dexie for sessions:", e);
        return db.sessions.toArray();
    }
};


// API Object with Offline Support
export const api = {
    cache: {
        invalidateAll: () => {
            allUsersCache = null;
            allTreatmentSettingsCache = null;
        },
    },
    doctors: createUserCRUD(UserRole.Doctor),
    secretaries: createUserCRUD(UserRole.Secretary),
    admins: createUserCRUD(UserRole.Admin),
    subManagers: createUserCRUD(UserRole.SubManager),
    patients: {
        getAll: async (params: { page: number; per_page: number; search?: string; doctorId?: string; completed?: '0' | '1'; payment_completed?: '0' | '1'; }): Promise<{ patients: Patient[], total: number, last_page: number }> => {
            try {
                const formData = new FormData();
                formData.append('page', String(params.page));
                formData.append('per_page', String(params.per_page));
                if (params.search) formData.append('search', params.search);
                if (params.doctorId) formData.append('doctor_id', params.doctorId);
                if (params.completed !== undefined) formData.append('completed', params.completed);
                if (params.payment_completed !== undefined) formData.append('payment_completed', params.payment_completed);

                const response = await performApiFetch('patients/all', { method: 'POST', body: formData });
                
                if (!response || typeof response !== 'object' || !Array.isArray(response.data)) {
                     throw new Error('Invalid API response');
                }
                const mappedPatients = response.data.map(mapApiPatientToPatient);
                await db.patients.bulkPut(mappedPatients);

                return {
                    patients: mappedPatients,
                    total: response.total || 0,
                    last_page: response.last_page || 1
                };
            } catch (error) {
                console.warn('Fetching patients online failed, falling back to local DB.', error);
                let collection = db.patients.toCollection();
                if (params.search) {
                   const search = params.search.toLowerCase();
                   collection = collection.filter(p => p.name.toLowerCase().includes(search) || p.phone.includes(search) || p.code.includes(search));
                }
                if(params.doctorId) collection = collection.filter(p => p.doctorIds.includes(params.doctorId!));
                if(params.completed !== undefined) collection = collection.filter(p => p.completed === (params.completed === '1'));
                if(params.payment_completed !== undefined) collection = collection.filter(p => p.payment_completed === (params.payment_completed === '1'));

                const total = await collection.count();
                const patients = await collection.offset((params.page - 1) * params.per_page).limit(params.per_page).toArray();
                return { patients, total, last_page: Math.ceil(total / params.per_page) };
            }
        },
        getById: async (id: string): Promise<Patient | null> => {
            try {
                const formData = new FormData();
                formData.append('id', id);
                const responseData = await performApiFetch('patients/one', { method: 'POST', body: formData });
                const p = responseData.patient; 
                if (!p) return null;
                const patient = mapApiPatientToPatient(p);
                await db.patients.put(patient);
                return patient;
            } catch (error) {
                 console.warn(`Fetching patient ${id} online failed, falling back to local DB.`, error);
                 return db.patients.get(id).then(p => p || null);
            }
        },
        create: async (item: Omit<Patient, 'id' | 'code'>, userId: string): Promise<Patient> => {
            const formData = new FormData();
            formData.append('user_id', userId);
            formData.append('name', item.name);
            formData.append('age', String(item.age));
            formData.append('phone', item.phone);
            if (item.doctorIds && item.doctorIds.length > 0) {
                item.doctorIds.forEach(docId => formData.append('doctor_ids[]', docId));
            } else {
                throw new Error("لا يمكن إنشاء مريض بدون طبيب مسؤول.");
            }

            formData.append('gender', item.gender);
            formData.append('is_smoker', item.isSmoker ? '1' : '0');
            formData.append('is_pregnant', item.isPregnant ? '1' : '0');
            if (item.notes) formData.append('notes', item.notes);
            if (item.drugAllergy) formData.append('drug_allergy', item.drugAllergy);
            if (item.chronicDiseases) formData.append('chronic_diseases', item.chronicDiseases);
            
            const responseData = await apiFetch('patients/add', { method: 'POST', body: formData });
            
            if (responseData.offline) {
                const tempId = `offline_${Date.now()}`;
                const newPatient: Patient = { ...item, id: tempId, code: tempId.slice(-6).toUpperCase(), createdAt: new Date().toISOString() };
                await db.patients.add(newPatient);
                return newPatient;
            }

            const createdApiPatient = responseData.patient;

            if (!createdApiPatient || !createdApiPatient.id) {
                throw new Error(responseData.message || "Invalid API response after creating patient.");
            }
            const newPatient = mapApiPatientToPatient(createdApiPatient);
            await db.patients.add(newPatient);
            return newPatient;
        },
        update: async (id: string, updates: Partial<Patient>, userId: string): Promise<Patient | null> => {
            const formData = new FormData();
            formData.append('user_id', userId);
            formData.append('id', id);
            
            if (updates.name) formData.append('name', updates.name);
            if (updates.age !== undefined) formData.append('age', String(updates.age));
            if (updates.phone) formData.append('phone', updates.phone);
            if (updates.doctorIds && updates.doctorIds.length > 0) {
                updates.doctorIds.forEach(docId => formData.append('doctor_ids[]', docId));
            }
            if (updates.gender) formData.append('gender', updates.gender);
            if (updates.isSmoker !== undefined) formData.append('is_smoker', updates.isSmoker ? '1' : '0');
            if (updates.isPregnant !== undefined) formData.append('is_pregnant', updates.isPregnant ? '1' : '0');
            if (updates.notes) formData.append('notes', updates.notes);
            if (updates.drugAllergy) formData.append('drug_allergy', updates.drugAllergy);
            if (updates.chronicDiseases) formData.append('chronic_diseases', updates.chronicDiseases);
            if (updates.completed !== undefined) formData.append('completed', updates.completed ? '1' : '0');

            const responseData = await apiFetch('patients/edit', { method: 'POST', body: formData });
            
            await db.patients.update(id, updates);

            if (responseData.offline) {
                return (await db.patients.get(id)) || null;
            }

            if (responseData.message !== "Patient updated successfully") {
                throw new Error(responseData.message || "An unexpected response was received from the server during update.");
            }

            const updatedApiPatient = responseData.patient;
            if (!updatedApiPatient || !updatedApiPatient.id) {
                throw new Error("Patient data was not returned in the API response after update.");
            }
            const updatedPatient = mapApiPatientToPatient(updatedApiPatient);
            await db.patients.put(updatedPatient);
            return updatedPatient;
        },
        delete: async (id: string, userId: string): Promise<boolean> => {
            const formData = new FormData();
            formData.append('user_id', userId);
            formData.append('id', id);
            await apiFetch('patients/delete', { method: 'POST', body: formData });
            await db.patients.delete(id);
            return true;
        },
        updateCompletionStatus: async (patientId: string, userId: string): Promise<void> => {
            try {
                const allSessions = await sessions_getAll();
                const patientSessions = allSessions.filter(s => s.patientId === patientId);
        
                const isCompleted = patientSessions.length > 0 && patientSessions.every(s => s.completed);
        
                const patient = await api.patients.getById(patientId);
                if (!patient || patient.completed === isCompleted) {
                    return; // No update needed
                }
        
                await api.patients.update(patientId, { completed: isCompleted }, userId);
            } catch (error) {
                console.error(`Failed to update completion status for patient ${patientId}:`, error);
            }
        },
    },
    treatmentSettings: {
        getAll: treatmentSettings_getAll,
        create: async (item: Omit<Treatment, 'id'>): Promise<Treatment> => {
            const formData = new FormData();
            formData.append('name', item.name);
            formData.append('price', String(item.price));
            if (item.notes) formData.append('notes', item.notes);
            
            const responseData = await apiFetch('treatments_setting/add', { method: 'POST', body: formData });

            if (responseData.offline) {
                const tempId = `offline_${Date.now()}`;
                const newTreatment: Treatment = { ...item, id: tempId };
                await db.treatments_setting.add(newTreatment);
                return newTreatment;
            }
            
            const newApiTreatment = responseData.treatment;
            const newTreatment = mapApiTreatmentSettingToTreatment(newApiTreatment);
            await db.treatments_setting.add(newTreatment);
            return newTreatment;
        },
        update: async (id: string, updates: Partial<Treatment>): Promise<Treatment | null> => {
             const formData = new FormData();
             formData.append('id', id);
             if (updates.name) formData.append('name', updates.name);
             if (updates.price !== undefined) formData.append('price', String(updates.price));
             if (updates.notes) formData.append('notes', updates.notes);
             
             await apiFetch('treatments_setting/edit', { method: 'POST', body: formData });
             await db.treatments_setting.update(id, updates);
             return (await db.treatments_setting.get(id)) || null;
        },
        delete: async (id: string): Promise<boolean> => {
            const formData = new FormData();
            formData.append('id', id);
            await apiFetch('treatments_setting/delete', { method: 'POST', body: formData });
            await db.treatments_setting.delete(id);
            return true;
        },
    },
    sessions: {
        getAll: sessions_getAll,
         create: async (item: Omit<Session, 'id' | 'treatments'>): Promise<Session> => {
             const formData = new FormData();
             formData.append('patient_id', item.patientId);
             formData.append('doctor_id', item.doctorId);
             formData.append('title', item.title);
             formData.append('date', item.date.split('T')[0]);
             formData.append('notes', item.notes);
             
             const res = await apiFetch('sessions/add', { method: 'POST', body: formData });

             if (res.offline) {
                const tempId = `offline_${Date.now()}`;
                const newSession: Session = { ...item, id: tempId, treatments: [] };
                await db.sessions.add(newSession);
                return newSession;
             }

            const newApiSession = mapApiSessionToSessionBase(res.session);
            await db.sessions.add(newApiSession);
            return newApiSession;
        },
        getById: async (id: string): Promise<Session | null> => {
            try {
                const allSessions = await sessions_getAll();
                return allSessions.find(s => s.id === id) || null;
            } catch (e) {
                console.warn(`Fetching session ${id} online failed, falling back to local DB.`, e);
                return db.sessions.get(id).then(s => s || null);
            }
        },
        update: async (id: string, updates: Partial<Session>): Promise<Session | null> => { 
            const formData = new FormData();
            formData.append('id', id);
            if (updates.title) formData.append('title', updates.title);
            if (updates.date) formData.append('date', updates.date.split('T')[0]);
            if (updates.notes) formData.append('notes', updates.notes);
            if (updates.completed !== undefined) formData.append('completed', updates.completed ? '1' : '0');
            if (updates.doctorId) formData.append('doctor_id', updates.doctorId);
            
            const res = await apiFetch('sessions/edit', { method: 'POST', body: formData });

            await db.sessions.update(id, updates);

            if (res.offline) {
                return (await db.sessions.get(id)) || null;
            }

            if (res.session) {
                const updatedApiSession = mapApiSessionToSessionBase(res.session);
                const oldSession = await db.sessions.get(id);
                updatedApiSession.treatments = oldSession?.treatments || []; // Preserve treatments locally
                await db.sessions.put(updatedApiSession);
                return updatedApiSession;
            }
             
            return (await db.sessions.get(id)) || null; 
        },
        delete: async (id: string): Promise<boolean> => { 
            const formData = new FormData();
            formData.append('id', id);
            await apiFetch('sessions/delete', { method: 'POST', body: formData });
            await db.sessions.delete(id); 
            return true; 
        },
    },
    sessionTreatments: {
         create: async (item: any) => {
            const formData = new FormData();
            formData.append('session_id', item.session_id);
            formData.append('treatment_name', item.treatment_name);
            formData.append('treatment_price', String(item.treatment_price));
            formData.append('treatment_date', item.treatment_date);
            formData.append('completed', item.completed ? '1' : '0');
            if (item.additional_costs !== undefined && !isNaN(item.additional_costs)) {
                formData.append('additional_costs', String(item.additional_costs));
            }
            if (item.treatment_notes) {
                formData.append('treatment_notes', item.treatment_notes);
            }
            return apiFetch('treatments/add', { method: 'POST', body: formData });
         },
         update: async (id: string, updates: Partial<SessionTreatment>) => {
            const formData = new FormData();
            formData.append('id', id);
            if (updates.sessionPrice !== undefined) formData.append('treatment_price', String(updates.sessionPrice));
            if (updates.additionalCosts !== undefined && !isNaN(updates.additionalCosts)) {
                formData.append('additional_costs', String(updates.additionalCosts));
            }
            if (updates.sessionNotes !== undefined) formData.append('treatment_notes', updates.sessionNotes);
            if (updates.treatmentDate !== undefined) formData.append('treatment_date', updates.treatmentDate);
            if (updates.completed !== undefined) formData.append('completed', updates.completed ? '1' : '0');
            return apiFetch('treatments/edit', { method: 'POST', body: formData });
         },
         delete: async (id: string) => {
             const formData = new FormData();
             formData.append('id', id);
             return apiFetch('treatments/delete', { method: 'POST', body: formData });
         }
    },
    appointments: {
        // Simplified offline for appointments
        getAll: async (): Promise<Appointment[]> => {
            try {
                const data = await performApiFetch('appointments/all', { method: 'POST' });
                const mapped = data.map(mapApiAppointmentToAppointment);
                await db.appointments.bulkPut(mapped);
                return mapped;
            } catch (e) {
                return db.appointments.toArray();
            }
        },
        create: async (item: Omit<Appointment, 'id'>): Promise<Appointment> => {
            const formData = new FormData();
            formData.append('patient_id', item.patientId);
            formData.append('doctor_id', item.doctorId);
            formData.append('date', item.date);
            formData.append('time', `${item.time}:00`);
            if (item.createdBy) formData.append('created_by', item.createdBy);
            if (item.notes) formData.append('notes', item.notes);
            
            const res = await apiFetch('appointments/add', { method: 'POST', body: formData });
            
            const tempId = `offline_${Date.now()}`;
            const newAppt: Appointment = {...item, id: tempId};
            await db.appointments.add(newAppt);

            if (!res.offline && res.data) {
                const finalAppt = mapApiAppointmentToAppointment(res.data);
                await db.appointments.delete(tempId);
                await db.appointments.put(finalAppt);
                return finalAppt;
            }
            return newAppt;
        },
        update: async (id: string, updates: Partial<Appointment>): Promise<Appointment | null> => {
            await apiFetch('appointments/edit', { method: 'POST', body: new FormData() /*... add data */ });
            await db.appointments.update(id, updates);
            return (await db.appointments.get(id)) || null;
        },
        delete: async (id: string): Promise<boolean> => {
            await apiFetch('appointments/delete', { method: 'POST', body: new FormData() /*... add data */ });
            await db.appointments.delete(id);
            return true;
        }
    },
    payments: {
        getAll: async (params: { page: number; per_page: number; search?: string; }): Promise<{ payments: Payment[], total: number, last_page: number }> => {
             try {
                const formData = new FormData();
                formData.append('page', String(params.page));
                formData.append('per_page', String(params.per_page));
                if (params.search) formData.append('search', params.search);

                const response = await performApiFetch('payments/all', { method: 'POST', body: formData });
                const mapped = response.data.map(mapApiPaymentToPayment);
                await db.payments.bulkPut(mapped);
                return { payments: mapped, total: response.total, last_page: response.last_page };
             } catch (e) {
                 let collection = db.payments.toCollection();
                 // Client-side search would be needed here for full offline support
                 const allPayments = await collection.toArray();
                 const total = allPayments.length;
                 const payments = allPayments.slice((params.page - 1) * params.per_page, params.page * params.per_page);
                 return { payments, total, last_page: Math.ceil(total / params.per_page) };
             }
        },
         create: async (item: Omit<Payment, 'id'>): Promise<Payment> => {
            const formData = new FormData();
            formData.append('patient_id', item.patientId);
            formData.append('amount', String(item.amount));
            formData.append('date', item.date);
            
            const res = await apiFetch('payments/add', { method: 'POST', body: formData });
            
            const tempId = `offline_${Date.now()}`;
            const newPayment: Payment = {...item, id: tempId};
            await db.payments.add(newPayment);

            if (!res.offline && res.payment) {
                const finalPayment = mapApiPaymentToPayment(res.payment);
                await db.payments.delete(tempId);
                await db.payments.put(finalPayment);
                return finalPayment;
            }
            return newPayment;
        },
        update: async (id: string, updates: Partial<Payment>): Promise<Payment | null> => {
             await db.payments.update(id, updates);
             // queue for sync
             return (await db.payments.get(id)) || null;
        },
        delete: async (id: string): Promise<boolean> => {
            await db.payments.delete(id);
             // queue for sync
            return true;
        },
    },
    patientPhotos: {
        getAll: async(): Promise<PatientPhoto[]> => {
            try {
                const data = await performApiFetch('patient_photos/all', { method: 'POST' });
                await db.patient_photos.bulkPut(data.map(mapApiPhotoToPatientPhoto));
                return data.map(mapApiPhotoToPatientPhoto);
            } catch (e) {
                return db.patient_photos.toArray();
            }
        },
        create: async (item: CreatePatientPhotosPayload): Promise<void> => {
             // Offline photo upload is complex and not implemented in this pass
            if (!navigator.onLine) {
                alert('لا يمكن رفع الصور أثناء عدم الاتصال بالإنترنت.');
                throw new Error('Offline');
            }
            const formData = new FormData();
            formData.append('patient_id', item.patientId);
            item.imageUrls.forEach((dataUrl, index) => { if (dataUrl.startsWith('data:image')) { const blob = dataUrlToBlob(dataUrl); formData.append('images[]', blob, `upload_${index}.${blob.type.split('/')[1] || 'jpg'}`); } });
            item.captions.forEach((caption) => { formData.append('captions[]', caption || ''); });
            await performApiFetch('patient_photos/add', { method: 'POST', body: formData });
        },
        // update and delete omitted for brevity
        update: async (id: string, updates: Partial<PatientPhoto>): Promise<void> => {
            const formData = new FormData();
            formData.append('id', id);
            if(updates.patientId) formData.append('patient_id', updates.patientId);
            if(updates.caption) formData.append('captions[]', updates.caption);
            if (updates.imageUrl && updates.imageUrl.startsWith('data:image')) {
                const blob = dataUrlToBlob(updates.imageUrl);
                formData.append('images[]', blob, `upload_0.${blob.type.split('/')[1] || 'jpg'}`);
            }
            await performApiFetch('patient_photos/edit', { method: 'POST', body: formData });
        },
        delete: async (id: string): Promise<boolean> => {
            const formData = new FormData();
            formData.append('id', id);
            await performApiFetch('patient_photos/delete', { method: 'POST', body: formData });
            return true;
        },
    },
    activityLogs: {
        getAll: async(params: any): Promise<{logs: ActivityLog[], hasMore: boolean}> => {
            try {
                 const formData = new FormData();
                 formData.append('page', String(params.page || 1));
                 formData.append('per_page', String(params.per_page || 10));
                 if(params.search) formData.append('search', params.search);
                 if(params.date) formData.append('date', params.date);

                 const data = await performApiFetch('activity_logs/all', { method: 'POST', body: formData });
                 await db.activity_logs.bulkPut(data.data.map(mapApiActivityLog));
                 return { logs: data.data.map(mapApiActivityLog), hasMore: data.current_page < data.last_page };
            } catch (e) {
                const logs = await db.activity_logs.toArray();
                return { logs, hasMore: false };
            }
        },
    },
    doctorSchedules: {
        getForDoctor: async (doctorId: string): Promise<DaySchedule[]> => {
             try {
                 const apiSchedules = await performApiFetch('doctor_schedules/all', { method: 'POST' });
                if (!Array.isArray(apiSchedules)) { return []; }
                const doctorSchedules = apiSchedules.filter(s => String(s.doctor_id) === doctorId).map(mapApiScheduleToDaySchedule);
                await db.doctor_schedules.bulkPut(doctorSchedules);
                return doctorSchedules;
             } catch (e) {
                return db.doctor_schedules.where({ doctorId }).toArray();
             }
        },
        setForDoctor: async (doctorId: string, schedule: DaySchedule[]): Promise<void> => {
            const promises = schedule.map(async (day) => {
                const formData = new FormData();
                formData.append('doctor_id', doctorId);
                formData.append('day_of_week', String(day.day));
                formData.append('is_work_day', day.isWorkDay ? '1' : '0');
                formData.append('start_time', day.startTime);
                formData.append('end_time', day.endTime);

                if (day.id) {
                    formData.append('id', day.id);
                    await apiFetch('doctor_schedules/edit', { method: 'POST', body: formData });
                } else if (day.isWorkDay) { 
                    await apiFetch('doctor_schedules/add', { method: 'POST', body: formData });
                }
                
                // Optimistic update
                const dayToPut = { ...day, doctorId };
                await db.doctor_schedules.put(dayToPut);
            });
            await Promise.all(promises);
        }
    },
};

export const getSessionsByPatient = async (patientId: string): Promise<Session[]> => {
    // This function will now benefit from the offline caching in api.sessions.getAll
    const allSessions = await sessions_getAll();
    return allSessions.filter(s => s.patientId === patientId);
};
