
import React, { useEffect, useState, useCallback } from 'react';
// FIX: Added 'Gender' to the import list to be used when creating a new patient.
import { User, Appointment, Patient, UserRole, Gender } from '../types';
import { api } from '../services/api';
import { PlusIcon, PencilIcon, TrashIcon, XIcon, EyeIcon, SearchIcon, CalendarIcon, ClockIcon } from '../components/Icons';
import { CenteredLoadingSpinner } from '../components/LoadingSpinner';

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
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm transform transition-all" role="dialog" onClick={e => e.stopPropagation()}>
            <div className="p-6">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                        <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mt-4">{title}</h3>
                    <p className="text-sm text-gray-500 mt-2 px-4">{message}</p>
                </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-center gap-4">
                <button type="button" onClick={onConfirm} className="w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                    نعم، قم بالحذف
                </button>
                <button type="button" onClick={onCancel} className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
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
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md" role="dialog" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800">تفاصيل الموعد</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div><p className="text-sm font-medium text-gray-500">المريض</p><p className="text-lg font-semibold text-gray-900">{patientName}</p></div>
                    <div><p className="text-sm font-medium text-gray-500">الطبيب</p><p className="text-lg font-semibold text-gray-900">{doctorName}</p></div>
                    <div><p className="text-sm font-medium text-gray-500">التاريخ</p><p className="text-lg font-semibold text-gray-900">{new Date(appointment.date).toLocaleDateString()}</p></div>
                    <div><p className="text-sm font-medium text-gray-500">الوقت</p><p className="text-lg font-semibold text-gray-900">{appointment.time}</p></div>
                    {appointment.notes && (<div><p className="text-sm font-medium text-gray-500">ملاحظات</p><p className="text-md text-gray-700 bg-gray-100 p-2 rounded-md">{appointment.notes}</p></div>)}
                </div>
                <div className="flex justify-end p-4 bg-gray-50 border-t"><button onClick={onClose} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-700">إغلاق</button></div>
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
    onSave: (data: Omit<Appointment, 'id'> | Appointment) => Promise<void>;
    onClose: () => void;
}

