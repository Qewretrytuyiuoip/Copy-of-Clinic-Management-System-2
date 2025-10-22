import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { User, Appointment, Patient, UserRole, Gender, DaySchedule } from '../types';
import { api } from '../services/api';
import { PlusIcon, PencilIcon, TrashIcon, XIcon, EyeIcon, SearchIcon, CalendarIcon, ClockIcon } from '../components/Icons';
import { CenteredLoadingSpinner } from '../components/LoadingSpinner';

const formatTo12Hour = (time24: string): string => {
    if (!time24 || !time24.includes(':')) {
        return time24; // Return original if format is unexpected
    }
    try {
        const [hours, minutes] = time24.split(':').map(Number);
        const ampm = hours >= 12 ? 'مساءً' : 'صباحًا';
        const hours12 = hours % 12 || 12; // Convert hour to 12-hour format
        const paddedHours = hours12.toString().padStart(2, '0');
        const paddedMinutes = minutes.toString().padStart(2, '0');
        return `${paddedHours}:${paddedMinutes} ${ampm}`;
    } catch (e) {
        console.error("Failed to format time:", time24, e);
        return time24;
    }
};


// ===================================================================
// ConfirmDeleteModal Component
// ===================================================================
interface ConfirmDeleteModalProps {
    onConfirm: () => void;
    onCancel: () => void;
    title: string;
    message: string;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ onConfirm, onCancel, title, message }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 transition-opacity" onClick={onCancel}>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm transform transition-all" role="dialog" onClick={e => e.stopPropagation()}>
            <div className="p-6">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30">
                        <TrashIcon className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-4">{title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 px-4">{message}</p>
                </div>
            </div>
            <div className="bg-gray-50 dark:bg-slate-700/50 px-6 py-4 rounded-b-2xl flex justify-center gap-4">
                <button type="button" onClick={onConfirm} className="w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                    نعم، قم بالحذف
                </button>
                <button type="button" onClick={onCancel} className="w-full rounded-md border border-gray-300 dark:border-gray-500 shadow-sm px-4 py-2 bg-white dark:bg-gray-600 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                    إلغاء
                </button>
            </div>
        </div>
    </div>
);

// ===================================================================
// ViewAppointmentModal Component
// ===================================================================
interface ViewAppointmentModalProps {
    appointment: Appointment;
    patientName: string;
    doctorName: string;
    onClose: () => void;
}

const ViewAppointmentModal: React.FC<ViewAppointmentModalProps> = ({ appointment, patientName, doctorName, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md" role="dialog" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">تفاصيل الموعد</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div><p className="text-sm font-medium text-gray-500 dark:text-gray-400">المريض</p><p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{patientName}</p></div>
                    <div><p className="text-sm font-medium text-gray-500 dark:text-gray-400">الطبيب</p><p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{doctorName}</p></div>
                    <div><p className="text-sm font-medium text-gray-500 dark:text-gray-400">التاريخ</p><p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{new Date(appointment.date).toLocaleDateString()}</p></div>
                    <div><p className="text-sm font-medium text-gray-500 dark:text-gray-400">الوقت</p><p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{formatTo12Hour(appointment.time)}</p></div>
                    {appointment.notes && (<div><p className="text-sm font-medium text-gray-500 dark:text-gray-400">ملاحظات</p><p className="text-md text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 p-2 rounded-md">{appointment.notes}</p></div>)}
                </div>
                <div className="flex justify-end p-4 bg-gray-50 dark:bg-slate-700/50 border-t dark:border-gray-700"><button onClick={onClose} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-700">إغلاق</button></div>
            </div>
        </div>
    );
};


// ===================================================================
// AppointmentFormModal (Add/Edit) Component
// ===================================================================
interface AppointmentFormModalProps {
    appointment?: Appointment;
    patients: Patient[];
    doctors: User[];
    onSave: (data: Omit<Appointment, 'id'> | Appointment, refreshPatients: boolean) => Promise<void>;
    onClose: () => void;
    user: User;
}

