import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, DaySchedule, Treatment } from '../types';
import { useAuth } from '../hooks/useAuth';
import { ROLE_NAMES, DAY_NAMES } from '../constants';
import { LogoutIcon, PencilIcon, UserCircleIcon, XIcon, PlusIcon, TrashIcon, SearchIcon } from '../components/Icons';
import { api, ApiError } from '../services/api';
import { CenteredLoadingSpinner } from '../components/LoadingSpinner';


// ===================================================================
// DoctorAvailabilitySettings Component
// ===================================================================
interface DoctorAvailabilitySettingsProps {
    user: User;
    refreshTrigger: number;
}

const DoctorAvailabilitySettings: React.FC<DoctorAvailabilitySettingsProps> = ({ user, refreshTrigger }) => {
    const [schedule, setSchedule] = useState<DaySchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [fetchError, setFetchError] = useState<string | null>(null);

    const fetchAvailability = useCallback(async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const data = await api.doctorSchedules.getForDoctor(user.id);
    
            const fullSchedule = DAY_NAMES.map((_, index) => {
                const dayData = data.find(d => d.day === index);
                // FIX: Add doctorId to the fallback object to match the DaySchedule type, which requires it.
                return dayData || {
                    day: index,
                    isWorkDay: false,
                    startTime: '09:00',
                    endTime: '17:00',
                    doctorId: user.id,
                };
            });
    
            setSchedule(fullSchedule);
        } catch (error) {
            if (error instanceof Error && error.message.includes('Failed to fetch')) {
                setFetchError('فشل جلب البيانات الرجاء التأكد من اتصالك بالانترنت واعادة تحميل البيانات');
            } else {
                setFetchError('حدث خطأ غير متوقع.');
                console.error("Could not fetch schedule", error);
            }
        } finally {
            setLoading(false);
        }
    }, [user.id]);

    useEffect(() => {
        fetchAvailability();
    }, [fetchAvailability, refreshTrigger]);

    const handleDayToggle = (dayIndex: number) => {
        setSchedule(prev => prev.map((day, index) =>
            index === dayIndex ? { ...day, isWorkDay: !day.isWorkDay } : day
        ));
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>, dayIndex: number) => {
        const { name, value } = e.target;
        setSchedule(prev => prev.map((day, index) =>
            index === dayIndex ? { ...day, [name]: value } : day
        ));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setFeedback('');
        try {
            await api.doctorSchedules.setForDoctor(user.id, schedule);
            setFeedback('تم تحديث التواجد بنجاح!');
            await fetchAvailability();
            setTimeout(() => setFeedback(''), 3000);
        } catch (error) {
            console.error("Failed to save schedule:", error);
            setFeedback(`فشل تحديث التواجد: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
        } finally {
            setSaving(false);
        }
    };

    const inputStyle = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm text-black dark:text-white";

    return (
        <div className="mt-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">تواجدي</h1>
            <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl shadow-md max-w-3xl mx-auto min-h-[400px]">
                {loading ? <CenteredLoadingSpinner /> : fetchError ? (
                    <div className="text-center py-16 text-red-500 dark:text-red-400"><p>{fetchError}</p></div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            {schedule.map((daySchedule, index) => (
                                <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg transition-all duration-300 has-[:checked]:bg-primary-50 has-[:checked]:border-primary-300 dark:has-[:checked]:bg-primary-900/20 dark:has-[:checked]:border-primary-700">
                                    <div className="flex justify-between items-center">
                                        <label className="flex items-center space-x-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={daySchedule.isWorkDay}
                                                onChange={() => handleDayToggle(index)}
                                                className="h-5 w-5 rounded text-primary focus:ring-primary-500 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 dark:focus:ring-offset-gray-800"
                                            />
                                            <span className="font-semibold text-lg text-gray-800 dark:text-gray-100">{DAY_NAMES[index]}</span>
                                        </label>
                                    </div>
                                    {daySchedule.isWorkDay && (
                                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor={`startTime-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">وقت البدء</label>
                                                <input
                                                    type="time"
                                                    id={`startTime-${index}`}
                                                    name="startTime"
                                                    value={daySchedule.startTime}
                                                    onChange={(e) => handleTimeChange(e, index)}
                                                    className={inputStyle}
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor={`endTime-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">وقت الانتهاء</label>
                                                <input
                                                    type="time"
                                                    id={`endTime-${index}`}
                                                    name="endTime"
                                                    value={daySchedule.endTime}
                                                    onChange={(e) => handleTimeChange(e, index)}
                                                    className={inputStyle}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-8">
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-primary text-white px-4 py-3 rounded-lg shadow-md hover:bg-primary-700 transition-colors disabled:bg-primary-300 font-semibold text-lg"
                            >
                                {saving ? 'جاري الحفظ...' : 'حفظ التواجد'}
                            </button>
                        </div>
                        {feedback && <p className={`mt-4 text-center text-sm ${feedback.includes('فشل') ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{feedback}</p>}
                    </form>
                )}
            </div>
        </div>
    );
};

