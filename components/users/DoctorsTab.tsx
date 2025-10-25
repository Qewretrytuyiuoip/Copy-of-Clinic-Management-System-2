import React, { useEffect, useState, useCallback } from 'react';
import { User, UserRole, Patient, Session, SessionTreatment, Treatment } from '../../types';
import { api } from '../../services/api';
import { PlusIcon, PencilIcon, TrashIcon, XIcon, ClipboardListIcon, BeakerIcon, ArrowBackIcon, EyeIcon, CheckIcon, UserGroupIcon } from '../../components/Icons';
import { CenteredLoadingSpinner } from '../../components/LoadingSpinner';
import LoadingSpinner from '../../components/LoadingSpinner';


// ===================================================================
// Re-usable Modals and Sub-Pages (Copied from PatientsPage for encapsulation)
// ===================================================================

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
// AddDoctorModal Component
// ===================================================================
interface AddDoctorModalProps {
    onSave: (newUser: Omit<User, 'id' | 'role'>) => Promise<void>;
    onClose: () => void;
}

const AddDoctorModal: React.FC<AddDoctorModalProps> = ({ onSave, onClose }) => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', specialty: '', is_diagnosis_doctor: false });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.password) {
            alert('كلمة المرور مطلوبة للطبيب الجديد.');
            return;
        }
        setIsSaving(true);
        await onSave(formData);
        setIsSaving(false);
    };
    
    const inputStyle = "w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black dark:text-white";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md" role="dialog" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">إضافة طبيب جديد</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="nameAdd" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاسم</label>
                            <input type="text" id="nameAdd" name="name" value={formData.name} onChange={handleChange} required className={inputStyle} />
                        </div>
                         <div>
                            <label htmlFor="specialtyAdd" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">التخصص</label>
                            <input type="text" id="specialtyAdd" name="specialty" value={formData.specialty} onChange={handleChange} required className={inputStyle} />
                        </div>
                        <div>
                            <label htmlFor="emailAdd" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">البريد الإلكتروني</label>
                            <input type="email" id="emailAdd" name="email" value={formData.email} onChange={handleChange} required className={inputStyle} />
                        </div>
                        <div>
                            <label htmlFor="passwordAdd" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">كلمة المرور</label>
                            <input type="password" id="passwordAdd" name="password" value={formData.password} onChange={handleChange} required className={inputStyle} />
                        </div>
                        <div>
                            <label className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="is_diagnosis_doctor"
                                    checked={formData.is_diagnosis_doctor}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-primary rounded border-gray-300 dark:border-gray-500 focus:ring-primary"
                                />
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">طبيب تشخيص</span>
                            </label>
                        </div>
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
// EditDoctorModal Component
// ===================================================================
interface EditDoctorModalProps {
    doctor: User;
    onSave: (updatedDoctor: User) => Promise<void>;
    onClose: () => void;
}

const EditDoctorModal: React.FC<EditDoctorModalProps> = ({ doctor, onSave, onClose }) => {
    const [formData, setFormData] = useState({ name: doctor.name, email: doctor.email, password: '', specialty: doctor.specialty || '', is_diagnosis_doctor: doctor.is_diagnosis_doctor || false });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const updates: Partial<User> = { name: formData.name, email: formData.email, specialty: formData.specialty, is_diagnosis_doctor: formData.is_diagnosis_doctor };
        if (formData.password) {
            updates.password = formData.password;
        }
        await onSave({ ...doctor, ...updates });
        setIsSaving(false);
    };
    
    const inputStyle = "w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black dark:text-white";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md" role="dialog" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">تعديل بيانات الطبيب</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div><label htmlFor="nameEdit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاسم</label><input type="text" id="nameEdit" name="name" value={formData.name} onChange={handleChange} required className={inputStyle} /></div>
                        <div><label htmlFor="specialtyEdit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">التخصص</label><input type="text" id="specialtyEdit" name="specialty" value={formData.specialty} onChange={handleChange} required className={inputStyle} /></div>
                        <div><label htmlFor="emailEdit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">البريد الإلكتروني</label><input type="email" id="emailEdit" name="email" value={formData.email} onChange={handleChange} required className={inputStyle} /></div>
                        <div><label htmlFor="passwordEdit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">كلمة المرور (اتركها فارغة لعدم التغيير)</label><input type="password" id="passwordEdit" name="password" value={formData.password} onChange={handleChange} className={inputStyle} /></div>
                        <div>
                            <label className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="is_diagnosis_doctor"
                                    checked={formData.is_diagnosis_doctor}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-primary rounded border-gray-300 dark:border-gray-500 focus:ring-primary"
                                />
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">طبيب تشخيص</span>
                            </label>
                        </div>
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

