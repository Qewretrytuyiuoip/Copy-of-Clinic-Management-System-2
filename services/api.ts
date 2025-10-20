import { User, UserRole, Patient, Treatment, Session, Appointment, Payment, DoctorAvailability, SessionTreatment, Gender, DaySchedule, PatientPhoto, ActivityLog, ActivityLogActionType } from '../types';
import { API_BASE_URL } from '../config';

// --- MOCK DATABASE ---

export let MOCK_USERS: User[] = [
    { id: 'admin1', name: 'د. مدير', email: 'admin@example.com', role: UserRole.Admin, password: '1' },
    { id: 'doc1', name: 'د. سميث', email: 'smith@clinic.com', role: UserRole.Doctor, password: '1' },
    { id: 'doc2', name: 'د. جونز', email: 'jones@clinic.com', role: UserRole.Doctor, password: '1' },
    { id: 'sec1', name: 'سارة كونور', email: 'sarah@clinic.com', role: UserRole.Secretary, password: '1' },
];

// MOCK_PATIENTS is now fetched from the API.
// Dependent mock data is cleared to avoid invalid references.
let MOCK_PATIENT_PHOTOS: PatientPhoto[] = [];
let MOCK_ACTIVITY_LOGS: ActivityLog[] = [];


// --- API FUNCTIONS ---

// A single source of truth for fetching all users from the API
let allUsersCache: User[] | null = null;
// Cache for base treatments
let allTreatmentSettingsCache: Treatment[] | null = null;


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
        try {
            // Try to parse a structured JSON error from the server
            const errorData = await response.json();
            if (errorData.message) {
                errorMessage = errorData.message;
                // If there are validation errors, append them
                if (errorData.errors) {
                    const validationErrors = Object.values(errorData.errors).flat().join('\n');
                    errorMessage += `\n\nالتفاصيل:\n${validationErrors}`;
                }
            } else {
                // If it's JSON but not in the expected format, stringify it
                errorMessage = JSON.stringify(errorData);
            }
        } catch (e) {
            // If the response is not JSON, use the raw text
            const errorText = await response.text();
            if (errorText) {
                errorMessage = errorText;
            }
        }
        console.error(`API call to ${endpoint} failed with status ${response.status}:`, errorMessage);
        // Throw the detailed error message to be caught by the UI
        throw new Error(errorMessage);
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

// Includes a simple cache to avoid redundant network calls.
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

const activityLogsCRUD = createCRUD(MOCK_ACTIVITY_LOGS);

// Mapper function to convert API patient object to frontend Patient type
const mapApiPatientToPatient = (p: any): Patient => ({
    id: String(p.id),
    code: p.code,
    name: p.name,
    age: p.age,
    phone: p.phone,
    notes: p.notes ?? undefined,
    doctorId: String(p.doctor_id),
    gender: p.gender === 'female' ? Gender.Female : Gender.Male,
    isSmoker: !!p.is_smoker,
    isPregnant: !!p.is_pregnant,
    drugAllergy: p.drug_allergy ?? undefined,
    chronicDiseases: p.chronic_diseases ?? undefined,
});

const mapApiPaymentToPayment = (p: any): Payment => ({
    id: String(p.id),
    patientId: String(p.patient_id),
    amount: parseFloat(p.amount), // Ensure amount is a number
    date: p.date.split('T')[0], // API returns ISO string, UI needs YYYY-MM-DD
});

const mapApiTreatmentSettingToTreatment = (t: any): Treatment => ({
    id: String(t.id),
    name: t.name,
    price: parseFloat(t.price),
    notes: t.notes ?? undefined,
});