const AppointmentFormModal: React.FC<AppointmentFormModalProps> = ({ appointment, patients, doctors, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        patientId: appointment?.patientId || '',
        doctorId: appointment?.doctorId || '',
        date: appointment ? new Date(appointment.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        time: appointment?.time || '',
        notes: appointment?.notes || '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isNewPatient, setIsNewPatient] = useState(false);
    const [newPatientData, setNewPatientData] = useState({ name: '', phone: '' });


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleNewPatientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewPatientData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        let patientIdForAppointment = formData.patientId;
    
        if (isNewPatient) {
            if (!newPatientData.name || !newPatientData.phone || !formData.doctorId) {
                alert('يرجى ملء اسم المريض الجديد ورقم هاتفه واختيار طبيب.');
                setIsSaving(false);
                return;
            }
            try {
                const newPatient = await api.patients.create({
                    name: newPatientData.name,
                    phone: newPatientData.phone,
                    doctorId: formData.doctorId,
                    age: 0, 
                    notes: 'مريض جديد تم إنشاؤه من صفحة المواعيد',
                    // FIX: Added the missing 'gender' property to satisfy the 'Patient' type.
                    gender: Gender.Male,
                });
                patientIdForAppointment = newPatient.id;
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
    
        const appointmentData = {
            ...formData,
            patientId: patientIdForAppointment,
        };
    
        const dataToSave = appointment ? { ...appointment, ...appointmentData } : appointmentData;
        await onSave(dataToSave);
        setIsSaving(false);
    };

    const isEditMode = !!appointment;
    const inputStyle = "w-full px-3 py-2 bg-white border border-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black";


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" role="dialog" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800">{isEditMode ? 'تعديل الموعد' : 'إضافة موعد جديد'}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <div className="flex items-center mb-2">
                                <input 
                                    type="checkbox" 
                                    id="isNewPatient" 
                                    checked={isNewPatient} 
                                    onChange={(e) => {
                                        setIsNewPatient(e.target.checked);
                                        setFormData(prev => ({ ...prev, patientId: '' }));
                                    }}
                                    className="h-4 w-4 text-primary rounded focus:ring-primary border-gray-300"
                                />
                                <label htmlFor="isNewPatient" className="mr-2 text-sm font-medium text-gray-700">إضافة موعد لمريض جديد</label>
                            </div>
                            {isNewPatient ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md bg-gray-50">
                                    <div>
                                        <label htmlFor="newPatientName" className="block text-sm font-medium text-gray-700 mb-1">اسم المريض الجديد</label>
                                        <input type="text" id="newPatientName" name="name" value={newPatientData.name} onChange={handleNewPatientChange} required className={inputStyle} placeholder="الاسم الكامل" />
                                    </div>
                                    <div>
                                        <label htmlFor="newPatientPhone" className="block text-sm font-medium text-gray-700 mb-1">هاتف المريض الجديد</label>
                                        <input type="tel" id="newPatientPhone" name="phone" value={newPatientData.phone} onChange={handleNewPatientChange} required className={inputStyle} placeholder="رقم الهاتف" />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 mb-1">المريض</label>
                                    <select id="patientId" name="patientId" value={formData.patientId} onChange={handleChange} required className={inputStyle}>
                                        <option value="">اختر مريض...</option>
                                        {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                        <div>
                            <label htmlFor="doctorId" className="block text-sm font-medium text-gray-700 mb-1">الطبيب</label>
                            <select id="doctorId" name="doctorId" value={formData.doctorId} onChange={handleChange} required className={inputStyle}>
                                <option value="">اختر طبيب...</option>
                                {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div></div> {/* Empty div for alignment */}
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
                            <div className="relative">
                                <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required className={`${inputStyle} pr-10`} />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <CalendarIcon className="h-5 w-5 text-black" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">الوقت</label>
                            <div className="relative">
                                <input type="time" id="time" name="time" value={formData.time} onChange={handleChange} required className={`${inputStyle} pr-10`} />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <ClockIcon className="h-5 w-5 text-black" />
                                </div>
                            </div>
                        </div>
                        <div className="md:col-span-2"><label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label><textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} className={inputStyle}></textarea></div>
                    </div>
                    <div className="flex justify-end items-center p-4 bg-gray-50 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">إلغاء</button>
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


    const fetchData = useCallback(async () => {
        setLoading(true);
        const [apps, pats, docs] = await Promise.all([
            api.appointments.getAll(),
            api.patients.getAll(),
            api.doctors.getAll(),
        ]);
        setAppointments(apps);
        setPatients(pats);
        setDoctors(docs);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveAppointment = async (data: Omit<Appointment, 'id'> | Appointment) => {
        if ('id' in data) {
            await api.appointments.update(data.id, data);
        } else {
            await api.appointments.create(data);
        }
        setIsAddingAppointment(false);
        setEditingAppointment(null);
        await fetchData();
    };

    const confirmDeleteAppointment = async () => {
        if (deletingAppointment) {
            await api.appointments.delete(deletingAppointment.id);
            setDeletingAppointment(null);
            await fetchData();
        }
    };

    const getPatientName = (id: string) => patients.find(p => p.id === id)?.name || 'مريض غير معروف';
    const getDoctorName = (id: string) => doctors.find(d => d.id === id)?.name || 'طبيب غير معروف';

    const filteredAppointments = appointments.filter(app =>
        getPatientName(app.patientId).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getDoctorName(app.doctorId).toLowerCase().includes(searchTerm.toLowerCase())
    );


    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">المواعيد</h1>
                <div className="relative w-full max-w-sm">
                   <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                       <SearchIcon className="w-5 h-5 text-gray-400" />
                   </div>
                   <input
                       type="text"
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       placeholder="ابحث عن مريض أو طبيب..."
                       className="w-full pl-3 pr-10 py-2 bg-white border border-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black"
                   />
                </div>
                {(user.role === UserRole.Admin || user.role === UserRole.Secretary) && (
                    <button onClick={() => setIsAddingAppointment(true)} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700 transition-colors">
                        <PlusIcon className="h-5 w-5 ml-2" />
                        موعد جديد
                    </button>
                )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md min-h-[200px]">
                {loading ? <CenteredLoadingSpinner /> : (
                    filteredAppointments.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredAppointments.map(app => (
                                <div key={app.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col transition-shadow hover:shadow-lg">
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-baseline">
                                            <h3 className="text-lg font-bold text-primary">{getPatientName(app.patientId)}</h3>
                                            <span className="text-xs font-semibold text-gray-600 bg-gray-200 px-2 py-1 rounded-full">{new Date(app.date).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-gray-800 font-bold text-3xl my-2">{app.time}</p>
                                        <p className="text-gray-500 text-sm">مع الطبيب: {getDoctorName(app.doctorId)}</p>
                                        {app.notes && <p className="mt-2 text-sm text-gray-700 bg-gray-100 p-2 rounded-md">ملاحظات: {app.notes}</p>}
                                    </div>
                                     <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-end space-x-2">
                                        <button onClick={() => setViewingAppointment(app)} className="flex items-center text-gray-600 hover:text-gray-800 transition-colors text-sm p-1 rounded hover:bg-gray-200" title="عرض">
                                            <EyeIcon className="h-4 w-4" />
                                            <span className="mr-1">عرض</span>
                                        </button>
                                        <button onClick={() => setEditingAppointment(app)} className="flex items-center text-blue-600 hover:text-blue-800 transition-colors text-sm p-1 rounded hover:bg-blue-100" title="تعديل">
                                            <PencilIcon className="h-4 w-4" />
                                            <span className="mr-1">تعديل</span>
                                        </button>
                                        <button onClick={() => setDeletingAppointment(app)} className="flex items-center text-red-600 hover:text-red-800 transition-colors text-sm p-1 rounded hover:bg-red-100" title="إلغاء">
                                            <TrashIcon className="h-4 w-4" />
                                            <span className="mr-1">إلغاء</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <p className="text-center text-gray-500 py-8">لم يتم العثور على مواعيد.</p>
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