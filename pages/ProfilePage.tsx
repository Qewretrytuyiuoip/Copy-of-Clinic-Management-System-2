
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, DaySchedule, Treatment } from '../types';
import { useAuth } from '../hooks/useAuth';
import { ROLE_NAMES, DAY_NAMES } from '../constants';
import { LogoutIcon, PencilIcon, UserCircleIcon, XIcon, PlusIcon, TrashIcon, SearchIcon, ArrowDownOnSquareIcon } from '../components/Icons';
import { api, ApiError, performApiFetch } from '../services/api';
import { CenteredLoadingSpinner } from '../components/LoadingSpinner';
import LoadingSpinner from '../components/LoadingSpinner';

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
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 border-b pb-2 dark:border-gray-700">أوقات الدوام</h2>
             {fetchError ? (
                 <div className="text-center py-8 text-red-500 dark:text-red-400"><p>{fetchError}</p></div>
            ) : loading ? <CenteredLoadingSpinner /> : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {schedule.map((day, index) => (
                        <div key={index} className="flex items-center space-x-4 rtl:space-x-reverse bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center h-5">
                                <input
                                    id={`day-${index}`}
                                    type="checkbox"
                                    checked={day.isWorkDay}
                                    onChange={() => handleDayToggle(index)}
                                    className="focus:ring-primary h-5 w-5 text-primary border-gray-300 rounded"
                                />
                            </div>
                            <label htmlFor={`day-${index}`} className="w-24 font-medium text-gray-700 dark:text-gray-300 select-none">
                                {DAY_NAMES[index]}
                            </label>
                            {day.isWorkDay && (
                                <div className="flex items-center gap-2 flex-grow">
                                    <input
                                        type="time"
                                        name="startTime"
                                        value={day.startTime}
                                        onChange={(e) => handleTimeChange(e, index)}
                                        className={`${inputStyle} w-auto`}
                                    />
                                    <span className="text-gray-500 dark:text-gray-400">إلى</span>
                                    <input
                                        type="time"
                                        name="endTime"
                                        value={day.endTime}
                                        onChange={(e) => handleTimeChange(e, index)}
                                        className={`${inputStyle} w-auto`}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                    
                    {feedback && (
                        <div className={`p-3 rounded-md ${feedback.includes('فشل') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {feedback}
                        </div>
                    )}
                    
                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-primary-300"
                        >
                            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

// ===================================================================
// TreatmentsSettings Component (Admin/SubManager)
// ===================================================================
const TreatmentsSettings: React.FC = () => {
    const [treatments, setTreatments] = useState<Treatment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newTreatment, setNewTreatment] = useState({ name: '', price: '', notes: '' });
    
    // Editing state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState({ name: '', price: '', notes: '' });
    
    const [isSaving, setIsSaving] = useState(false);

    const fetchTreatments = async () => {
        setLoading(true);
        try {
            const data = await api.treatmentSettings.getAll(true);
            setTreatments(data);
        } catch (error) {
            console.error("Failed to fetch treatments", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTreatments();
    }, []);

    const handleDelete = async (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا العلاج؟')) {
            try {
                await api.treatmentSettings.delete(id);
                fetchTreatments();
            } catch (e) {
                alert('فشل الحذف');
            }
        }
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTreatment.name || !newTreatment.price) return;
        setIsSaving(true);
        try {
            await api.treatmentSettings.create({
                name: newTreatment.name,
                price: parseFloat(newTreatment.price),
                notes: newTreatment.notes
            });
            setNewTreatment({ name: '', price: '', notes: '' });
            setIsAdding(false);
            fetchTreatments();
        } catch (e) {
            alert('فشل الإضافة');
        } finally {
            setIsSaving(false);
        }
    };

    // Edit Handlers
    const handleEditClick = (t: Treatment) => {
        setEditingId(t.id);
        setEditData({ name: t.name, price: t.price.toString(), notes: t.notes || '' });
    };

    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingId) return;
        setIsSaving(true);
        try {
            await api.treatmentSettings.update(editingId, {
                name: editData.name,
                price: parseFloat(editData.price),
                notes: editData.notes
            });
            setEditingId(null);
            fetchTreatments();
        } catch (e) {
            alert('فشل التعديل');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
    };

    const inputStyle = "w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black dark:text-white";

    return (
        <div className="mt-8">
             <div className="flex justify-between items-center mb-4 border-b pb-2 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">إعدادات أسعار العلاج</h2>
                <button onClick={() => setIsAdding(true)} className="flex items-center text-sm bg-primary text-white px-3 py-1.5 rounded-md hover:bg-primary-700">
                    <PlusIcon className="h-4 w-4 ml-1" /> إضافة علاج
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleAddSubmit} className="mb-6 bg-white dark:bg-slate-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input type="text" placeholder="اسم العلاج" value={newTreatment.name} onChange={e => setNewTreatment({...newTreatment, name: e.target.value})} className={inputStyle} required />
                        <input type="number" placeholder="السعر" value={newTreatment.price} onChange={e => setNewTreatment({...newTreatment, price: e.target.value})} className={inputStyle} required />
                        <input type="text" placeholder="ملاحظات (اختياري)" value={newTreatment.notes} onChange={e => setNewTreatment({...newTreatment, notes: e.target.value})} className={inputStyle} />
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                        <button type="button" onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-slate-700 rounded hover:bg-gray-300 dark:hover:bg-slate-600">إلغاء</button>
                        <button type="submit" disabled={isSaving} className="px-3 py-1.5 text-white bg-green-600 rounded hover:bg-green-700 disabled:bg-green-400">{isSaving ? 'جاري الحفظ...' : 'حفظ'}</button>
                    </div>
                </form>
            )}

            {loading ? <CenteredLoadingSpinner /> : (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden border dark:border-gray-700">
                    {treatments.length > 0 ? (
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {treatments.map(t => (
                                <li key={t.id} className="p-4 transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                    {editingId === t.id ? (
                                        <form onSubmit={handleUpdateSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center w-full">
                                            <input type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} className={inputStyle} required />
                                            <input type="number" value={editData.price} onChange={e => setEditData({...editData, price: e.target.value})} className={inputStyle} required />
                                            <input type="text" value={editData.notes} onChange={e => setEditData({...editData, notes: e.target.value})} className={inputStyle} />
                                            <div className="flex gap-2 justify-end">
                                                <button type="button" onClick={handleCancelEdit} className="px-2 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-slate-500">إلغاء</button>
                                                <button type="submit" disabled={isSaving} className="px-2 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">{isSaving ? 'حفظ...' : 'حفظ'}</button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="flex justify-between items-center w-full">
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-gray-100">{t.name}</p>
                                                {t.notes && <p className="text-xs text-gray-500 dark:text-gray-400">{t.notes}</p>}
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="font-semibold text-green-600 dark:text-green-400">
                                                    {t.price.toLocaleString('en-US')} SYP
                                                </span>
                                                <div className="flex gap-1">
                                                    <button onClick={() => handleEditClick(t)} className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/20" title="تعديل">
                                                        <PencilIcon className="h-5 w-5" />
                                                    </button>
                                                    <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20" title="حذف">
                                                        <TrashIcon className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : <p className="p-4 text-center text-gray-500">لا توجد علاجات مضافة.</p>}
                </div>
            )}
        </div>
    );
};


// ===================================================================
// EditProfileModal Component
// ===================================================================
interface EditProfileModalProps {
    user: User;
    onClose: () => void;
    onSave: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: user.name,
        email: user.email,
        password: '',
        specialty: user.specialty || '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const isDoctor = user.role === UserRole.Doctor;
    const inputStyle = "w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black dark:text-white";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const updates: any = {
                name: formData.name,
                email: formData.email,
            };
            if (formData.password) updates.password = formData.password;
            if (isDoctor) updates.specialty = formData.specialty;

            await performApiFetch('profile/update', {
                method: 'POST',
                body: JSON.stringify(updates),
                headers: { 'Content-Type': 'application/json' }
            });
            
            // Update local storage user
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const updatedUser = { ...currentUser, ...updates };
            delete updatedUser.password; 
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));

            onSave();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'فشل تحديث الملف الشخصي');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">تعديل الملف الشخصي</h3>
                    <button onClick={onClose}><XIcon className="h-6 w-6 text-gray-500" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">الاسم</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputStyle} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">البريد الإلكتروني</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputStyle} required />
                    </div>
                    {isDoctor && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">التخصص</label>
                            <input type="text" name="specialty" value={formData.specialty} onChange={handleChange} className={inputStyle} />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">كلمة المرور الجديدة (اختياري)</label>
                        <input type="password" name="password" value={formData.password} onChange={handleChange} className={inputStyle} placeholder="اتركها فارغة لعدم التغيير" />
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="submit" disabled={isLoading} className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:bg-primary-300">
                            {isLoading ? 'جاري الحفظ...' : 'حفظ'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ===================================================================
// ProfilePage Main Component
// ===================================================================
interface ProfilePageProps {
    refreshTrigger: number;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ refreshTrigger }) => {
    const { user, logout, setUser } = useAuth();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
    const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);

    const handleExportData = async () => {
        setIsExporting(true);
        try {
            await api.exportCenterData();
        } catch (err) {
            alert('فشل تصدير البيانات.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleDeleteAccountClick = () => {
        setIsDeleteAccountModalOpen(true);
    };

    const handleExportAndDelete = async () => {
        setIsDeletingAccount(true);
        try {
            // 1. Export Data first
            await api.exportCenterData();
            
            // Wait a moment to ensure download starts
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 2. Perform server deletion
            await api.profile.delete();
            
            // 3. Logout user
            await logout();
            
        } catch (error) {
            console.error("Delete account failed:", error);
            alert('حدث خطأ أثناء محاولة حذف الحساب. يرجى المحاولة مرة أخرى أو التواصل مع الدعم.');
        } finally {
            setIsDeletingAccount(false);
            setIsDeleteAccountModalOpen(false);
        }
    };
    
    const refreshUser = () => {
         const storedUser = localStorage.getItem('currentUser');
         if(storedUser) {
             setUser(JSON.parse(storedUser));
         }
    }

    const handleLogoutClick = () => {
        setIsLogoutConfirmOpen(true);
    };

    const confirmLogout = async () => {
        await logout();
        setIsLogoutConfirmOpen(false);
    };

    if (!user) return null;

    const isManager = user.role === UserRole.Admin || user.role === UserRole.SubManager;
    const isDoctor = user.role === UserRole.Doctor;

    return (
        <div className="max-w-4xl mx-auto p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden relative">
                <div className="h-32 bg-gradient-to-r from-primary-500 to-primary-700"></div>
                <div className="px-6 pb-6">
                    <div className="relative flex justify-between items-end -mt-12 mb-6">
                        <div className="flex items-end">
                            <div className="h-24 w-24 rounded-full ring-4 ring-white dark:ring-slate-800 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                                <UserCircleIcon className="h-20 w-20" />
                            </div>
                            <div className="mr-4 rtl:mr-4 rtl:ml-0 mb-1">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-300">{user.email}</p>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300 mt-1">
                                    {ROLE_NAMES[user.role]}
                                </span>
                            </div>
                        </div>
                    </div>

                     {/* Edit Button - Absolute Top Right */}
                     <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="absolute top-4 right-4 p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors shadow-sm z-10"
                        title="تعديل الملف الشخصي"
                    >
                        <PencilIcon className="h-5 w-5" />
                    </button>
                    
                    {/* Action Buttons - Centered */}
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-6 pt-6 border-t dark:border-gray-700">
                         {isManager && (
                            <button
                                onClick={handleExportData}
                                disabled={isExporting}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition-transform active:scale-95 disabled:bg-blue-400"
                            >
                                {isExporting ? <LoadingSpinner className="h-5 w-5" /> : <ArrowDownOnSquareIcon className="h-5 w-5" />}
                                <span className="font-semibold">تصدير البيانات</span>
                            </button>
                        )}
                        
                        <button
                            onClick={handleDeleteAccountClick}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-red-100 text-red-600 rounded-xl shadow hover:bg-red-200 transition-transform active:scale-95"
                        >
                            <TrashIcon className="h-5 w-5" />
                            <span className="font-semibold">حذف الحساب</span>
                        </button>
                        
                        <button
                            onClick={handleLogoutClick}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl shadow hover:bg-gray-300 dark:hover:bg-gray-600 transition-transform active:scale-95"
                        >
                            <LogoutIcon className="h-5 w-5" />
                            <span className="font-semibold">تسجيل الخروج</span>
                        </button>
                    </div>
                </div>
            </div>

            {isDoctor && <DoctorAvailabilitySettings user={user} refreshTrigger={refreshTrigger} />}
            {isManager && <TreatmentsSettings />}

            {isEditModalOpen && (
                <EditProfileModal
                    user={user}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={refreshUser}
                />
            )}

            {isLogoutConfirmOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 transition-opacity" onClick={() => setIsLogoutConfirmOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm transform transition-all" role="dialog" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <div className="text-center">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                                    <LogoutIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" aria-hidden="true" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-4">تسجيل الخروج</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 px-4">هل أنت متأكد من رغبتك في تسجيل الخروج؟</p>
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-slate-700/50 px-6 py-4 rounded-b-2xl flex justify-center gap-4">
                            <button type="button" onClick={confirmLogout} className="w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                                نعم
                            </button>
                            <button type="button" onClick={() => setIsLogoutConfirmOpen(false)} className="w-full rounded-md border border-gray-300 dark:border-gray-500 shadow-sm px-4 py-2 bg-white dark:bg-gray-600 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                                لا
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isDeleteAccountModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity" onClick={() => setIsDeleteAccountModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md transform transition-all" role="dialog" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <div className="text-center">
                                <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                                    <TrashIcon className="h-8 w-8 text-red-600 dark:text-red-400" aria-hidden="true" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">حذف الحساب</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 px-2 leading-relaxed">
                                    تحذير: سيتم حذف الحساب والاشتراك بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    سيتم تحميل نسخة احتياطية من بياناتك تلقائياً قبل الحذف.
                                </p>
                            </div>
                            
                            <div className="mt-8 space-y-3 flex flex-col">
                                <button
                                    type="button"
                                    onClick={handleExportAndDelete}
                                    disabled={isDeletingAccount}
                                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-transparent shadow-sm px-4 py-3 bg-red-600 text-white font-semibold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isDeletingAccount ? <LoadingSpinner className="h-5 w-5" /> : <ArrowDownOnSquareIcon className="h-5 w-5" />}
                                    <span>تصدير البيانات وحذف الحساب</span>
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={() => setIsDeleteAccountModalOpen(false)}
                                    disabled={isDeletingAccount}
                                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-3 bg-transparent text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                                >
                                    الغاء
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