const DoctorsTab: React.FC = () => {
    const [doctors, setDoctors] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddingDoctor, setIsAddingDoctor] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState<User | null>(null);
    const [deletingDoctor, setDeletingDoctor] = useState<User | null>(null);

    const fetchDoctors = useCallback(async () => {
        setLoading(true);
        const allUsers = await api.doctors.getAll();
        setDoctors(allUsers);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchDoctors();
    }, [fetchDoctors]);

    const handleCreateDoctor = async (newDoctorData: Omit<User, 'id' | 'role'>) => {
        await api.doctors.create({ ...newDoctorData, role: UserRole.Doctor });
        setIsAddingDoctor(false);
        await fetchDoctors();
    };
    
    const handleUpdateDoctor = async (updatedDoctor: User) => {
        await api.doctors.update(updatedDoctor.id, updatedDoctor);
        setEditingDoctor(null);
        await fetchDoctors();
    };

    const confirmDeleteDoctor = async () => {
        if (deletingDoctor) {
            await api.doctors.delete(deletingDoctor.id);
            setDeletingDoctor(null);
            await fetchDoctors();
        }
    };
    
    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">قائمة الأطباء</h2>
                <button onClick={() => setIsAddingDoctor(true)} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700 transition-colors">
                    <PlusIcon className="h-5 w-5 ml-2" />
                    إضافة طبيب
                </button>
            </div>
            
            <div className="min-h-[200px]">
                {loading ? <CenteredLoadingSpinner /> : (
                     doctors.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {doctors.map(doc => (
                                <div key={doc.id} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col justify-between transition-shadow hover:shadow-lg">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{doc.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-primary dark:text-primary-300 font-semibold">{doc.specialty}</p>
                                            {doc.is_diagnosis_doctor && (
                                                <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300 text-xs font-bold rounded-full">
                                                    طبيب تشخيص
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm">{doc.email}</p>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
                                        <button onClick={() => setEditingDoctor(doc)} className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 text-sm">
                                            <PencilIcon className="h-4 w-4" />
                                            <span className="mr-1">تعديل</span>
                                        </button>
                                        <button onClick={() => setDeletingDoctor(doc)} className="flex items-center text-red-600 dark:text-red-400 hover:text-red-800 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/40 text-sm">
                                            <TrashIcon className="h-4 w-4" />
                                            <span className="mr-1">حذف</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <p className="text-center text-gray-500 dark:text-gray-400 py-8">لم يتم العثور على أطباء.</p>
                    )
                )}
            </div>
            {isAddingDoctor && <AddDoctorModal onClose={() => setIsAddingDoctor(false)} onSave={handleCreateDoctor} />}
            {editingDoctor && <EditDoctorModal doctor={editingDoctor} onClose={() => setEditingDoctor(null)} onSave={handleUpdateDoctor} />}
            {deletingDoctor && (
                <ConfirmDeleteModal
                    title="حذف طبيب"
                    message={`هل أنت متأكد من رغبتك في حذف ${deletingDoctor.name}؟ لا يمكن التراجع عن هذا الإجراء.`}
                    onConfirm={confirmDeleteDoctor}
                    onCancel={() => setDeletingDoctor(null)}
                />
            )}
        </div>
    );
};

export default DoctorsTab;