// ===================================================================
// TreatmentsSettingsSection Component (migrated from TreatmentsPage.tsx)
// ===================================================================
interface ConfirmTreatmentDeleteModalProps {
    onConfirm: () => void;
    onCancel: () => void;
    title: string;
    message: string;
    isDeleting?: boolean;
}

const ConfirmTreatmentDeleteModal: React.FC<ConfirmTreatmentDeleteModalProps> = ({ onConfirm, onCancel, title, message, isDeleting }) => (
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

interface TreatmentFormModalProps {
    treatment?: Treatment;
    onSave: (data: Omit<Treatment, 'id'> | Treatment) => Promise<void>;
    onClose: () => void;
    user: User;
}

const TreatmentFormModal: React.FC<TreatmentFormModalProps> = ({ treatment, onSave, onClose, user }) => {
    const [formData, setFormData] = useState({
        name: treatment?.name || '',
        price: treatment?.price.toString() || '',
        notes: treatment?.notes || '',
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const dataToSave = {
                name: formData.name,
                price: parseFloat(formData.price) || 0,
                notes: formData.notes,
            };
            if (treatment) {
                await onSave({ ...treatment, ...dataToSave });
            } else {
                await onSave(dataToSave);
            }
        } catch (error) {
            alert(`فشل الحفظ: ${error instanceof Error ? error.message : "خطأ غير معروف"}`);
            setIsSaving(false);
        }
    };
    
    const isEditMode = !!treatment;
    const inputStyle = "w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black dark:text-white";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md" role="dialog" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{isEditMode ? 'تعديل العلاج' : 'إضافة علاج جديد'}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم العلاج</label>
                            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className={inputStyle} />
                        </div>
                        {user.role !== UserRole.Doctor && (
                            <div>
                                <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">السعر</label>
                                <input type="number" step="0.01" id="price" name="price" value={formData.price} onChange={handleChange} required className={inputStyle} placeholder="0.00" />
                            </div>
                        )}
                        <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ملاحظات</label>
                            <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} className={inputStyle} placeholder="أضف ملاحظات عامة حول العلاج..."></textarea>
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

const TreatmentsSettingsSection: React.FC<{ user: User, refreshTrigger: number }> = ({ user, refreshTrigger }) => {
    const [treatments, setTreatments] = useState<Treatment[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
    const [deletingTreatment, setDeletingTreatment] = useState<Treatment | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [localRefresh, setLocalRefresh] = useState(0);

    const forceRefresh = () => setLocalRefresh(v => v + 1);

    useEffect(() => {
        const fetchTreatments = async () => {
            setLoading(true);
            setFetchError(null);
            try {
                const data = await api.treatmentSettings.getAll(true);
                setTreatments(data);
            } catch (error) {
                 if (error instanceof Error && error.message.includes('Failed to fetch')) {
                    setFetchError('فشل جلب البيانات الرجاء التأكد من اتصالك بالانترنت واعادة تحميل البيانات');
                } else {
                    setFetchError('حدث خطأ غير متوقع.');
                    console.error("Failed to fetch treatments:", error);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchTreatments();
    }, [refreshTrigger, localRefresh]);

    const handleSave = async (data: Omit<Treatment, 'id'> | Treatment) => {
        try {
            if ('id' in data) {
                await api.treatmentSettings.update(data.id, data);
            } else {
                await api.treatmentSettings.create(data);
            }
            setIsAdding(false);
            setEditingTreatment(null);
            forceRefresh();
        } catch (error) {
            console.error(`Failed to save treatment:`, error);
            throw error;
        }
    };

    const confirmDelete = async () => {
        if (deletingTreatment) {
            setIsDeleting(true);
            try {
                await api.treatmentSettings.delete(deletingTreatment.id);
                setDeletingTreatment(null);
                forceRefresh();
            } catch (error) {
                alert(`فشل حذف العلاج: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
            } finally {
                setIsDeleting(false);
            }
        }
    };
    
    const filteredTreatments = treatments.filter(treatment =>
        treatment.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="mt-8">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">إعدادات العلاج</h1>
                 <div className="relative w-full max-w-sm">
                   <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                       <SearchIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                   </div>
                   <input
                       type="text"
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       placeholder="ابحث عن علاج..."
                       className="w-full pl-3 pr-10 py-2 bg-white dark:bg-gray-700 text-black dark:text-white border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                   />
                </div>
                <button onClick={() => setIsAdding(true)} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700 transition-colors">
                    <PlusIcon className="h-5 w-5 ml-2" />
                    إضافة علاج
                </button>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md min-h-[200px]">
                {loading ? <CenteredLoadingSpinner /> : fetchError ? (
                    <div className="text-center py-16 text-red-500 dark:text-red-400"><p>{fetchError}</p></div>
                ) : (
                     filteredTreatments.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredTreatments.map(t => (
                                <div key={t.id} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col justify-between transition-shadow hover:shadow-lg">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t.name}</h3>
                                            <p className="text-lg font-bold text-green-600 dark:text-green-400">SYP {t.price.toFixed(2)}</p>
                                        </div>
                                        {t.notes && <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 bg-gray-100 dark:bg-gray-700 p-2 rounded-md">{t.notes}</p>}
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 flex items-center justify-end space-x-2">
                                        <button onClick={() => setEditingTreatment(t)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40" title="تعديل">
                                            <PencilIcon className="h-5 w-5" />
                                        </button>
                                        <button onClick={() => setDeletingTreatment(t)} className="text-red-600 dark:text-red-400 hover:text-red-800 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40" title="حذف">
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-8">لم يتم العثور على علاجات.</p>
                    )
                )}
            </div>
            
            {(isAdding || editingTreatment) && (
                <TreatmentFormModal 
                    key={editingTreatment?.id || 'add'}
                    treatment={editingTreatment || undefined}
                    onClose={() => { setIsAdding(false); setEditingTreatment(null); }} 
                    onSave={handleSave}
                    user={user}
                />
            )}
            {deletingTreatment && (
                <ConfirmTreatmentDeleteModal
                    title="حذف العلاج"
                    message={`هل أنت متأكد من رغبتك في حذف ${deletingTreatment.name}؟ لا يمكن التراجع عن هذا الإجراء.`}
                    onConfirm={confirmDelete}
                    onCancel={() => !isDeleting && setDeletingTreatment(null)}
                    isDeleting={isDeleting}
                />
            )}
        </div>
    );
};


// ===================================================================
// ConfirmLogoutModal Component
// ===================================================================
interface ConfirmLogoutModalProps {
    onConfirm: () => void;
    onCancel: () => void;
    isLoggingOut: boolean;
}

const ConfirmLogoutModal: React.FC<ConfirmLogoutModalProps> = ({ onConfirm, onCancel, isLoggingOut }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 transition-opacity" onClick={onCancel}>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm transform transition-all" role="dialog" onClick={e => e.stopPropagation()}>
            <div className="p-6">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                        <LogoutIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-4">تأكيد تسجيل الخروج</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 px-4">هل أنت متأكد أنك تريد تسجيل الخروج؟</p>
                </div>
            </div>
            <div className="bg-gray-50 dark:bg-slate-700/50 px-6 py-4 rounded-b-2xl flex justify-center gap-4">
                <button type="button" onClick={onConfirm} disabled={isLoggingOut} className="w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-400 disabled:cursor-not-allowed">
                    {isLoggingOut ? 'جاري تسجيل الخروج...' : 'نعم، تسجيل الخروج'}
                </button>
                <button type="button" onClick={onCancel} disabled={isLoggingOut} className="w-full rounded-md border border-gray-300 dark:border-gray-500 shadow-sm px-4 py-2 bg-white dark:bg-gray-600 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed">
                    إلغاء
                </button>
            </div>
        </div>
    </div>
);

interface ProfilePageProps {
    refreshTrigger: number;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ refreshTrigger }) => {
    const { logout, setUser, user: currentUser } = useAuth();
    
    if (!currentUser) {
        return <div className="text-center p-8">جاري تحميل الملف الشخصي...</div>;
    }

    const isAdmin = currentUser.role === UserRole.Admin;

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ name: currentUser.name, email: currentUser.email, password: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    useEffect(() => {
        setFormData({ name: currentUser.name, email: currentUser.email, password: '' });
    }, [currentUser]);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        await logout();
    };

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        setError('');
        setSuccess('');
        if (isEditing) {
             setFormData({ name: currentUser.name, email: currentUser.email, password: '' });
        }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');
        setSuccess('');
        try {
            const updates: Partial<User> = { name: formData.name, email: formData.email };
            if (formData.password) {
                updates.password = formData.password;
            }
            const updatedUser = await api.admins.update(currentUser.id, updates);
            if (updatedUser) {
                setUser({ ...currentUser, ...updatedUser });
                setSuccess('تم تحديث البيانات بنجاح!');
                setIsEditing(false);
            } else {
                throw new Error('لم يتم إرجاع بيانات المستخدم المحدثة.');
            }
        } catch (err) {
            if (err instanceof ApiError && err.errors) {
                const errorMessages = Object.values(err.errors).flat().join(', ');
                setError(errorMessages || 'خطأ في التحقق من البيانات.');
            } else if (err instanceof Error){
                setError(`فشل التحديث: ${err.message}`);
            } else {
                setError('حدث خطأ غير متوقع.');
            }
        } finally {
            setIsSaving(false);
        }
    };
    
    const inputStyle = "w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black dark:text-white";

    return (
        <>
            <div className="max-w-4xl mx-auto">
                <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl overflow-hidden">
                    <div className="p-8">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="flex-shrink-0">
                                <UserCircleIcon className="h-24 w-24 text-gray-300 dark:text-gray-600"/>
                            </div>
                            <div className="flex-grow text-center md:text-right">
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{currentUser.name}</h2>
                                <p className="text-md text-gray-500 dark:text-gray-400">{currentUser.email}</p>
                                <span className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300">
                                    {ROLE_NAMES[currentUser.role]}
                                </span>
                            </div>
                            {isAdmin && !isEditing && (
                                <button onClick={handleEditToggle} className="flex items-center gap-2 px-4 py-2 font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-slate-700 rounded-lg shadow-sm hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                                    <PencilIcon className="h-5 w-5" />
                                    <span>تعديل</span>
                                </button>
                            )}
                        </div>

                        {error && <div className="mt-6 p-3 text-sm text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-300 rounded-lg text-center" role="alert">{error}</div>}
                        {success && <div className="mt-6 p-3 text-sm text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-300 rounded-lg text-center" role="alert">{success}</div>}

                        {isEditing && isAdmin ? (
                            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">الاسم الكامل</label>
                                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className={inputStyle} />
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">البريد الإلكتروني</label>
                                        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className={inputStyle} />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">كلمة المرور الجديدة (اتركها فارغة لعدم التغيير)</label>
                                    <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} className={inputStyle} placeholder="••••••••" />
                                </div>
                                <div className="flex justify-end gap-4">
                                    <button type="button" onClick={handleEditToggle} className="px-6 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500">
                                        إلغاء
                                    </button>
                                    <button type="submit" disabled={isSaving} className="px-6 py-2 bg-primary border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-700 disabled:bg-primary-300">
                                        {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6 text-center">
                                 <button onClick={() => setIsLogoutModalOpen(true)} className="inline-flex items-center gap-2 px-6 py-3 font-semibold text-white bg-red-600 rounded-lg shadow-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                                    <LogoutIcon className="h-5 w-5" />
                                    <span>تسجيل الخروج</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {currentUser && (currentUser.role === UserRole.Admin || currentUser.role === UserRole.SubManager) && (
                <TreatmentsSettingsSection user={currentUser} refreshTrigger={refreshTrigger} />
            )}

            {currentUser && currentUser.role === UserRole.Doctor && (
                <DoctorAvailabilitySettings user={currentUser} refreshTrigger={refreshTrigger} />
            )}

            {isLogoutModalOpen && (
                <ConfirmLogoutModal
                    onConfirm={handleLogout}
                    onCancel={() => !isLoggingOut && setIsLogoutModalOpen(false)}
                    isLoggingOut={isLoggingOut}
                />
            )}
        </>
    );
};

export default ProfilePage;