const generateTimeSlots = (start: string, end: string, intervalMinutes: number): string[] => {
    const slots: string[] = [];
    try {
        const [startHour, startMinute] = start.split(':').map(Number);
        const [endHour, endMinute] = end.split(':').map(Number);
        
        const startDate = new Date();
        startDate.setHours(startHour, startMinute, 0, 0);

        const endDate = new Date();
        endDate.setHours(endHour, endMinute, 0, 0);

        while (startDate < endDate) {
            slots.push(
                `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`
            );
            startDate.setMinutes(startDate.getMinutes() + intervalMinutes);
        }
    } catch (e) {
        console.error("Error generating time slots", e);
    }
    return slots;
};


const AppointmentFormModal: React.FC<AppointmentFormModalProps> = ({ appointment, patients, doctors, onSave, onClose, user }) => {
    const [formData, setFormData] = useState({
        patientId: appointment?.patientId || '',
        doctorId: appointment?.doctorId || '',
        date: appointment?.date ? new Date(appointment.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        time: appointment?.time || '',
        notes: appointment?.notes || '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [showNewPatientForm, setShowNewPatientForm] = useState(false);
    const [newPatientData, setNewPatientData] = useState({ name: '', phone: '' });
    
    const [availableSlots, setAvailableSlots] = useState<{ value: string; label: string; }[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [slotsMessage, setSlotsMessage] = useState('');


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newState = { ...prev, [name]: value };

            if (name === 'patientId') {
                newState.time = ''; // Reset time
                const selectedPatient = patients.find(p => p.id === value);
                // Reset doctor if not in the new patient's list
                if (selectedPatient && !selectedPatient.doctorIds.includes(newState.doctorId)) {
                    newState.doctorId = '';
                }
            }

            if (name === 'doctorId' || name === 'date') {
                newState.time = ''; // Reset time
            }
            return newState;
        });
    };
    
    useEffect(() => {
        const fetchAvailableSlots = async () => {
            if (formData.doctorId && formData.date) {
                setSlotsLoading(true);
                setAvailableSlots([]);
                setSlotsMessage('');
                try {
                    const schedules = await api.doctorSchedules.getForDoctor(formData.doctorId);
                    const selectedDate = new Date(formData.date);
                    selectedDate.setMinutes(selectedDate.getMinutes() + selectedDate.getTimezoneOffset());
                    const dayOfWeek = selectedDate.getDay(); 
                    
                    const daySchedule = schedules.find(s => s.day === dayOfWeek);

                    if (!daySchedule || !daySchedule.isWorkDay) {
                        setSlotsMessage('الطبيب غير متاح في هذا اليوم.');
                        return;
                    }
                    
                    const allAppointments = await api.appointments.getAll();
                    const bookedSlots = allAppointments
                        .filter(app => app.doctorId === formData.doctorId && app.date === formData.date && app.id !== appointment?.id)
                        .map(app => app.time);

                    const generatedSlots = generateTimeSlots(daySchedule.startTime, daySchedule.endTime, 30);
                    
                    const freeSlots = generatedSlots.filter(slot => !bookedSlots.includes(slot));
                    
                    if(freeSlots.length === 0) {
                        setSlotsMessage('لا توجد أوقات متاحة في هذا اليوم.');
                    }
                    setAvailableSlots(freeSlots.map(slot => ({ value: slot, label: formatTo12Hour(slot) })));

                } catch (error) {
                    console.error("Failed to fetch available slots:", error);
                    setSlotsMessage('فشل في تحميل الأوقات المتاحة.');
                } finally {
                    setSlotsLoading(false);
                }
            }
        };
        fetchAvailableSlots();
    }, [formData.doctorId, formData.date, appointment?.id]);

    const patientDoctors = useMemo(() => {
        if (!formData.patientId) {
            return doctors;
        }
        const selectedPatient = patients.find(p => p.id === formData.patientId);
        return selectedPatient ? doctors.filter(d => selectedPatient.doctorIds.includes(d.id)) : [];
    }, [formData.patientId, patients, doctors]);


    const handleNewPatientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewPatientData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        let patientIdForAppointment = formData.patientId;
        let refreshPatientsList = false;
    
        if (showNewPatientForm) {
            if (!newPatientData.name || !newPatientData.phone || !formData.doctorId) {
                alert('يرجى ملء اسم المريض الجديد ورقم هاتفه واختيار طبيب.');
                setIsSaving(false);
                return;
            }
            try {
                const newPatient = await api.patients.create({
                    name: newPatientData.name,
                    phone: newPatientData.phone,
                    doctorIds: [formData.doctorId],
                    age: 0, 
                    notes: 'مريض جديد تم إنشاؤه من صفحة المواعيد',
                    gender: Gender.Male,
                });
                patientIdForAppointment = newPatient.id;
                refreshPatientsList = true;
            } catch (error) {
                console.error("فشل في إنشاء مريض جديد:", error);
                alert('فشل في إنشاء المريض الجديد.');
                setIsSaving(false);
                return;
            }
        }
    
        if (!patientIdForAppointment) {
            alert('يرجى اختيار مريض.');
            setIsSaving(false);
            return;
        }

        if(!formData.time) {
            alert('يرجى اختيار وقت للموعد.');
            setIsSaving(false);
            return;
        }
    
        const appointmentData = {
            ...formData,
            patientId: patientIdForAppointment,
            createdBy: user.id,
        };
    
        const dataToSave = appointment ? { ...appointment, ...appointmentData } : appointmentData;
        await onSave(dataToSave, refreshPatientsList);
        setIsSaving(false);
    };

    const isEditMode = !!appointment;
    const inputStyle = "w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black dark:text-white";


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg" role="dialog" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{isEditMode ? 'تعديل الموعد' : 'إضافة موعد جديد'}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
                        <div className="md:col-span-2">
                           {showNewPatientForm ? (
                                <div className="p-4 border dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800">
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-md font-semibold text-gray-800 dark:text-gray-100">إضافة مريض جديد</h3>
                                        <button 
                                            type="button" 
                                            onClick={() => setShowNewPatientForm(false)} 
                                            className="text-sm text-primary hover:underline font-medium"
                                        >
                                            العودة لاختيار مريض
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="newPatientName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم المريض</label>
                                            <input type="text" id="newPatientName" name="name" value={newPatientData.name} onChange={handleNewPatientChange} required className={inputStyle} placeholder="الاسم الكامل" />
                                        </div>
                                        <div>
                                            <label htmlFor="newPatientPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">هاتف المريض</label>
                                            <input type="tel" id="newPatientPhone" name="phone" value={newPatientData.phone} onChange={handleNewPatientChange} required className={inputStyle} placeholder="رقم الهاتف" />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">المريض</label>
                                        <button 
                                            type="button"
                                            onClick={() => setShowNewPatientForm(true)}
                                            className="flex items-center text-sm font-medium text-primary hover:text-primary-700 transition-colors"
                                        >
                                            <PlusIcon className="h-4 w-4 ml-1" />
                                            مريض جديد
                                        </button>
                                    </div>
                                    <select id="patientId" name="patientId" value={formData.patientId} onChange={handleChange} required className={inputStyle}>
                                        <option value="">اختر مريض...</option>
                                        {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="doctorId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الطبيب</label>
                            <select id="doctorId" name="doctorId" value={formData.doctorId} onChange={handleChange} required className={inputStyle}>
                                <option value="">اختر طبيب...</option>
                                {patientDoctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">التاريخ</label>
                            <div className="relative">
                                <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required className={`${inputStyle} pr-10`} />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <CalendarIcon className="h-5 w-5 text-black dark:text-white" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الوقت</label>
                            {slotsLoading ? (
                                <div className="h-10 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">جاري تحميل الأوقات...</div>
                            ) : (
                                <div className="relative">
                                    <select id="time" name="time" value={formData.time} onChange={handleChange} required className={`${inputStyle} pr-10`} disabled={!formData.doctorId || !formData.date}>
                                        <option value="">اختر وقت...</option>
                                        {availableSlots.length > 0 ? (
                                            availableSlots.map(slot => <option key={slot.value} value={slot.value}>{slot.label}</option>)
                                        ) : (
                                            <option disabled>{slotsMessage || 'اختر طبيب وتاريخ'}</option>
                                        )}
                                    </select>
                                     <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <ClockIcon className="h-5 w-5 text-black dark:text-white" />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="md:col-span-2"><label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ملاحظات</label><textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} className={inputStyle}></textarea></div>
                    </div>
                    <div className="flex justify-end items-center p-4 bg-gray-50 dark:bg-slate-700/50 border-t dark:border-gray-700">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500">إلغاء</button>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 bg-primary border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-700 disabled:bg-primary-300 mr-2">{isSaving ? 'جاري الحفظ...' : 'حفظ'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// ===================================================================
// Main AppointmentsPage Component
// ===================================================================
interface AppointmentsPageProps {
    user: User;
}

type ActiveTab = 'all' | 'today' | 'month' | 'finished';

const AppointmentsPage: React.FC<AppointmentsPageProps> = ({ user }) => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [doctors, setDoctors] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddingAppointment, setIsAddingAppointment] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
    const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(null);
    const [deletingAppointment, setDeletingAppointment] = useState<Appointment | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<ActiveTab>('today');


    const fetchData = useCallback(async (refreshPatients = false) => {
        setLoading(true);
        try {
            const appointmentPromise = api.appointments.getAll();
            const doctorsPromise = api.doctors.getAll();
            const patientsPromise = refreshPatients || patients.length === 0 ? api.patients.getAll() : Promise.resolve(patients);

            const [apps, docs, pats] = await Promise.all([appointmentPromise, doctorsPromise, patientsPromise]);
            
            setAppointments(apps);
            setDoctors(docs);
            setPatients(pats);
        } catch (error) {
            console.error("Failed to fetch data:", error);
            alert(`فشل تحميل البيانات: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
        } finally {
            setLoading(false);
        }
    }, [patients]);

    useEffect(() => {
        fetchData();
    }, []);

    const handleSaveAppointment = async (data: Omit<Appointment, 'id'> | Appointment, refreshPatients: boolean) => {
        try {
            const dataWithUser = { ...data, createdBy: user.id };
            if ('id' in dataWithUser) {
                await api.appointments.update(dataWithUser.id, dataWithUser);
            } else {
                await api.appointments.create(dataWithUser);
            }
        } catch (error) {
            const action = 'id' in data ? 'تعديل' : 'إضافة';
            console.error(`Failed to ${action} appointment:`, error);
            alert(`فشل ${action} الموعد: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
        } finally {
            setIsAddingAppointment(false);
            setEditingAppointment(null);
            await fetchData(refreshPatients);
        }
    };

    const confirmDeleteAppointment = async () => {
        if (deletingAppointment) {
            try {
                await api.appointments.delete(deletingAppointment.id);
            } catch (error) {
                console.error("Failed to delete appointment:", error);
                alert(`فشل حذف الموعد: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
            } finally {
                setDeletingAppointment(null);
                await fetchData();
            }
        }
    };

    const getPatientName = (id: string) => patients.find(p => p.id === id)?.name || 'مريض غير معروف';
    const getDoctorName = (id: string) => doctors.find(d => d.id === id)?.name || 'طبيب غير معروف';

    const filteredAppointments = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);

        return appointments
            .filter(app => {
                const appDate = new Date(app.date);
                appDate.setMinutes(appDate.getMinutes() + appDate.getTimezoneOffset());
                appDate.setHours(0, 0, 0, 0);
                
                switch (activeTab) {
                    case 'today':
                        return appDate.getTime() === today.getTime();
                    case 'month':
                        return appDate > today && appDate <= endOfMonth;
                    case 'finished':
                        return appDate.getTime() < today.getTime();
                    case 'all':
                    default:
                        return appDate.getTime() >= today.getTime();
                }
            })
            .filter(app =>
                getPatientName(app.patientId).toLowerCase().includes(searchTerm.toLowerCase()) ||
                getDoctorName(app.doctorId).toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.time.localeCompare(b.time));
    }, [appointments, patients, doctors, searchTerm, activeTab]);

    const TabButton: React.FC<{ tab: ActiveTab; text: string; }> = ({ tab, text }) => {
        const isActive = activeTab === tab;
        return (
            <button
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                    isActive
                        ? 'bg-primary text-white shadow'
                        : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-600 border border-gray-200 dark:border-gray-600'
                }`}
            >
                {text}
            </button>
        );
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">المواعيد</h1>
                <div className="relative w-full max-w-sm">
                   <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                       <SearchIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                   </div>
                   <input
                       type="text"
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       placeholder="ابحث عن مريض أو طبيب..."
                       className="w-full pl-3 pr-10 py-2 bg-white dark:bg-gray-700 text-black dark:text-white border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                   />
                </div>
                {(user.role === UserRole.Admin || user.role === UserRole.Secretary) && (
                    <button onClick={() => setIsAddingAppointment(true)} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700 transition-colors">
                        <PlusIcon className="h-5 w-5 ml-2" />
                        موعد جديد
                    </button>
                )}
            </div>

            <div className="mb-6 flex flex-wrap items-center gap-2">
                <TabButton tab="all" text="كل المواعيد" />
                <TabButton tab="today" text="مواعيد اليوم" />
                <TabButton tab="month" text="هذا الشهر" />
                <TabButton tab="finished" text="المنتهية" />
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md min-h-[200px]">
                {loading ? <CenteredLoadingSpinner /> : (
                    filteredAppointments.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredAppointments.map(app => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                const appDate = new Date(app.date);
                                appDate.setMinutes(appDate.getMinutes() + appDate.getTimezoneOffset());
                                appDate.setHours(0, 0, 0, 0);
                                const isFinished = appDate.getTime() < today.getTime();

                                return (
                                <div key={app.id} className={`border rounded-xl p-4 flex flex-col transition-shadow hover:shadow-lg ${
                                    isFinished 
                                    ? 'bg-gray-200 dark:bg-slate-900 opacity-75 border-gray-300 dark:border-gray-700' 
                                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                }`}>
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-baseline">
                                            <h3 className={`text-lg font-bold ${isFinished ? 'text-gray-600 dark:text-gray-400' : 'text-primary'}`}>{getPatientName(app.patientId)}</h3>
                                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isFinished ? 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>{new Date(app.date).toLocaleDateString()}</span>
                                        </div>
                                        <p className={`font-bold text-3xl my-2 ${isFinished ? 'text-gray-700 dark:text-gray-300' : 'text-gray-800 dark:text-gray-100'}`}>{formatTo12Hour(app.time)}</p>
                                        <p className={`text-sm ${isFinished ? 'text-gray-500 dark:text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>مع الطبيب: {getDoctorName(app.doctorId)}</p>
                                        {app.notes && <p className={`mt-2 text-sm p-2 rounded-md ${isFinished ? 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>ملاحظات: {app.notes}</p>}
                                    </div>
                                     <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600 flex items-center justify-end space-x-2">
                                        <button onClick={() => setViewingAppointment(app)} className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors text-sm p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="عرض">
                                            <EyeIcon className="h-4 w-4" />
                                            <span className="mr-1">عرض</span>
                                        </button>
                                        <button onClick={() => setEditingAppointment(app)} className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 transition-colors text-sm p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40" title="تعديل">
                                            <PencilIcon className="h-4 w-4" />
                                            <span className="mr-1">تعديل</span>
                                        </button>
                                        <button onClick={() => setDeletingAppointment(app)} className="flex items-center text-red-600 dark:text-red-400 hover:text-red-800 transition-colors text-sm p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/40" title="إلغاء">
                                            <TrashIcon className="h-4 w-4" />
                                            <span className="mr-1">إلغاء</span>
                                        </button>
                                    </div>
                                </div>
                                )
                            })}
                        </div>
                    ) : (
                         <p className="text-center text-gray-500 dark:text-gray-400 py-8">لم يتم العثور على مواعيد.</p>
                    )
                )}
            </div>

            {(isAddingAppointment || editingAppointment) && (
                <AppointmentFormModal 
                    key={editingAppointment?.id || 'add'}
                    appointment={editingAppointment || undefined}
                    onClose={() => { setIsAddingAppointment(false); setEditingAppointment(null); }} 
                    onSave={handleSaveAppointment}
                    patients={patients}
                    doctors={doctors}
                    user={user}
                />
            )}
            {viewingAppointment && (
                <ViewAppointmentModal 
                    appointment={viewingAppointment}
                    onClose={() => setViewingAppointment(null)}
                    patientName={getPatientName(viewingAppointment.patientId)}
                    doctorName={getDoctorName(viewingAppointment.doctorId)}
                />
            )}
            {deletingAppointment && (
                <ConfirmDeleteModal
                    title="إلغاء الموعد"
                    message={`هل أنت متأكد من رغبتك في إلغاء موعد المريض ${getPatientName(deletingAppointment.patientId)}؟`}
                    onConfirm={confirmDeleteAppointment}
                    onCancel={() => setDeletingAppointment(null)}
                />
            )}

        </div>
    );
};

export default AppointmentsPage;