const mapApiAppointmentToAppointment = (apiApp: any): Appointment => {
    let time = '00:00';
    // The time field can be a full ISO string (e.g., from `time` or `created_at`). We only need HH:MM.
    if (apiApp.time && typeof apiApp.time === 'string') {
        // Handle full datetime strings like "2024-07-25 14:30:00" or "2024-07-25T14:30:00.000Z"
        const timeMatch = apiApp.time.match(/(\d{2}):(\d{2})/);
        if (timeMatch) {
            time = `${timeMatch[1]}:${timeMatch[2]}`;
        }
    }
    
    return {
        id: String(apiApp.id),
        patientId: String(apiApp.patient_id),
        doctorId: String(apiApp.doctor_id),
        date: apiApp.date.split('T')[0], // Extract YYYY-MM-DD from the date field
        time: time,
        notes: apiApp.notes ?? undefined,
        createdBy: apiApp.created_by ? String(apiApp.created_by) : undefined,
    };
};

const mapApiSessionTreatmentToSessionTreatment = (st: any, treatmentsByName: Map<string, Treatment>): SessionTreatment | null => {
    const baseTreatment = treatmentsByName.get(st.treatment_name);

    if (!baseTreatment) {
        console.warn(`Base treatment named "${st.treatment_name}" not found for session_treatment ID ${st.id}. Skipping.`);
        return null;
    }

    return {
        ...baseTreatment,
        instanceId: String(st.id),
        sessionId: String(st.session_id),
        sessionPrice: parseFloat(st.treatment_price),
        sessionNotes: st.treatment_notes ?? undefined,
        completed: !!st.completed,
        treatmentDate: st.treatment_date ? new Date(st.treatment_date).toISOString().split('T')[0] : undefined,
        additionalCosts: st.additional_costs ? parseFloat(st.additional_costs) : undefined,
    };
};

// A base mapper for session that doesn't include treatments.
const mapApiSessionToSessionBase = (s: any): Session => ({
    id: String(s.id),
    patientId: String(s.patient_id),
    doctorId: String(s.doctor_id),
    date: s.date,
    notes: s.notes ?? '',
    treatments: [], // Will be populated separately
});

// Helper to format time from API's ISO string to HH:MM for time inputs
const formatTimeFromISO = (isoString: string | null): string => {
    if (!isoString) return '09:00'; // Default start time
    try {
        const date = new Date(isoString);
        // Using UTC methods to avoid timezone issues, as the 'Z' indicates UTC.
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    } catch (e) {
        console.error("Invalid date string for time formatting:", isoString, e);
        return '00:00';
    }
};

const mapApiScheduleToDaySchedule = (apiSchedule: any): DaySchedule => ({
    id: String(apiSchedule.id),
    day: apiSchedule.day_of_week,
    isWorkDay: !!apiSchedule.is_work_day,
    startTime: formatTimeFromISO(apiSchedule.start_time),
    endTime: formatTimeFromISO(apiSchedule.end_time),
});


// Fetches all session treatments and groups them by session ID for efficient access.
const getGroupedSessionTreatments = async (): Promise<Record<string, SessionTreatment[]>> => {
    try {
        const [apiSessionTreatments, allTreatmentSettings] = await Promise.all([
            apiFetch('treatments/all', { method: 'POST' }),
            api.treatmentSettings.getAll()
        ]);

        if (!Array.isArray(apiSessionTreatments)) {
            console.error('Expected an array of session treatments from API, but got:', apiSessionTreatments);
            return {};
        }
        
        const treatmentsByName = new Map(allTreatmentSettings.map(t => [t.name, t]));
        
        const groupedTreatments = apiSessionTreatments.reduce((acc, st) => {
            const sessionId = String(st.session_id);
            if (!acc[sessionId]) acc[sessionId] = [];
            const mappedTreatment = mapApiSessionTreatmentToSessionTreatment(st, treatmentsByName);
            if (mappedTreatment) {
                acc[sessionId].push(mappedTreatment);
            }
            return acc;
        }, {} as Record<string, SessionTreatment[]>);

        return groupedTreatments;
    } catch (error) {
        console.error("Failed to get grouped session treatments:", error);
        return {};
    }
};

