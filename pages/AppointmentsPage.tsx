import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { User, Appointment, Patient, UserRole, Gender, DaySchedule } from '../types';
import { api } from '../services/api';
import { PlusIcon, PencilIcon, TrashIcon, XIcon, EyeIcon, SearchIcon, CalendarIcon, ClockIcon } from '../components/Icons';
import { CenteredLoadingSpinner } from '../components/LoadingSpinner';
import { DAY_NAMES } from '../constants';

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
    isDeleting?: boolean;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ onConfirm, onCancel, title, message, isDeleting }) => (
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
                <button type="button" onClick={onConfirm} disabled={isDeleting} className="w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-400 disabled:cursor-not-allowed">
                    {isDeleting ? 'جاري الحذف...' : 'نعم، قم بالحذف'}
                </button>
                <button type="button" onClick={onCancel} disabled={isDeleting} className="w-full rounded-md border border-gray-300 dark:border-gray-500 shadow-sm px-4 py-2 bg-white dark:bg-gray-600 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed">
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
        if (!formData.patientId) {
            return doctors;
        }
        const selectedPatient = patients.find(p => p.id === formData.patientId);
        return selectedPatient ? doctors.filter(d => selectedPatient.doctorIds.includes(d.id)) : [];
    }, [formData.patientId, patients, doctors]);


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
                                        <div>
                                            <label htmlFor="newPatientAge" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العمر</label>
                                            <input type="number" id="newPatientAge" name="age" value={newPatientData.age} onChange={handleNewPatientChange} required className={inputStyle} placeholder="العمر" />
                                        </div>
                                        <div>
                                            <label htmlFor="newPatientGender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الجنس</label>
                                            <select id="newPatientGender" name="gender" value={newPatientData.gender} onChange={handleNewPatientChange} className={inputStyle}>
                                                <option value={Gender.Male}>ذكر</option>
                                                <option value={Gender.Female}>أنثى</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2 flex items-center space-x-4 pt-2">
                                            <label className="flex items-center cursor-pointer">
                                                <input type="checkbox" name="isSmoker" checked={newPatientData.isSmoker} onChange={handleNewPatientChange} className="h-4 w-4 text-primary rounded border-gray-300 dark:border-gray-500 focus:ring-primary" />
                                                <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">مدخن</span>
                                            </label>
                                            {newPatientData.gender === Gender.Female && (
                                                <label className="flex items-center cursor-pointer">
                                                    <input type="checkbox" name="isPregnant" checked={newPatientData.isPregnant} onChange={handleNewPatientChange} className="h-4 w-4 text-primary rounded border-gray-300 dark:border-gray-500 focus:ring-primary" />
                                                    <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">حامل</span>
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div ref={dropdownRef} className="relative">
                                    <div className="flex justify-between items-center mb-1">
                                        <label htmlFor="patientSearch" className="block text-sm font-medium text-gray-700 dark:text-gray-300">المريض</label>
                                        <button 
                                            type="button"
                                            onClick={() => setShowNewPatientForm(true)}
                                            className="flex items-center text-sm font-medium text-primary hover:text-primary-700 transition-colors"
                                        >
                                            <PlusIcon className="h-4 w-4 ml-1" />
                                            مريض جديد
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <SearchIcon className="absolute top-1/2 right-3 -translate-y-1/2 h-5 w-5 text-gray-400" />
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
                                        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                            {filteredPatients.length > 0 ? (
                                                filteredPatients.map(p => (
                                                    <div
                                                        key={p.id}
                                                        onClick={() => handlePatientSelect(p)}
                                                        className="px-4 py-2 cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-900/40 text-gray-900 dark:text-gray-200"
                                                    >
                                                        {p.name}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-4 py-2 text-gray-500">لا يوجد مرضى مطابقون</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="doctorId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الطبيب</label>
                            <select id="doctorId" name="doctorId" value={formData.doctorId} onChange={handleChange} required className={inputStyle} disabled={!!initialData?.doctorId && !formData.patientId}>
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
// AvailableSlotsModal Component
// ===================================================================
interface AvailableSlotsModalProps {
    doctors: User[];
    allAppointments: Appointment[];
    onClose: () => void;
    onSlotSelect: (doctorId: string, time: string) => void;
}

const AvailableSlotsModal: React.FC<AvailableSlotsModalProps> = ({ doctors, allAppointments, onClose, onSlotSelect }) => {
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
    
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const dayOfWeek = today.getDay();

    const renderDoctorSlots = (doctor: User) => {
        const schedule = schedulesByDoctor[doctor.id];
        if (!schedule) return null; // Still loading or error for this doc
        
        const daySchedule = schedule.find(s => s.day === dayOfWeek);
        if (!daySchedule || !daySchedule.isWorkDay) {
            return (
                <div key={doctor.id} className="p-4 border-b dark:border-gray-700">
                    <h3 className="font-bold text-lg dark:text-gray-200">{doctor.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">غير متاح اليوم.</p>
                </div>
            );
        }

        const allSlots = generateTimeSlots(daySchedule.startTime, daySchedule.endTime, 30);
        const bookedSlots = allAppointments
            .filter(app => app.doctorId === doctor.id && app.date === todayString)
            .map(app => app.time);
        
        const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));
        
        return (
            <div key={doctor.id} className="p-4 border-b dark:border-gray-700">
                <h3 className="font-bold text-lg dark:text-gray-200 mb-2">{doctor.name}</h3>
                {availableSlots.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {availableSlots.map(slot => (
                            <button
                                key={slot}
                                onClick={() => onSlotSelect(doctor.id, slot)}
                                className="px-3 py-1.5 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-semibold rounded-md hover:bg-primary-200 dark:hover:bg-primary-900/60 transition-colors text-sm"
                            >
                                {formatTo12Hour(slot)}
                            </button>
                        ))}
                    </div>
                ) : (
                     <p className="text-sm text-gray-500 dark:text-gray-400">لا توجد مواعيد متاحة.</p>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-3xl" role="dialog" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">المواعيد المتاحة لهذا اليوم ({today.toLocaleDateString('ar-EG')})</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" /></button>
                </div>
                <div className="p-2 max-h-[70vh] overflow-y-auto">
                    {loadingSchedules ? (
                        <CenteredLoadingSpinner />
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

type ActiveTab = 'all' | 'today' | 'week' | 'month' | 'finished';

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
    const [activeTab, setActiveTab] = useState<ActiveTab>('today');
    const [isViewingAvailableSlots, setIsViewingAvailableSlots] = useState(false);
    const [initialAppointmentData, setInitialAppointmentData] = useState<Partial<Appointment> | null>(null);


    const fetchData = useCallback(async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const [apps, docs, patsResponse] = await Promise.all([
                api.appointments.getAll(),
                api.doctors.getAll(),
                api.patients.getAll({ page: 1, per_page: 9999 }),
            ]);
            
            setAppointments(apps);
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
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData, refreshTrigger]);

    const handleSlotSelect = (doctorId: string, time: string) => {
        setIsViewingAvailableSlots(false);
        setInitialAppointmentData({ doctorId, time, date: new Date().toISOString().split('T')[0] });
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
            // Error is now handled inside the modal's handleSubmit
            console.error(`Failed to save appointment:`, error);
            throw error; // Re-throw to be caught by the modal
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

    const filteredAppointments = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        
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
                    case 'week':
                        return appDate >= today && appDate <= endOfWeek;
                    case 'month':
                        return appDate >= today && appDate <= endOfMonth;
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
                 <div className="flex items-center gap-2">
                    <button onClick={() => setIsViewingAvailableSlots(true)} className="hidden lg:flex items-center bg-teal-600 text-white px-4 py-2 rounded-lg shadow hover:bg-teal-700 transition-colors">
                        <CalendarIcon className="h-5 w-5 ml-2" />
                        المواعيد المتاحة
                    </button>
                    {(user.role === UserRole.Admin || user.role === UserRole.Secretary) && (
                        <button onClick={() => setIsAddingAppointment(true)} className="hidden lg:flex items-center bg-primary text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700 transition-colors">
                            <PlusIcon className="h-5 w-5 ml-2" />
                            موعد جديد
                        </button>
                    )}
                </div>
            </div>

            <div className="mb-6 flex flex-wrap items-center gap-2">
                <TabButton tab="all" text="كل المواعيد" />
                <TabButton tab="today" text="مواعيد اليوم" />
                <TabButton tab="week" text="هذا الأسبوع" />
                <TabButton tab="month" text="هذا الشهر" />
                <TabButton tab="finished" text="المنتهية" />
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md min-h-[200px]">
                {loading ? <CenteredLoadingSpinner /> : fetchError ? (
                    <div className="text-center py-16 text-red-500 dark:text-red-400"><p>{fetchError}</p></div>
                ) : (
                    filteredAppointments.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredAppointments.map(app => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                const appDate = new Date(app.date);
                                appDate.setMinutes(appDate.getMinutes() + appDate.getTimezoneOffset());
                                appDate.setHours(0, 0, 0, 0);
                                const isFinished = appDate.getTime() < today.getTime();
                                const dayName = DAY_NAMES[appDate.getDay()];

                                return (
                                <div key={app.id} className={`border rounded-xl p-4 flex flex-col transition-shadow hover:shadow-lg ${
                                    isFinished 
                                    ? 'bg-gray-200 dark:bg-slate-900 opacity-75 border-gray-300 dark:border-gray-700' 
                                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                }`}>
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-baseline">
                                            <h3 className={`text-lg font-bold ${isFinished ? 'text-gray-600 dark:text-gray-400' : 'text-primary'}`}>{getPatientName(app.patientId)}</h3>
                                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isFinished ? 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>{`${dayName}, ${appDate.toLocaleDateString('ar-SA')}`}</span>
                                        </div>
                                        <p className={`font-bold text-3xl my-2 ${isFinished ? 'text-gray-700 dark:text-gray-300' : 'text-gray-800 dark:text-gray-100'}`}>{formatTo12Hour(app.time)}</p>
                                        <p className={`text-sm ${isFinished ? 'text-gray-500 dark:text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>مع الطبيب: {getDoctorName(app.doctorId)}</p>
                                        {app.notes && <p className={`mt-2 text-sm p-2 rounded-md ${isFinished ? 'bg-gray-300 dark:bg-gray-800 text-gray-700 dark:text-gray-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>{app.notes}</p>}
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 flex items-center justify-end space-x-2">
                                        <button onClick={() => setViewingAppointment(app)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="عرض التفاصيل"><EyeIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" /></button>
                                        {(user.role === UserRole.Admin || user.role === UserRole.Secretary) && !isFinished && (
                                            <>
                                                <button onClick={() => setEditingAppointment(app)} className="p-2 rounded-full text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40" title="تعديل"><PencilIcon className="h-5 w-5" /></button>
                                                <button onClick={() => setDeletingAppointment(app)} className="p-2 rounded-full text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40" title="حذف"><TrashIcon className="h-5 w-5" /></button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                )
                            })}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-16">لا توجد مواعيد تطابق الفلترة الحالية.</p>
                    )
                )}
            </div>
             <div className="lg:hidden fixed bottom-20 right-4 flex flex-col gap-3 z-20">
                <button 
                    onClick={() => setIsViewingAvailableSlots(true)} 
                    className="bg-teal-600 text-white p-4 rounded-full shadow-lg hover:bg-teal-700 transition-colors"
                    aria-label="المواعيد المتاحة"
                >
                    <CalendarIcon className="h-6 w-6" />
                </button>
                {(user.role === UserRole.Admin || user.role === UserRole.Secretary) && (
                    <button 
                        onClick={() => setIsAddingAppointment(true)} 
                        className="bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary-700 transition-colors"
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
