
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { User, Appointment, Patient, UserRole, Gender, DaySchedule } from '../types';
import { api } from '../services/api';
import { PlusIcon, PencilIcon, TrashIcon, XIcon, EyeIcon, SearchIcon, CalendarIcon, ClockIcon, ChevronDownIcon } from '../components/Icons';
import { CenteredLoadingSpinner } from '../components/LoadingSpinner';
import { DAY_NAMES } from '../constants';

const formatTo12Hour = (time24: string): string => {
    if (!time24 || !time24.includes(':')) {
        return time24;
    }
    try {
        const [hours, minutes] = time24.split(':').map(Number);
        const ampm = hours >= 12 ? 'مساءً' : 'صباحًا';
        const hours12 = hours % 12 || 12;
        const paddedHours = hours12.toString().padStart(2, '0');
        const paddedMinutes = minutes.toString().padStart(2, '0');
        return `${paddedHours}:${paddedMinutes} ${ampm}`;
    } catch (e) {
        console.error("Failed to format time:", time24, e);
        return time24;
    }
};

// Helper to safely get YYYY-MM-DD from a Date object in local time
const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const LEVANTINE_MONTHS = [
    'كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 
    'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'
];


// ===================================================================
// ConfirmDeleteModal Component
// ===================================================================
interface ConfirmDeleteModalProps {
    onConfirm: () => void;
    onCancel: () => void;
    title: string;
    message: string;
    isDeleting?: boolean;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ onConfirm, onCancel, title, message, isDeleting }) => (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity" onClick={onCancel}>
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-gray-700 rounded-2xl shadow-2xl w-full max-w-sm transform transition-all" role="dialog" onClick={e => e.stopPropagation()}>
            <div className="p-6">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100/50 dark:bg-red-900/30 backdrop-blur-md">
                        <TrashIcon className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-4">{title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 px-4">{message}</p>
                </div>
            </div>
            <div className="bg-gray-50/50 dark:bg-slate-700/50 px-6 py-4 rounded-b-2xl flex justify-center gap-4 border-t border-gray-200/50 dark:border-gray-700/50">
                <button type="button" onClick={onConfirm} disabled={isDeleting} className="w-full rounded-xl border border-transparent shadow-lg px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-base font-medium text-white hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-70 disabled:cursor-not-allowed transform transition hover:scale-[1.02]">
                    {isDeleting ? 'جاري الحذف...' : 'نعم، قم بالحذف'}
                </button>
                <button type="button" onClick={onCancel} disabled={isDeleting} className="w-full rounded-xl border border-gray-300/50 dark:border-gray-600 shadow-sm px-4 py-2 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-white/80 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed">
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
    const appointmentDate = new Date(appointment.date);
    appointmentDate.setMinutes(appointmentDate.getMinutes() + appointmentDate.getTimezoneOffset());

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-2xl border border-white/20 dark:border-gray-700 rounded-2xl shadow-2xl w-full max-w-md" role="dialog" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-gray-200/50 dark:border-gray-700/50">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">تفاصيل الموعد</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div><p className="text-sm font-medium text-primary-600 dark:text-primary-400">المريض</p><p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{patientName}</p></div>
                    <div><p className="text-sm font-medium text-primary-600 dark:text-primary-400">الطبيب</p><p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{doctorName}</p></div>
                    <div><p className="text-sm font-medium text-primary-600 dark:text-primary-400">التاريخ</p><p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{`${appointmentDate.getFullYear()}/${appointmentDate.getMonth() + 1}/${appointmentDate.getDate()}`}</p></div>
                    <div><p className="text-sm font-medium text-primary-600 dark:text-primary-400">الوقت</p><p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{formatTo12Hour(appointment.time)}</p></div>
                    {appointment.notes && (<div><p className="text-sm font-medium text-primary-600 dark:text-primary-400">ملاحظات</p><p className="text-md text-gray-700 dark:text-gray-300 bg-gray-50/50 dark:bg-slate-700/50 p-3 rounded-xl border border-gray-100 dark:border-gray-600">{appointment.notes}</p></div>)}
                </div>
                <div className="flex justify-end p-4 bg-gray-50/50 dark:bg-slate-700/50 border-t border-gray-200/50 dark:border-gray-700/50 rounded-b-2xl"><button onClick={onClose} className="px-6 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl shadow-lg hover:shadow-primary/30 hover:scale-[1.02] transition-all">إغلاق</button></div>
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
    initialData?: Partial<Appointment> | null;
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


const AppointmentFormModal: React.FC<AppointmentFormModalProps> = ({ appointment, patients, doctors, onSave, onClose, user, initialData }) => {
    const [formData, setFormData] = useState({
        patientId: appointment?.patientId || initialData?.patientId || '',
        doctorId: appointment?.doctorId || initialData?.doctorId || '',
        date: (appointment?.date ? new Date(appointment.date) : (initialData?.date ? new Date(initialData.date) : new Date())).toISOString().split('T')[0],
        time: appointment?.time || initialData?.time || '',
        notes: appointment?.notes || initialData?.notes || '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [showNewPatientForm, setShowNewPatientForm] = useState(false);
    const [newPatientData, setNewPatientData] = useState({ name: '', phone: '', age: '', gender: Gender.Male, isSmoker: false, isPregnant: false });
    
    const [patientSearch, setPatientSearch] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [availableSlots, setAvailableSlots] = useState<{ value: string; label: string; }[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [slotsMessage, setSlotsMessage] = useState('');
    
    const isSecretary = user.role === UserRole.Secretary;

    const diagnosisDoctors = useMemo(() => {
        return doctors.filter(doc => doc.is_diagnosis_doctor);
    }, [doctors]);

    useEffect(() => {
        if (appointment && patients.length > 0) {
            const currentPatient = patients.find(p => p.id === appointment.patientId);
            if (currentPatient) {
                setPatientSearch(currentPatient.name);
            }
        }
        if (initialData?.doctorId && doctors.length > 0) {
             const doctor = doctors.find(d => d.id === initialData.doctorId);
             if (doctor) {
                 // Pre-select patient's doctors if possible
                 // No, this is wrong, the patient isn't selected yet.
             }
        }
    }, [appointment, initialData, patients, doctors]);

    const filteredPatients = useMemo(() => {
        let patientsToList = patients;

        if (formData.doctorId) {
            patientsToList = patients.filter(p => p.doctorIds.includes(formData.doctorId));
        }
        
        if (patientSearch) {
            return patientsToList.filter(p => 
                p.name.toLowerCase().includes(patientSearch.toLowerCase()) || 
                p.code.includes(patientSearch)
            );
        }
        
        return patientsToList;
    }, [patients, patientSearch, formData.doctorId]);
    
    const handlePatientSelect = (patient: Patient) => {
        setFormData(prev => {
            const newState = { ...prev, patientId: patient.id };
             if (!initialData?.time) { // Do not reset time if coming from available slots
                newState.time = '';
             }
            if (!patient.doctorIds.includes(newState.doctorId)) {
                newState.doctorId = '';
            }
            return newState;
        });
        setPatientSearch(patient.name);
        setIsDropdownOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        setFormData(prev => {
            const newState = { ...prev, [name]: value };
            
            // Clear patientId and search text if the newly selected doctor
            // is not associated with the currently selected patient.
            if (name === 'doctorId') {
                 const currentPatient = patients.find(p => p.id === prev.patientId);
                 if (currentPatient && !currentPatient.doctorIds.includes(value)) {
                     newState.patientId = '';
                     setPatientSearch('');
                 }
            }

            // Reset time when doctor or date changes
            if (name === 'doctorId' || name === 'date') {
                 if (!initialData?.time) {
                    newState.time = '';
                 }
            }
            return newState;
        });
    };
    
    useEffect(() => {
        const fetchAndSetSchedule = async () => {
            setSlotsLoading(true);
            setAvailableSlots([]);
            setSlotsMessage('');
    
            if (formData.doctorId && formData.date) {
                try {
                    const schedulesPromise = api.doctorSchedules.getForDoctor(formData.doctorId);
                    const appointmentsPromise = api.appointments.getAll(); 
    
                    const [schedules, allAppointments] = await Promise.all([schedulesPromise, appointmentsPromise]);
                    
                    const selectedDate = new Date(formData.date);
                    selectedDate.setMinutes(selectedDate.getMinutes() + selectedDate.getTimezoneOffset());
                    const dayOfWeek = selectedDate.getDay(); 
                    
                    const daySchedule = schedules.find(s => s.day === dayOfWeek);
    
                    if (!daySchedule || !daySchedule.isWorkDay) {
                        setSlotsMessage('الطبيب غير متاح في هذا اليوم.');
                        return;
                    }
                    
                    const generatedSlots = generateTimeSlots(daySchedule.startTime, daySchedule.endTime, 30);
                    
                    const bookedAppointmentsOnDay = allAppointments
                        .filter(app => app.doctorId === formData.doctorId && app.date === formData.date && app.id !== appointment?.id);
    
                    const bookedSlots = bookedAppointmentsOnDay.map(app => app.time);
                    
                    const freeSlots = generatedSlots.filter(slot => !bookedSlots.includes(slot));
                    
                    if(freeSlots.length === 0) {
                        setSlotsMessage('لا توجد أوقات متاحة في هذا اليوم.');
                    }
                    const slotsWithOptions = freeSlots.map(slot => ({ value: slot, label: formatTo12Hour(slot) }));
                    if (formData.time && !freeSlots.includes(formData.time)) {
                        slotsWithOptions.unshift({ value: formData.time, label: `${formatTo12Hour(formData.time)} (محجوز)` });
                    }
                    setAvailableSlots(slotsWithOptions);
    
                } catch (error) {
                    console.error("Failed to fetch available slots:", error);
                    setSlotsMessage('فشل في تحميل الأوقات المتاحة.');
                } finally {
                    setSlotsLoading(false);
                }
            } else {
                setSlotsLoading(false);
            }
        };
        fetchAndSetSchedule();
    }, [formData.doctorId, formData.date, appointment?.id, formData.time]);


    const patientDoctors = useMemo(() => {
        if (showNewPatientForm) {
            if (isSecretary) {
                return diagnosisDoctors;
            }
            return doctors;
        }

        if (!formData.patientId) {
            return doctors;
        }
        const selectedPatient = patients.find(p => p.id === formData.patientId);
        return selectedPatient ? doctors.filter(d => selectedPatient.doctorIds.includes(d.id)) : [];
    }, [formData.patientId, patients, doctors, showNewPatientForm, isSecretary, diagnosisDoctors]);


    const handleNewPatientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setNewPatientData(prev => {
            const updatedState = {
                ...prev,
                [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
            };
    
            if (name === 'gender' && value === Gender.Male) {
                updatedState.isPregnant = false;
            }
            
            return updatedState;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            let patientIdForAppointment = formData.patientId;
            let refreshPatientsList = false;
        
            if (showNewPatientForm) {
                if (isSecretary && patientDoctors.length === 0) {
                    throw new Error('لا يوجد اطباء تشخيص يرجى الطلب من المدير اضافة طبيب تشخيص');
                }

                if (!newPatientData.name || !newPatientData.phone || !newPatientData.age || !formData.doctorId) {
                    throw new Error('يرجى ملء اسم المريض الجديد ورقم هاتفه وعمره واختيار طبيب.');
                }
                const newPatient = await api.patients.create({
                    name: newPatientData.name,
                    phone: newPatientData.phone,
                    doctorIds: [formData.doctorId],
                    age: parseInt(newPatientData.age, 10) || 0,
                    gender: newPatientData.gender,
                    isSmoker: newPatientData.isSmoker,
                    isPregnant: newPatientData.gender === Gender.Female ? newPatientData.isPregnant : false,
                    notes: 'مريض جديد تم إنشاؤه من صفحة المواعيد',
                    createdAt: new Date().toISOString(),
                }, user.id);
                patientIdForAppointment = newPatient.id;
                refreshPatientsList = true;
            }
        
            if (!patientIdForAppointment) {
                throw new Error('يرجى اختيار مريض.');
            }
    
            if(!formData.time) {
                throw new Error('يرجى اختيار وقت للموعد.');
            }
        
            const appointmentData = {
                ...formData,
                patientId: patientIdForAppointment,
                createdBy: user.id,
            };
        
            const dataToSave = appointment ? { ...appointment, ...appointmentData } : appointmentData;
            await onSave(dataToSave, refreshPatientsList);
        } catch (error) {
            alert(`فشل الحفظ: ${error instanceof Error ? error.message : "خطأ غير معروف"}`);
        } finally {
            setIsSaving(false);
        }
    };

    const isEditMode = !!appointment;
    // Glassmorphism Input Style
    const inputStyle = "w-full px-4 py-2.5 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent text-gray-800 dark:text-gray-100 placeholder-gray-400 transition-all";


    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-2xl border border-white/20 dark:border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" role="dialog" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-5 border-b border-gray-200/50 dark:border-gray-700/50">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-wide">{isEditMode ? 'تعديل الموعد' : 'إضافة موعد جديد'}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <div className="md:col-span-2">
                           {showNewPatientForm ? (
                                <div className="p-5 border border-primary-200/50 dark:border-primary-700/30 rounded-2xl bg-primary-50/30 dark:bg-primary-900/10 backdrop-blur-sm">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-bold text-primary-700 dark:text-primary-300">إضافة مريض جديد</h3>
                                        <button 
                                            type="button" 
                                            onClick={() => setShowNewPatientForm(false)} 
                                            className="text-sm text-primary-600 hover:text-primary-800 dark:hover:text-primary-300 underline font-medium transition-colors"
                                        >
                                            العودة لاختيار مريض
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="newPatientName" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">اسم المريض</label>
                                            <input type="text" id="newPatientName" name="name" value={newPatientData.name} onChange={handleNewPatientChange} required className={inputStyle} placeholder="الاسم الكامل" />
                                        </div>
                                        <div>
                                            <label htmlFor="newPatientPhone" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">هاتف المريض</label>
                                            <input type="tel" id="newPatientPhone" name="phone" value={newPatientData.phone} onChange={handleNewPatientChange} required className={inputStyle} placeholder="رقم الهاتف" />
                                        </div>
                                        <div>
                                            <label htmlFor="newPatientAge" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">العمر</label>
                                            <input type="number" id="newPatientAge" name="age" value={newPatientData.age} onChange={handleNewPatientChange} required className={inputStyle} placeholder="العمر" />
                                        </div>
                                        <div>
                                            <label htmlFor="newPatientGender" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">الجنس</label>
                                            <select id="newPatientGender" name="gender" value={newPatientData.gender} onChange={handleNewPatientChange} className={inputStyle}>
                                                <option value={Gender.Male}>ذكر</option>
                                                <option value={Gender.Female}>أنثى</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2 flex items-center space-x-4 pt-2 rtl:space-x-reverse">
                                            <label className="flex items-center cursor-pointer p-2 rounded-lg hover:bg-white/30 dark:hover:bg-black/20 transition-colors">
                                                <input type="checkbox" name="isSmoker" checked={newPatientData.isSmoker} onChange={handleNewPatientChange} className="h-5 w-5 text-primary rounded border-gray-300 dark:border-gray-500 focus:ring-primary" />
                                                <span className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">مدخن</span>
                                            </label>
                                            {newPatientData.gender === Gender.Female && (
                                                <label className="flex items-center cursor-pointer p-2 rounded-lg hover:bg-white/30 dark:hover:bg-black/20 transition-colors">
                                                    <input type="checkbox" name="isPregnant" checked={newPatientData.isPregnant} onChange={handleNewPatientChange} className="h-5 w-5 text-primary rounded border-gray-300 dark:border-gray-500 focus:ring-primary" />
                                                    <span className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">حامل</span>
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div ref={dropdownRef} className="relative">
                                    <div className="flex justify-between items-center mb-1">
                                        <label htmlFor="patientSearch" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">المريض</label>
                                        <button 
                                            type="button"
                                            onClick={() => setShowNewPatientForm(true)}
                                            className="flex items-center text-sm font-bold text-primary hover:text-primary-700 transition-colors bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded-md"
                                        >
                                            <PlusIcon className="h-4 w-4 ml-1" />
                                            مريض جديد
                                        </button>
                                    </div>
                                    <div className="relative group">
                                        <SearchIcon className="absolute top-1/2 right-3 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                        <input
                                            id="patientSearch"
                                            type="text"
                                            value={patientSearch}
                                            onChange={(e) => {
                                                setPatientSearch(e.target.value);
                                                if (formData.patientId && patients.find(p => p.id === formData.patientId)?.name !== e.target.value) {
                                                    setFormData(prev => ({ ...prev, patientId: '' }));
                                                }
                                                setIsDropdownOpen(true);
                                            }}
                                            onFocus={() => setIsDropdownOpen(true)}
                                            placeholder="ابحث عن مريض بالاسم أو الكود..."
                                            required={!formData.patientId}
                                            autoComplete="off"
                                            className={inputStyle + " pr-10"}
                                        />
                                    </div>
                                    
                                    {isDropdownOpen && (
                                        <div className="absolute z-10 mt-2 w-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar">
                                            {filteredPatients.length > 0 ? (
                                                filteredPatients.map(p => (
                                                    <div
                                                        key={p.id}
                                                        onClick={() => handlePatientSelect(p)}
                                                        className="px-4 py-3 cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900/30 text-gray-900 dark:text-gray-200 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-none"
                                                    >
                                                        {p.name}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-4 py-3 text-gray-500 text-center">لا يوجد مرضى مطابقون</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="doctorId" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">الطبيب</label>
                            {showNewPatientForm && isSecretary && patientDoctors.length === 0 ? (
                                <div className="p-3 border border-red-400 dark:border-red-600 rounded-xl bg-red-50/50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-center text-sm font-medium">
                                    لا يوجد اطباء تشخيص يرجى الطلب من المدير اضافة طبيب تشخيص
                                </div>
                            ) : (
                                <div className="relative">
                                    <select id="doctorId" name="doctorId" value={formData.doctorId} onChange={handleChange} required className={`${inputStyle} appearance-none cursor-pointer`} disabled={!!initialData?.doctorId && !formData.patientId}>
                                        <option value="">اختر طبيب...</option>
                                        {patientDoctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div>
                            <label htmlFor="date" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">التاريخ</label>
                            <div className="relative">
                                <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required className={`${inputStyle} pr-10 appearance-none`} />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="time" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">الوقت</label>
                            {slotsLoading ? (
                                <div className="h-11 flex items-center justify-center text-sm text-primary animate-pulse font-medium bg-white/30 rounded-xl">جاري تحميل الأوقات...</div>
                            ) : (
                                <div className="relative">
                                    <select id="time" name="time" value={formData.time} onChange={handleChange} required className={`${inputStyle} pr-10 appearance-none cursor-pointer`} disabled={!formData.doctorId || !formData.date}>
                                        <option value="">اختر وقت...</option>
                                        {availableSlots.length > 0 ? (
                                            availableSlots.map(slot => <option key={slot.value} value={slot.value}>{slot.label}</option>)
                                        ) : (
                                            <option disabled>{slotsMessage || 'اختر طبيب وتاريخ'}</option>
                                        )}
                                    </select>
                                     <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <ClockIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="md:col-span-2"><label htmlFor="notes" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">ملاحظات</label><textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} className={inputStyle} placeholder="أي ملاحظات إضافية..."></textarea></div>
                        
                    </div>
                    <div className="flex justify-end items-center p-5 bg-gray-50/50 dark:bg-slate-700/50 border-t border-gray-200/50 dark:border-gray-700/50 rounded-b-2xl">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 ml-3 bg-white/50 dark:bg-gray-600/50 border border-gray-200 dark:border-gray-500 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-500 transition-all shadow-sm">إلغاء</button>
                        <button type="submit" disabled={isSaving || (showNewPatientForm && isSecretary && patientDoctors.length === 0)} className="px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 border border-transparent rounded-xl text-sm font-bold text-white hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">{isSaving ? 'جاري الحفظ...' : 'حفظ'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ===================================================================
// AvailableSlotsModal Component
// ===================================================================
interface AvailableSlotsModalProps {
    doctors: User[];
    allAppointments: Appointment[];
    onClose: () => void;
    onSlotSelect: (doctorId: string, time: string) => void;
    date: Date;
}

const AvailableSlotsModal: React.FC<AvailableSlotsModalProps> = ({ doctors, allAppointments, onClose, onSlotSelect, date }) => {
    const [schedulesByDoctor, setSchedulesByDoctor] = useState<Record<string, DaySchedule[]>>({});
    const [loadingSchedules, setLoadingSchedules] = useState(true);

    useEffect(() => {
        const fetchSchedules = async () => {
            setLoadingSchedules(true);
            try {
                const schedulePromises = doctors.map(doc => api.doctorSchedules.getForDoctor(doc.id));
                const allSchedulesArrays = await Promise.all(schedulePromises);
                const schedulesMap = doctors.reduce((acc, doc, index) => {
                    acc[doc.id] = allSchedulesArrays[index];
                    return acc;
                }, {} as Record<string, DaySchedule[]>);
                setSchedulesByDoctor(schedulesMap);
            } catch (error) {
                console.error("Failed to fetch doctor schedules", error);
            } finally {
                setLoadingSchedules(false);
            }
        };
        if(doctors.length > 0) fetchSchedules();
    }, [doctors]);
    
    const dateString = getLocalDateString(date);
    const dayOfWeek = date.getDay();

    const renderDoctorSlots = (doctor: User) => {
        const schedule = schedulesByDoctor[doctor.id];
        if (!schedule) return null; // Still loading or error for this doc
        
        const daySchedule = schedule.find(s => s.day === dayOfWeek);
        if (!daySchedule || !daySchedule.isWorkDay) {
            return (
                <div key={doctor.id} className="p-4 border-b border-gray-100 dark:border-gray-700/50 last:border-none">
                    <h3 className="font-bold text-lg dark:text-gray-200">{doctor.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-400"></span>
                        غير متاح اليوم
                    </p>
                </div>
            );
        }

        const allSlots = generateTimeSlots(daySchedule.startTime, daySchedule.endTime, 30);
        const bookedSlots = allAppointments
            .filter(app => app.doctorId === doctor.id && app.date === dateString)
            .map(app => app.time);
        
        const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));
        
        return (
            <div key={doctor.id} className="p-5 border-b border-gray-100 dark:border-gray-700/50 last:border-none">
                <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{doctor.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 font-medium">
                        {availableSlots.length} وقت متاح
                    </span>
                </div>
                {availableSlots.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {availableSlots.map(slot => (
                            <button
                                key={slot}
                                onClick={() => onSlotSelect(doctor.id, slot)}
                                className="px-4 py-2 bg-white dark:bg-slate-700 text-primary-700 dark:text-primary-300 font-semibold rounded-xl border border-primary-100 dark:border-slate-600 hover:bg-primary-50 dark:hover:bg-slate-600 hover:border-primary-300 dark:hover:border-primary-500 transition-all text-sm shadow-sm"
                            >
                                {formatTo12Hour(slot)}
                            </button>
                        ))}
                    </div>
                ) : (
                     <p className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-700/30 p-2 rounded-lg inline-block">لا توجد مواعيد متاحة.</p>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-2xl border border-white/20 dark:border-gray-700 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden" role="dialog" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-5 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-slate-700/20">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">المواعيد المتاحة</h2>
                        <p className="text-sm text-primary-600 dark:text-primary-400 font-medium mt-0.5">
                            ليوم ({new Intl.DateTimeFormat('ar-EG', { calendar: 'gregory', year: 'numeric', month: 'long', day: 'numeric' }).format(date)})
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" /></button>
                </div>
                <div className="p-0 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {loadingSchedules ? (
                        <div className="p-10"><CenteredLoadingSpinner /></div>
                    ) : (
                        doctors.map(renderDoctorSlots)
                    )}
                </div>
            </div>
        </div>
    );
};


// ===================================================================
// Main AppointmentsPage Component
// ===================================================================
interface AppointmentsPageProps {
    user: User;
    refreshTrigger: number;
}


const AppointmentsPage: React.FC<AppointmentsPageProps> = ({ user, refreshTrigger }) => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [doctors, setDoctors] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isAddingAppointment, setIsAddingAppointment] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
    const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(null);
    const [deletingAppointment, setDeletingAppointment] = useState<Appointment | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isViewingAvailableSlots, setIsViewingAvailableSlots] = useState(false);
    const [initialAppointmentData, setInitialAppointmentData] = useState<Partial<Appointment> | null>(null);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

    // New states for interactive pickers
    const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
    const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const [allApps, docs, patsResponse] = await Promise.all([
                api.appointments.getAll(),
                api.doctors.getAll(),
                api.patients.getAll({ page: 1, per_page: 9999 }),
            ]);
            
            let appsToDisplay = allApps;
            // Secretaries, Admins, and Sub-Managers can see all appointments.
            // For Doctors, visibility depends on the 'view_all_appointments' permission.
            if (user.role === UserRole.Doctor) {
                const hasPermission = user.permissions?.some(p => p.name === 'view_all_appointments');
                if (!hasPermission) {
                    appsToDisplay = allApps.filter(app => app.doctorId === user.id);
                }
            }
            
            setAppointments(appsToDisplay);
            setDoctors(docs);
            setPatients(patsResponse.patients);
        } catch (error) {
             if (error instanceof Error && error.message.includes('Failed to fetch')) {
                setFetchError('فشل جلب البيانات الرجاء التأكد من اتصالك بالانترنت واعادة تحميل البيانات');
            } else {
                setFetchError('حدث خطأ غير متوقع.');
                console.error("Failed to fetch data:", error);
            }
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData, refreshTrigger]);

    const handleSlotSelect = (doctorId: string, time: string) => {
        setIsViewingAvailableSlots(false);
        setInitialAppointmentData({ doctorId, time, date: getLocalDateString(selectedDate) });
        setIsAddingAppointment(true);
    };

    const handleSaveAppointment = async (data: Omit<Appointment, 'id'> | Appointment, refreshPatients: boolean) => {
        try {
            const dataWithUser = { ...data, createdBy: user.id };
            if ('id' in dataWithUser) {
                await api.appointments.update(dataWithUser.id, dataWithUser);
            } else {
                await api.appointments.create(dataWithUser);
            }
            setIsAddingAppointment(false);
            setEditingAppointment(null);
            await fetchData();
        } catch (error) {
            console.error(`Failed to save appointment:`, error);
            throw error;
        }
    };

    const confirmDeleteAppointment = async () => {
        if (deletingAppointment) {
            setIsDeleting(true);
            try {
                await api.appointments.delete(deletingAppointment.id);
                setDeletingAppointment(null);
                await fetchData();
            } catch (error) {
                console.error("Failed to delete appointment:", error);
                alert(`فشل حذف الموعد: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const getPatientName = (id: string) => patients.find(p => p.id === id)?.name || 'مريض غير معروف';
    const getDoctorName = (id: string) => doctors.find(d => d.id === id)?.name || 'طبيب غير معروف';

     const appointmentsByDate = useMemo(() => {
        return appointments.reduce((acc, app) => {
            const date = app.date;
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(app);
            return acc;
        }, {} as Record<string, Appointment[]>);
    }, [appointments]);

    const { daysToRender, headerTitle } = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        // Header title logic
        let headerTitle = "";
        if (viewMode === 'month') {
            headerTitle = new Intl.DateTimeFormat('ar-EG', { calendar: 'gregory', month: 'long', year: 'numeric' }).format(currentDate);
        } else {
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            
            const startStr = new Intl.DateTimeFormat('ar-EG', { calendar: 'gregory', month: 'short', day: 'numeric' }).format(startOfWeek);
            const endStr = new Intl.DateTimeFormat('ar-EG', { calendar: 'gregory', month: 'short', day: 'numeric' }).format(endOfWeek);
            headerTitle = `${startStr} - ${endStr}`;
        }

        let days = [];

        if (viewMode === 'month') {
            const firstDayOfMonth = new Date(year, month, 1);
            const lastDayOfMonth = new Date(year, month + 1, 0);

            const startDate = new Date(firstDayOfMonth);
            startDate.setDate(startDate.getDate() - startDate.getDay());

            const endDate = new Date(lastDayOfMonth);
            if (endDate.getDay() !== 6) { 
              endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
            }

            let day = new Date(startDate);
            while (day <= endDate) {
                days.push(new Date(day));
                day.setDate(day.getDate() + 1);
            }
        } else {
            // Week view
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
            
            for (let i = 0; i < 7; i++) {
                const d = new Date(startOfWeek);
                d.setDate(startOfWeek.getDate() + i);
                days.push(d);
            }
        }
        
        return { daysToRender: days, headerTitle };
    }, [currentDate, viewMode]);

    const selectedDateAppointments = useMemo(() => {
        if (!selectedDate) return [];
        const dateString = getLocalDateString(selectedDate);
        const dayAppointments = appointmentsByDate[dateString] || [];

        if (!searchTerm) return dayAppointments.sort((a,b) => a.time.localeCompare(b.time));

        return dayAppointments.filter(app =>
            getPatientName(app.patientId).toLowerCase().includes(searchTerm.toLowerCase()) ||
            getDoctorName(app.doctorId).toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a,b) => a.time.localeCompare(b.time));
    }, [selectedDate, appointmentsByDate, searchTerm, getPatientName, getDoctorName]);

    const changeDate = (amount: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            if (viewMode === 'month') {
                newDate.setMonth(prev.getMonth() + amount);
            } else {
                newDate.setDate(prev.getDate() + (amount * 7));
            }
            return newDate;
        });
    };

    const goToToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    };

    const handleMonthSelect = (monthIndex: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(monthIndex);
            return newDate;
        });
        setIsMonthPickerOpen(false);
    };

    const handleYearSelect = (year: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setFullYear(year);
            return newDate;
        });
        setIsYearPickerOpen(false);
    };

    // Generate years for picker
    const currentYear = new Date().getFullYear();
    const yearsList = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

    return (
        <div className="space-y-6">
            {/* Top Search Bar */}
            <div className="mb-6">
                <div className="relative w-full">
                   <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                       <SearchIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                   </div>
                   <input
                       type="text"
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       placeholder="ابحث في مواعيد اليوم المحدد..."
                       className="w-full pl-4 pr-12 py-3.5 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-gray-600 rounded-2xl shadow-inner focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white/60 dark:focus:bg-slate-800/60 transition-all text-gray-800 dark:text-gray-100 placeholder-gray-500"
                   />
                </div>
            </div>

            {/* Glass Calendar Container */}
            <div className="bg-white/30 dark:bg-slate-900/30 backdrop-blur-2xl border border-white/40 dark:border-white/10 rounded-3xl shadow-xl overflow-hidden p-4 sm:p-6 relative">
                
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-400/20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-teal-400/20 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center mb-6 gap-4">
                    
                    {/* Right Side: Navigation & Title (RTL Start) */}
                    <div className="flex items-center gap-4 order-1 lg:order-1 w-full lg:w-auto justify-between lg:justify-start relative z-20">
                        
                        {viewMode === 'month' ? (
                            <div className="flex items-center gap-2">
                                {/* Month Picker */}
                                <div className="relative">
                                    <button
                                        onClick={() => { setIsMonthPickerOpen(!isMonthPickerOpen); setIsYearPickerOpen(false); }}
                                        className="flex items-center gap-1 text-lg sm:text-2xl font-bold text-gray-800 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 px-2 py-1 rounded-lg transition-all"
                                    >
                                        {LEVANTINE_MONTHS[currentDate.getMonth()]} ({currentDate.getMonth() + 1})
                                        <ChevronDownIcon className={`w-5 h-5 transition-transform ${isMonthPickerOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {isMonthPickerOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setIsMonthPickerOpen(false)}></div>
                                            <div className="absolute top-full right-0 mt-2 w-64 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl shadow-2xl rounded-2xl p-3 z-50 grid grid-cols-3 gap-2 border border-white/20 dark:border-gray-600 animate-fade-in-down">
                                                {LEVANTINE_MONTHS.map((month, index) => (
                                                    <button
                                                        key={month}
                                                        onClick={() => handleMonthSelect(index)}
                                                        className={`p-2 text-sm font-medium rounded-xl transition-all ${currentDate.getMonth() === index ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                                                    >
                                                        {month}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Year Picker */}
                                <div className="relative">
                                    <button
                                        onClick={() => { setIsYearPickerOpen(!isYearPickerOpen); setIsMonthPickerOpen(false); }}
                                        className="flex items-center gap-1 text-lg sm:text-2xl font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-2 py-1 rounded-lg transition-all"
                                    >
                                        {currentDate.getFullYear()}
                                        <ChevronDownIcon className={`w-5 h-5 transition-transform ${isYearPickerOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {isYearPickerOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setIsYearPickerOpen(false)}></div>
                                            <div className="absolute top-full right-0 mt-2 w-28 max-h-64 overflow-y-auto custom-scrollbar bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl shadow-2xl rounded-2xl p-2 z-50 border border-white/20 dark:border-gray-600 animate-fade-in-down">
                                                {yearsList.map((year) => (
                                                    <button
                                                        key={year}
                                                        onClick={() => handleYearSelect(year)}
                                                        className={`w-full p-2 text-sm font-medium rounded-xl transition-all mb-1 ${currentDate.getFullYear() === year ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                                                    >
                                                        {year}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap min-w-[140px]">{headerTitle}</h2>
                        )}

                        <div className="flex items-center gap-1 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md p-1.5 rounded-xl border border-white/20 shadow-sm">
                            <button onClick={() => changeDate(-1)} className="p-2 rounded-lg hover:bg-white/60 dark:hover:bg-slate-600 text-gray-600 dark:text-gray-300 transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                </svg>
                            </button>
                            <button onClick={goToToday} className="px-3 py-1 text-xs font-bold rounded-lg bg-white dark:bg-slate-600 text-primary-600 dark:text-primary-300 shadow-sm transition-transform hover:scale-105">
                                اليوم
                            </button>
                            <button onClick={() => changeDate(1)} className="p-2 rounded-lg hover:bg-white/60 dark:hover:bg-slate-600 text-gray-600 dark:text-gray-300 transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Left Side: Controls Toolbar (RTL End) */}
                    <div className="flex items-center gap-3 order-2 lg:order-2 w-full lg:w-auto justify-center lg:justify-end overflow-x-auto py-1">
                        {/* View Toggles */}
                        <div className="flex bg-gray-100/50 dark:bg-slate-700/50 backdrop-blur-sm rounded-xl p-1 shrink-0 border border-white/10">
                            <button 
                                onClick={() => setViewMode('month')}
                                className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${viewMode === 'month' ? 'bg-white dark:bg-slate-600 text-primary shadow-sm scale-105' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                            >
                                شهر
                            </button>
                            <button 
                                onClick={() => setViewMode('week')}
                                className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${viewMode === 'week' ? 'bg-white dark:bg-slate-600 text-primary shadow-sm scale-105' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                            >
                                أسبوع
                            </button>
                        </div>

                        {/* Desktop Action Buttons (Hidden on Mobile) */}
                        <div className="hidden md:flex items-center gap-2 shrink-0 pr-3 mr-1 border-r border-gray-200/50 dark:border-gray-600/50">
                             <button 
                                onClick={() => setIsViewingAvailableSlots(true)} 
                                className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-teal-500/30 hover:scale-105 transition-all text-sm font-bold"
                            >
                                <CalendarIcon className="h-4 w-4" />
                                المواعيد المتاحة
                            </button>
                            {(user.role === UserRole.Admin || user.role === UserRole.Secretary) && (
                                <button 
                                    onClick={() => {
                                        setInitialAppointmentData({ date: getLocalDateString(selectedDate) });
                                        setIsAddingAppointment(true);
                                    }}
                                    className="flex items-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-primary/30 hover:scale-105 transition-all text-sm font-bold"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                    موعد جديد
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2 sm:gap-4 text-center relative z-10">
                    {/* Weekday Headers */}
                    {DAY_NAMES.map(day => (
                        <div key={day} className="text-xs font-bold text-gray-400 dark:text-gray-500 py-2 uppercase tracking-widest">
                            {day}
                        </div>
                    ))}

                    {/* Days */}
                    {daysToRender.map((day, index) => {
                        const dateString = getLocalDateString(day);
                        const dailyAppointments = appointmentsByDate[dateString] || [];
                        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                        const isToday = new Date().toDateString() === day.toDateString();
                        const isSelected = selectedDate?.toDateString() === day.toDateString();
                        const hasAppointments = dailyAppointments.length > 0;
                        
                        // Glassy Cell Styling
                        let cellClasses = "relative flex flex-col items-center justify-center h-10 w-10 sm:h-14 sm:w-14 mx-auto rounded-2xl cursor-pointer transition-all duration-300 select-none group";
                        let textClasses = "text-sm sm:text-base font-bold z-10 relative";
                        
                        if (isSelected) {
                            // Liquid selected state
                            cellClasses += " bg-gradient-to-br from-primary-400 to-primary-600 shadow-lg shadow-primary/40 scale-110 ring-2 ring-white/50 dark:ring-white/20";
                            textClasses += " text-white";
                        } else if (isToday) {
                            cellClasses += " bg-primary-50/50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-300";
                        } else if (viewMode === 'month' && !isCurrentMonth) {
                            textClasses += " text-gray-300 dark:text-gray-600";
                        } else {
                            cellClasses += " hover:bg-white/50 dark:hover:bg-slate-700/50 hover:shadow-sm";
                            textClasses += " text-gray-700 dark:text-gray-300";
                        }
                        
                        return (
                            <div key={index} className="py-1">
                                <div className={cellClasses} onClick={() => setSelectedDate(day)}>
                                    <span className={textClasses}>{day.getDate()}</span>
                                    
                                    {/* Appointment Indicator (Dot/Badge) */}
                                    {hasAppointments && (
                                        <span className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full shadow-sm transition-colors ${isSelected ? 'bg-white' : 'bg-gradient-to-r from-orange-400 to-pink-500'}`}></span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mt-8">
                 {selectedDate && (
                    <h3 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-100 px-2 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                        مواعيد يوم: {new Intl.DateTimeFormat('ar-EG', { calendar: 'gregory', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(selectedDate)}
                    </h3>
                )}
                {loading ? <CenteredLoadingSpinner /> : selectedDateAppointments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {selectedDateAppointments.map(app => (
                             <div key={app.id} className="group relative bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/30 dark:border-gray-700 p-5 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                                {/* Glass Shine Effect */}
                                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                
                                <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <div className="border-l-4 border-primary pl-3 ml-3 rounded-sm">
                                                <p className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1" title={getPatientName(app.patientId)}>{getPatientName(app.patientId)}</p>
                                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">د. {getDoctorName(app.doctorId)}</p>
                                            </div>
                                            <span className="bg-white/60 dark:bg-slate-700/60 backdrop-blur-md text-primary-700 dark:text-primary-300 text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap shadow-sm border border-white/20">
                                                {formatTo12Hour(app.time)}
                                            </span>
                                        </div>
                                        {app.notes && <p className="text-xs text-gray-600 dark:text-gray-300 mt-4 bg-gray-50/50 dark:bg-slate-700/50 p-3 rounded-xl border border-gray-100/50 dark:border-gray-600/50 line-clamp-2">{app.notes}</p>}
                                    </div>
                                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200/30 dark:border-gray-700/30">
                                        <button onClick={() => setViewingAppointment(app)} className="p-2 rounded-full hover:bg-white/50 dark:hover:bg-gray-600/50 text-gray-500 dark:text-gray-400 hover:text-primary transition-colors" title="عرض التفاصيل"><EyeIcon className="h-5 w-5" /></button>
                                        {(user.role === UserRole.Admin || user.role === UserRole.Secretary) && (
                                            <>
                                                <button onClick={() => setEditingAppointment(app)} className="p-2 rounded-full text-blue-500/80 hover:text-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors" title="تعديل"><PencilIcon className="h-5 w-5" /></button>
                                                <button onClick={() => setDeletingAppointment(app)} className="p-2 rounded-full text-red-500/80 hover:text-red-600 hover:bg-red-50/50 dark:hover:bg-red-900/20 transition-colors" title="حذف"><TrashIcon className="h-5 w-5" /></button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 text-gray-500 dark:text-gray-400 bg-white/20 dark:bg-slate-800/20 backdrop-blur-lg rounded-3xl border border-white/10 dark:border-white/5">
                        <CalendarIcon className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4 opacity-50" />
                        <p className="font-medium text-lg">{searchTerm ? 'لا توجد مواعيد تطابق بحثك.' : 'لا توجد مواعيد لهذا اليوم.'}</p>
                        <p className="text-sm opacity-70 mt-1">استرح قليلاً أو أضف موعداً جديداً.</p>
                    </div>
                )}
            </div>

             <div className="lg:hidden fixed bottom-20 right-4 flex flex-col gap-3 z-30">
                <button 
                    onClick={() => setIsViewingAvailableSlots(true)} 
                    className="bg-gradient-to-r from-teal-500 to-teal-600 text-white p-4 rounded-full shadow-lg shadow-teal-500/30 hover:scale-110 transition-transform"
                    aria-label="المواعيد المتاحة"
                >
                    <CalendarIcon className="h-6 w-6" />
                </button>
                {(user.role === UserRole.Admin || user.role === UserRole.Secretary) && (
                    <button 
                        onClick={() => {
                            setInitialAppointmentData({ date: getLocalDateString(selectedDate) });
                            setIsAddingAppointment(true);
                        }}
                        className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-4 rounded-full shadow-lg shadow-primary/30 hover:scale-110 transition-transform"
                        aria-label="موعد جديد"
                    >
                        <PlusIcon className="h-6 w-6" />
                    </button>
                )}
            </div>
            
            {isViewingAvailableSlots && (
                <AvailableSlotsModal
                    doctors={doctors}
                    allAppointments={appointments}
                    onClose={() => setIsViewingAvailableSlots(false)}
                    onSlotSelect={handleSlotSelect}
                    date={selectedDate}
                />
            )}
            
            {(isAddingAppointment || editingAppointment) && (
                <AppointmentFormModal 
                    key={editingAppointment?.id || 'add'}
                    appointment={editingAppointment || undefined}
                    patients={patients}
                    doctors={doctors}
                    onSave={handleSaveAppointment}
                    onClose={() => { 
                        setIsAddingAppointment(false); 
                        setEditingAppointment(null); 
                        setInitialAppointmentData(null); 
                    }}
                    user={user}
                    initialData={initialAppointmentData}
                />
            )}
            {viewingAppointment && <ViewAppointmentModal appointment={viewingAppointment} patientName={getPatientName(viewingAppointment.patientId)} doctorName={getDoctorName(viewingAppointment.doctorId)} onClose={() => setViewingAppointment(null)} />}
            {deletingAppointment && (
                <ConfirmDeleteModal
                    title="حذف موعد"
                    message={`هل أنت متأكد من حذف موعد ${getPatientName(deletingAppointment.patientId)}؟`}
                    onConfirm={confirmDeleteAppointment}
                    onCancel={() => !isDeleting && setDeletingAppointment(null)}
                    isDeleting={isDeleting}
                />
            )}
        </div>
    );
};

export default AppointmentsPage;