export const api = {
    doctors: createUserCRUD(UserRole.Doctor),
    secretaries: createUserCRUD(UserRole.Secretary),
    patients: {
        getAll: async (): Promise<Patient[]> => {
            try {
                const apiPatients = await apiFetch('patients/all', { method: 'POST' });
                if (!Array.isArray(apiPatients)) {
                    console.error('Expected an array of patients from API, but got:', apiPatients);
                    return [];
                }
                return apiPatients.map(mapApiPatientToPatient);
            } catch (error) {
                console.error("Failed to fetch patients:", error);
                return [];
            }
        },
        getById: async (id: string): Promise<Patient | null> => {
            try {
                const formData = new FormData();
                formData.append('id', id);
                const responseData = await apiFetch('patients/get', { method: 'POST', body: formData });
                const p = responseData.patient; 
                if (!p) return null;
                return mapApiPatientToPatient(p);
            } catch (error) {
                console.error(`Failed to fetch patient with id ${id}:`, error);
                return null;
            }
        },
        create: async (item: Omit<Patient, 'id' | 'code'>): Promise<Patient> => {
            try {
                const formData = new FormData();
                formData.append('name', item.name);
                formData.append('age', String(item.age));
                formData.append('phone', item.phone);
                formData.append('doctor_id', item.doctorId);
                formData.append('gender', item.gender);
                formData.append('is_smoker', item.isSmoker ? '1' : '0');
                formData.append('is_pregnant', item.isPregnant ? '1' : '0');
                if (item.notes) formData.append('notes', item.notes);
                if (item.drugAllergy) formData.append('drug_allergy', item.drugAllergy);
                if (item.chronicDiseases) formData.append('chronic_diseases', item.chronicDiseases);

                const responseData = await apiFetch('patients/add', { method: 'POST', body: formData });
                const createdApiPatient = responseData.patient;

                if (!createdApiPatient || !createdApiPatient.id) {
                    throw new Error("Invalid API response after creating patient.");
                }
                return mapApiPatientToPatient(createdApiPatient);
            } catch (error) {
                console.error("Failed to create patient via API:", error);
                throw error;
            }
        },
        update: async (id: string, updates: Partial<Patient>): Promise<Patient | null> => {
            try {
                const formData = new FormData();
                formData.append('id', id);
                
                if (updates.name) formData.append('name', updates.name);
                if (updates.age !== undefined) formData.append('age', String(updates.age));
                if (updates.phone) formData.append('phone', updates.phone);
                if (updates.doctorId) formData.append('doctor_id', updates.doctorId);
                if (updates.gender) formData.append('gender', updates.gender);
                if (updates.isSmoker !== undefined) formData.append('is_smoker', updates.isSmoker ? '1' : '0');
                if (updates.isPregnant !== undefined) formData.append('is_pregnant', updates.isPregnant ? '1' : '0');
                if (updates.notes) formData.append('notes', updates.notes);
                if (updates.drugAllergy) formData.append('drug_allergy', updates.drugAllergy);
                if (updates.chronicDiseases) formData.append('chronic_diseases', updates.chronicDiseases);

                const responseData = await apiFetch('patients/edit', { method: 'POST', body: formData });
                
                if (responseData.message !== "Patient updated successfully") {
                    const errorMessage = responseData.message || "An unexpected response was received from the server during update.";
                    throw new Error(errorMessage);
                }

                const updatedApiPatient = responseData.patient;

                if (!updatedApiPatient || !updatedApiPatient.id) {
                    throw new Error("Patient data was not returned in the API response after update.");
                }
                return mapApiPatientToPatient(updatedApiPatient);
            } catch (error) {
                console.error(`Failed to update patient with ID ${id} via API:`, error);
                throw error;
            }
        },
        delete: async (id: string): Promise<boolean> => {
            try {
                const formData = new FormData();
                formData.append('id', id);
                const responseData = await apiFetch('patients/delete', { method: 'POST', body: formData });

                // Verify the success message from the API response for a more robust check.
                if (responseData.message === "Patient deleted successfully") {
                    return true;
                }
                
                // If the message is not what we expect, treat it as an error.
                const errorMessage = responseData.message || "An unexpected response was received from the server.";
                throw new Error(errorMessage);

            } catch (error) {
                console.error(`Failed to delete patient with ID ${id}:`, error);
                throw error;
            }
        },
    },
    treatmentSettings: {
        getAll: async (forceRefresh: boolean = false): Promise<Treatment[]> => {
            if (allTreatmentSettingsCache && !forceRefresh) {
                return allTreatmentSettingsCache;
            }
            try {
                const apiTreatments = await apiFetch('treatments_setting/all', { method: 'POST' });
                if (!Array.isArray(apiTreatments)) {
                    console.error('Expected an array of treatments from API, but got:', apiTreatments);
                    allTreatmentSettingsCache = [];
                    return [];
                }
                allTreatmentSettingsCache = apiTreatments.map(mapApiTreatmentSettingToTreatment);
                return allTreatmentSettingsCache;
            } catch (error) {
                console.error("Failed to fetch treatments:", error);
                return [];
            }
        },
        create: async (item: Omit<Treatment, 'id'>): Promise<Treatment> => {
            try {
                const formData = new FormData();
                formData.append('name', item.name);
                formData.append('price', String(item.price));
                if (item.notes) formData.append('notes', item.notes);

                const responseData = await apiFetch('treatments_setting/add', { method: 'POST', body: formData });

                if (responseData.message !== "Treatment created successfully") {
                    throw new Error(responseData.message || "Failed to create treatment.");
                }

                const createdApiTreatment = responseData.treatment;
                if (!createdApiTreatment || !createdApiTreatment.id) {
                    throw new Error("Treatment data was not returned in the API response after creation.");
                }
                allTreatmentSettingsCache = null; // Invalidate cache
                return mapApiTreatmentSettingToTreatment(createdApiTreatment);
            } catch (error) {
                console.error("Failed to create treatment via API:", error);
                throw error;
            }
        },
        update: async (id: string, updates: Partial<Treatment>): Promise<Treatment | null> => {
             try {
                const formData = new FormData();
                formData.append('id', id);

                if (updates.name) formData.append('name', updates.name);
                if (updates.price !== undefined) formData.append('price', String(updates.price));
                if (updates.notes) formData.append('notes', updates.notes);

                const responseData = await apiFetch('treatments_setting/edit', { method: 'POST', body: formData });
                
                if (responseData.message !== "Treatment updated successfully") {
                    throw new Error(responseData.message || "Failed to update treatment.");
                }

                const updatedApiTreatment = responseData.treatment;
                if (!updatedApiTreatment) {
                     throw new Error("Treatment data not returned after update.");
                }
                allTreatmentSettingsCache = null; // Invalidate cache
                return mapApiTreatmentSettingToTreatment(updatedApiTreatment);
            } catch (error) {
                console.error(`Failed to update treatment with ID ${id}:`, error);
                throw error;
            }
        },
        delete: async (id: string): Promise<boolean> => {
            try {
                const formData = new FormData();
                formData.append('id', id);
                const responseData = await apiFetch('treatments_setting/delete', { method: 'POST', body: formData });

                if (responseData.message === "Treatment deleted successfully") {
                    allTreatmentSettingsCache = null; // Invalidate cache
                    return true;
                }
                
                throw new Error(responseData.message || "An unexpected response was received from the server.");

            } catch (error) {
                console.error(`Failed to delete treatment with ID ${id}:`, error);
                throw error;
            }
        },
    },
    sessionTreatments: {
        create: async (item: {
            session_id: string,
            treatment_name: string,
            treatment_price: number,
            additional_costs?: number,
            treatment_notes?: string,
            treatment_date: string,
            completed: boolean,
        }) => {
            const formData = new FormData();
            formData.append('session_id', item.session_id);
            formData.append('treatment_name', item.treatment_name);
            formData.append('treatment_price', String(item.treatment_price));
            formData.append('treatment_date', item.treatment_date);
            formData.append('completed', item.completed ? '1' : '0');
            if (item.additional_costs) formData.append('additional_costs', String(item.additional_costs));
            if (item.treatment_notes) formData.append('treatment_notes', item.treatment_notes);
            
            return apiFetch('treatments/add', { method: 'POST', body: formData });
        },
        update: async (id: string, updates: Partial<SessionTreatment>) => {
            const formData = new FormData();
            formData.append('id', id);
            
            if (updates.sessionPrice !== undefined) formData.append('treatment_price', String(updates.sessionPrice));
            if (updates.additionalCosts !== undefined) formData.append('additional_costs', String(updates.additionalCosts));
            // FIX: The property on SessionTreatment is sessionNotes, not treatmentNotes.
            if (updates.sessionNotes !== undefined) formData.append('treatment_notes', updates.sessionNotes);
            if (updates.treatmentDate !== undefined) formData.append('treatment_date', updates.treatmentDate);
            if (updates.completed !== undefined) formData.append('completed', updates.completed ? '1' : '0');

            return apiFetch('treatments/edit', { method: 'POST', body: formData });
        },
        delete: async (id: string) => {
            const formData = new FormData();
            formData.append('id', id);
            return apiFetch('treatments/delete', { method: 'POST', body: formData });
        },
    },
    sessions: {
        getAll: async (): Promise<Session[]> => {
            try {
                const [apiSessions, groupedTreatments] = await Promise.all([
                    apiFetch('sessions/all', { method: 'POST' }),
                    getGroupedSessionTreatments()
                ]);

                if (!Array.isArray(apiSessions)) {
                    console.error('Expected an array of sessions from API, but got:', apiSessions);
                    return [];
                }
                
                return apiSessions.map(s => {
                    const session = mapApiSessionToSessionBase(s);
                    session.treatments = groupedTreatments[session.id] || [];
                    return session;
                });

            } catch (error) {
                console.error("Failed to fetch sessions with treatments:", error);
                return [];
            }
        },
        getById: async (id: string): Promise<Session | null> => {
            try {
                const formData = new FormData();
                formData.append('id', id);

                const [responseData, groupedTreatments] = await Promise.all([
                    apiFetch('sessions/get', { method: 'POST', body: formData }),
                    getGroupedSessionTreatments()
                ]);
                
                const s = responseData.session; 
                if (!s) return null;
                
                const session = mapApiSessionToSessionBase(s);
                session.treatments = groupedTreatments[session.id] || [];
                return session;
            } catch (error) {
                console.error(`Failed to fetch session with id ${id}:`, error);
                return null;
            }
        },
        create: async (item: Omit<Session, 'id'>): Promise<Session> => {
            try {
                const formData = new FormData();
                formData.append('patient_id', item.patientId);
                formData.append('doctor_id', item.doctorId);
                formData.append('date', item.date.split('T')[0]);
                formData.append('notes', item.notes);

                const responseData = await apiFetch('sessions/add', { method: 'POST', body: formData });

                if (responseData.message !== "Session created successfully") {
                    throw new Error(responseData.message || "Failed to create session.");
                }

                const createdApiSession = responseData.session;
                if (!createdApiSession || !createdApiSession.id) {
                    throw new Error("Session data was not returned in the API response after creation.");
                }
                return mapApiSessionToSessionBase(createdApiSession);
            } catch (error) {
                console.error("Failed to create session via API:", error);
                throw error;
            }
        },
        update: async (id: string, updates: Partial<Session>): Promise<Session | null> => {
             try {
                const formData = new FormData();
                formData.append('id', id);

                if (updates.date) formData.append('date', updates.date.split('T')[0]);
                if (updates.notes !== undefined) formData.append('notes', updates.notes);
                
                const responseData = await apiFetch('sessions/edit', { method: 'POST', body: formData });
                
                if (responseData.message !== "Session updated successfully") {
                    throw new Error(responseData.message || "Failed to update session.");
                }

                const updatedApiSession = responseData.session;
                if (!updatedApiSession) {
                     throw new Error("Session data not returned after update.");
                }

                return await api.sessions.getById(id);
            } catch (error) {
                console.error(`Failed to update session with ID ${id}:`, error);
                throw error;
            }
        },
        delete: async (id: string): Promise<boolean> => {
            try {
                const formData = new FormData();
                formData.append('id', id);
                const responseData = await apiFetch('sessions/delete', { method: 'POST', body: formData });

                if (responseData.message === "Session deleted successfully") {
                    return true;
                }
                
                throw new Error(responseData.message || "An unexpected response was received from the server.");

            } catch (error) {
                console.error(`Failed to delete session with ID ${id}:`, error);
                throw error;
            }
        },
    },
    appointments: {
        getAll: async (): Promise<Appointment[]> => {
            try {
                const apiAppointments = await apiFetch('appointments/all', { method: 'POST' });
                if (!Array.isArray(apiAppointments)) {
                    console.error('Expected an array of appointments from API, but got:', apiAppointments);
                    return [];
                }
                return apiAppointments.map(mapApiAppointmentToAppointment);
            } catch (error) {
                console.error("Failed to fetch appointments:", error);
                return [];
            }
        },
        create: async (item: Omit<Appointment, 'id'>): Promise<Appointment> => {
            try {
                const formData = new FormData();
                formData.append('patient_id', item.patientId);
                formData.append('doctor_id', item.doctorId);
                formData.append('date', item.date);
                formData.append('time', `${item.time}:00`);
                if (item.createdBy) formData.append('created_by', item.createdBy);
                if (item.notes) formData.append('notes', item.notes);

                const responseData = await apiFetch('appointments/add', { method: 'POST', body: formData });

                if (responseData.message !== "Appointment created") {
                    throw new Error(responseData.message || "Failed to create appointment.");
                }
                const createdApiApp = responseData.data;
                if (!createdApiApp || !createdApiApp.id) {
                    throw new Error("Appointment data was not returned after creation.");
                }
                return mapApiAppointmentToAppointment(createdApiApp);
            } catch (error) {
                console.error("Failed to create appointment via API:", error);
                throw error;
            }
        },
        update: async (id: string, updates: Partial<Appointment>): Promise<Appointment | null> => {
             try {
                const formData = new FormData();
                formData.append('id', id);

                if (updates.patientId) formData.append('patient_id', updates.patientId);
                if (updates.doctorId) formData.append('doctor_id', updates.doctorId);
                if (updates.date) formData.append('date', updates.date);
                if (updates.time) formData.append('time', `${updates.time}:00`);
                if (updates.notes) formData.append('notes', updates.notes);

                const responseData = await apiFetch('appointments/edit', { method: 'POST', body: formData });
                
                if (responseData.message !== "Appointment updated successfully") {
                    throw new Error(responseData.message || "Failed to update appointment.");
                }

                const updatedApiApp = responseData.data;
                if (!updatedApiApp) {
                     throw new Error("Appointment data not returned after update.");
                }
                return mapApiAppointmentToAppointment(updatedApiApp);
            } catch (error) {
                console.error(`Failed to update appointment with ID ${id}:`, error);
                throw error;
            }
        },
        delete: async (id: string): Promise<boolean> => {
            try {
                const formData = new FormData();
                formData.append('id', id);
                const responseData = await apiFetch('appointments/delete', { method: 'POST', body: formData });

                if (responseData.message === "Appointment deleted successfully") {
                    return true;
                }
                
                throw new Error(responseData.message || "An unexpected response was received from the server.");

            } catch (error) {
                console.error(`Failed to delete appointment with ID ${id}:`, error);
                throw error;
            }
        },
    },
    payments: {
        getAll: async (): Promise<Payment[]> => {
            try {
                const apiPayments = await apiFetch('payments/all', { method: 'POST' });
                if (!Array.isArray(apiPayments)) {
                    console.error('Expected an array of payments from API, but got:', apiPayments);
                    return [];
                }
                return apiPayments.map(mapApiPaymentToPayment);
            } catch (error) {
                console.error("Failed to fetch payments:", error);
                return [];
            }
        },
        create: async (item: Omit<Payment, 'id'>): Promise<Payment> => {
            try {
                const formData = new FormData();
                formData.append('patient_id', item.patientId);
                formData.append('amount', String(item.amount));
                formData.append('date', item.date);

                const responseData = await apiFetch('payments/add', { method: 'POST', body: formData });

                if (responseData.message !== "Payment created successfully") {
                    throw new Error(responseData.message || "Failed to create payment.");
                }

                const createdApiPayment = responseData.payment;
                if (!createdApiPayment || !createdApiPayment.id) {
                    throw new Error("Payment data was not returned in the API response after creation.");
                }
                return mapApiPaymentToPayment(createdApiPayment);
            } catch (error) {
                console.error("Failed to create payment via API:", error);
                throw error;
            }
        },
        update: async (id: string, updates: Partial<Payment>): Promise<Payment | null> => {
             try {
                const formData = new FormData();
                formData.append('id', id);

                if (updates.patientId) formData.append('patient_id', updates.patientId);
                if (updates.amount !== undefined) formData.append('amount', String(updates.amount));
                if (updates.date) formData.append('date', updates.date);

                const responseData = await apiFetch('payments/edit', { method: 'POST', body: formData });
                
                if (responseData.message !== "Payment updated successfully") {
                    throw new Error(responseData.message || "Failed to update payment.");
                }

                const updatedApiPayment = responseData.payment;
                if (!updatedApiPayment) {
                     throw new Error("Payment data not returned after update.");
                }
                return mapApiPaymentToPayment(updatedApiPayment);
            } catch (error) {
                console.error(`Failed to update payment with ID ${id}:`, error);
                throw error;
            }
        },
        delete: async (id: string): Promise<boolean> => {
            try {
                const formData = new FormData();
                formData.append('id', id);
                const responseData = await apiFetch('payments/delete', { method: 'POST', body: formData });

                if (responseData.message === "Payment deleted successfully") {
                    return true;
                }
                
                throw new Error(responseData.message || "An unexpected response was received from the server.");

            } catch (error) {
                console.error(`Failed to delete payment with ID ${id}:`, error);
                throw error;
            }
        },
    },
    patientPhotos: createCRUD(MOCK_PATIENT_PHOTOS),
    activityLogs: {
        ...activityLogsCRUD,
        getByUserId: (userId: string) => simulateDelay(MOCK_ACTIVITY_LOGS.filter(log => log.userId === userId)),
    },
    doctorSchedules: {
        getForDoctor: async (doctorId: string): Promise<DaySchedule[]> => {
            try {
                const apiSchedules = await apiFetch('doctor_schedules/all', { method: 'POST' });
                if (!Array.isArray(apiSchedules)) {
                    console.error("Expected an array of schedules, got:", apiSchedules);
                    return [];
                }
                const doctorSchedules = apiSchedules.filter(s => String(s.doctor_id) === doctorId);
                return doctorSchedules.map(mapApiScheduleToDaySchedule);
            } catch (error) {
                console.error("Failed to fetch doctor schedules:", error);
                throw error; 
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
            });
            await Promise.all(promises);
        }
    },
};

// Custom getters
export const getSessionsByPatient = async (patientId: string): Promise<Session[]> => {
    const allSessions = await api.sessions.getAll();
    return allSessions.filter(s => s.patientId === patientId);
};