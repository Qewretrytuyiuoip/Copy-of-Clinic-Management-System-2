
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

    const inputStyle = "block w-full px-3 py-2 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-gray-200 dark:border-gray-600 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm text-black dark:text-white transition-all";

    return (
        <div className="mt-8 relative">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 border-b pb-2 dark:border-gray-700/50">أوقات الدوام</h2>
             {fetchError ? (
                 <div className="text-center py-8 text-red-500 dark:text-red-400 bg-white/20 rounded-xl"><p>{fetchError}</p></div>
            ) : loading ? <CenteredLoadingSpinner /> : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {schedule.map((day, index) => (
                            <div 
                                key={index} 
                                className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between group relative overflow-hidden ${
                                    day.isWorkDay 
                                    ? 'bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border-primary-200/50 dark:border-primary-900/50 shadow-lg hover:shadow-primary/20' 
                                    : 'bg-gray-100/40 dark:bg-slate-800/30 backdrop-blur-sm border-transparent opacity-70 grayscale'
                                }`}
                            >
                                {day.isWorkDay && <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>}
                                
                                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200/50 dark:border-gray-700/50 relative z-10">
                                    <label htmlFor={`day-${index}`} className={`font-bold text-lg cursor-pointer select-none ${day.isWorkDay ? 'text-primary-700 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {DAY_NAMES[index]}
                                    </label>
                                    <div className="flex items-center h-5">
                                        <input
                                            id={`day-${index}`}
                                            type="checkbox"
                                            checked={day.isWorkDay}
                                            onChange={() => handleDayToggle(index)}
                                            className="focus:ring-primary h-5 w-5 text-primary border-gray-300 rounded cursor-pointer"
                                        />
                                    </div>
                                </div>
                                
                                {day.isWorkDay ? (
                                    <div className="flex flex-col gap-3 relative z-10">
                                        <div className="flex flex-col">
                                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">وقت البدء</label>
                                            <input
                                                type="time"
                                                name="startTime"
                                                value={day.startTime}
                                                onChange={(e) => handleTimeChange(e, index)}
                                                className={inputStyle}
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">وقت الانتهاء</label>
                                            <input
                                                type="time"
                                                name="endTime"
                                                value={day.endTime}
                                                onChange={(e) => handleTimeChange(e, index)}
                                                className={inputStyle}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-grow flex items-center justify-center py-4 mt-2">
                                        <span className="px-4 py-1.5 rounded-full bg-gray-200/50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-sm font-medium border border-gray-300/30">
                                            عطلة
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    
                    {feedback && (
                        <div className={`p-4 rounded-xl text-center font-medium backdrop-blur-md shadow-sm border ${feedback.includes('فشل') ? 'bg-red-100/80 text-red-700 border-red-200' : 'bg-green-100/80 text-green-700 border-green-200'}`}>
                            {feedback}
                        </div>
                    )}
                    
                    <div className="flex justify-end pt-4 border-t dark:border-gray-700/50">
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex justify-center py-3 px-8 border border-transparent shadow-lg shadow-primary/30 text-sm font-bold rounded-xl text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 w-full sm:w-auto"
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

    const inputStyle = "w-full px-3 py-2 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-gray-200 dark:border-gray-600 rounded-lg shadow-inner focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent text-black dark:text-white transition-colors";

    return (
        <div className="mt-8 relative">
             <div className="flex justify-between items-center mb-6 border-b pb-2 dark:border-gray-700/50">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">إعدادات أسعار العلاج</h2>
                <button onClick={() => setIsAdding(true)} className="flex items-center text-sm font-bold bg-gradient-to-r from-primary-600 to-primary-500 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-primary/30 transition-transform active:scale-95">
                    <PlusIcon className="h-4 w-4 ml-1" /> إضافة علاج
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleAddSubmit} className="mb-6 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/20 dark:border-gray-700 animate-fade-in-down">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input type="text" placeholder="اسم العلاج" value={newTreatment.name} onChange={e => setNewTreatment({...newTreatment, name: e.target.value})} className={inputStyle} required />
                        <input type="number" placeholder="السعر" value={newTreatment.price} onChange={e => setNewTreatment({...newTreatment, price: e.target.value})} className={inputStyle} required />
                        <input type="text" placeholder="ملاحظات (اختياري)" value={newTreatment.notes} onChange={e => setNewTreatment({...newTreatment, notes: e.target.value})} className={inputStyle} />
                    </div>
                    <div className="mt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 bg-white/50 dark:bg-slate-700/50 rounded-lg hover:bg-white dark:hover:bg-slate-600 transition-colors">إلغاء</button>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 shadow-md transition-colors disabled:bg-green-400">{isSaving ? 'جاري الحفظ...' : 'حفظ'}</button>
                    </div>
                </form>
            )}

            {loading ? <CenteredLoadingSpinner /> : (
                <div className="bg-white/30 dark:bg-slate-800/30 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-white/20 dark:border-gray-700/50">
                    {treatments.length > 0 ? (
                        <ul className="divide-y divide-gray-100/50 dark:divide-gray-700/50">
                            {treatments.map(t => (
                                <li key={t.id} className="p-4 transition-colors hover:bg-white/40 dark:hover:bg-slate-700/40">
                                    {editingId === t.id ? (
                                        <form onSubmit={handleUpdateSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center w-full">
                                            <input type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} className={inputStyle} required />
                                            <input type="number" value={editData.price} onChange={e => setEditData({...editData, price: e.target.value})} className={inputStyle} required />
                                            <input type="text" value={editData.notes} onChange={e => setEditData({...editData, notes: e.target.value})} className={inputStyle} />
                                            <div className="flex gap-2 justify-end">
                                                <button type="button" onClick={handleCancelEdit} className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500">إلغاء</button>
                                                <button type="submit" disabled={isSaving} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm">{isSaving ? 'حفظ...' : 'حفظ'}</button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="flex justify-between items-center w-full">
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-gray-100 text-lg">{t.name}</p>
                                                {t.notes && <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100/50 dark:bg-slate-700/50 px-2 py-0.5 rounded-full inline-block mt-1">{t.notes}</p>}
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <span className="font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-lg">
                                                    {t.price.toLocaleString('en-US')} SYP
                                                </span>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleEditClick(t)} className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors" title="تعديل">
                                                        <PencilIcon className="h-5 w-5" />
                                                    </button>
                                                    <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors" title="حذف">
                                                        <TrashIcon className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : <p className="p-8 text-center text-gray-500 dark:text-gray-400">لا توجد علاجات مضافة.</p>}
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
    const inputStyle = "w-full px-4 py-3 bg-white/50 dark:bg-slate-700/50 backdrop-blur-md border border-gray-200 dark:border-gray-600 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-black dark:text-white transition-all";

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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-2xl rounded-3xl shadow-2xl w-full max-w-md border border-white/20 dark:border-white/10 overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/40 dark:bg-black/20">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">تعديل الملف الشخصي</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"><XIcon className="h-6 w-6 text-gray-500" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && <p className="text-red-500 text-sm bg-red-100 dark:bg-red-900/30 p-3 rounded-lg border border-red-200 dark:border-red-800">{error}</p>}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">الاسم</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputStyle} required />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">البريد الإلكتروني</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputStyle} required />
                    </div>
                    {isDoctor && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">التخصص</label>
                            <input type="text" name="specialty" value={formData.specialty} onChange={handleChange} className={inputStyle} />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">كلمة المرور الجديدة (اختياري)</label>
                        <input type="password" name="password" value={formData.password} onChange={handleChange} className={inputStyle} placeholder="اتركها فارغة لعدم التغيير" />
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="submit" disabled={isLoading} className="bg-gradient-to-r from-primary-600 to-primary-500 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all font-bold disabled:opacity-50">
                            {isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
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
            await api.exportCenterData();
            await new Promise(resolve => setTimeout(resolve, 2000));
            await api.profile.delete();
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
        <div className="max-w-4xl mx-auto p-4 space-y-8 pb-20">
            {/* Liquid Background Blobs */}
            <div className="fixed top-20 right-0 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px] pointer-events-none -z-10 animate-blob"></div>
            <div className="fixed bottom-20 left-0 w-80 h-80 bg-secondary-500/20 rounded-full blur-[100px] pointer-events-none -z-10 animate-blob animation-delay-2000"></div>

            {/* Profile Header Card - Glassmorphism */}
            <div className="relative bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-2xl rounded-[3rem] overflow-hidden p-8 transition-transform duration-500 hover:scale-[1.01]">
                
                {/* Decorative Liquid Shine */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    {/* Avatar Ring */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary-400 to-secondary-400 rounded-full blur-lg opacity-70 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative h-32 w-32 rounded-full p-1 bg-white/30 dark:bg-white/10 backdrop-blur-sm ring-1 ring-white/50">
                            <div className="h-full w-full rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-gray-400 shadow-inner">
                                <UserCircleIcon className="h-24 w-24 text-primary-500/80 dark:text-primary-300/80" />
                            </div>
                        </div>
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="absolute bottom-2 right-2 p-2 bg-white/90 dark:bg-slate-700/90 backdrop-blur text-primary-600 rounded-full shadow-lg hover:scale-110 transition-transform border border-primary-100 dark:border-gray-600"
                            title="تعديل الملف الشخصي"
                        >
                            <PencilIcon className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="flex-1 text-center md:text-right">
                        <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 mb-2 drop-shadow-sm">
                            {user.name}
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-300 font-medium mb-3">{user.email}</p>
                        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                            <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-bold bg-primary-100/50 text-primary-800 dark:bg-primary-900/40 dark:text-primary-200 border border-primary-200 dark:border-primary-800 shadow-sm backdrop-blur-sm">
                                {ROLE_NAMES[user.role]}
                            </span>
                            {isDoctor && (
                                <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-bold bg-secondary-100/50 text-secondary-800 dark:bg-secondary-900/40 dark:text-secondary-200 border border-secondary-200 dark:border-secondary-800 shadow-sm backdrop-blur-sm">
                                    {user.specialty || 'طبيب عام'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions Bar */}
                <div className="mt-8 pt-6 border-t border-white/20 dark:border-white/5 flex flex-wrap justify-center md:justify-end gap-4 relative z-10">
                     {isManager && (
                        <button
                            onClick={handleExportData}
                            disabled={isExporting}
                            className="flex items-center gap-2 px-6 py-3 bg-white/50 dark:bg-slate-700/50 hover:bg-white/80 dark:hover:bg-slate-600/80 backdrop-blur-md rounded-2xl shadow-sm hover:shadow-lg border border-white/30 dark:border-white/10 text-primary-700 dark:text-primary-300 font-bold transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
                        >
                            {isExporting ? <LoadingSpinner className="h-5 w-5" /> : <ArrowDownOnSquareIcon className="h-5 w-5" />}
                            <span>تصدير البيانات</span>
                        </button>
                    )}
                    
                    {user.role === UserRole.Admin && (
                        <button
                            onClick={handleDeleteAccountClick}
                            className="flex items-center gap-2 px-6 py-3 bg-red-50/50 dark:bg-red-900/20 hover:bg-red-100/80 dark:hover:bg-red-900/40 backdrop-blur-md rounded-2xl shadow-sm hover:shadow-lg border border-red-200/50 dark:border-red-800/30 text-red-600 dark:text-red-400 font-bold transition-all transform hover:-translate-y-0.5"
                        >
                            <TrashIcon className="h-5 w-5" />
                            <span>حذف الحساب</span>
                        </button>
                    )}
                    
                    <button
                        onClick={handleLogoutClick}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-600 text-gray-800 dark:text-white rounded-2xl shadow-md hover:shadow-xl font-bold transition-all transform hover:-translate-y-0.5"
                    >
                        <LogoutIcon className="h-5 w-5" />
                        <span>تسجيل الخروج</span>
                    </button>
                </div>
            </div>

            {/* Sections */}
            <div className="relative z-10 space-y-8 animate-fade-in-up">
                {isDoctor && <DoctorAvailabilitySettings user={user} refreshTrigger={refreshTrigger} />}
                {isManager && <TreatmentsSettings />}
            </div>

            {/* Modals */}
            {isEditModalOpen && (
                <EditProfileModal
                    user={user}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={refreshUser}
                />
            )}

            {isLogoutConfirmOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4 transition-opacity" onClick={() => setIsLogoutConfirmOpen(false)}>
                    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-2xl rounded-3xl shadow-2xl w-full max-w-sm border border-white/20 dark:border-gray-700 transform scale-100 transition-transform" onClick={e => e.stopPropagation()}>
                        <div className="p-8 text-center">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 mb-4 shadow-inner">
                                <LogoutIcon className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">تسجيل الخروج</h3>
                            <p className="text-gray-500 dark:text-gray-300 mb-6">هل أنت متأكد من رغبتك في تسجيل الخروج؟</p>
                            
                            <div className="flex gap-3">
                                <button onClick={confirmLogout} className="flex-1 rounded-xl shadow-lg shadow-red-500/30 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold hover:scale-[1.02] transition-transform">
                                    نعم، خروج
                                </button>
                                <button onClick={() => setIsLogoutConfirmOpen(false)} className="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-3 bg-transparent text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                    إلغاء
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isDeleteAccountModalOpen && (
                <div className="fixed inset-0 bg-red-900/40 backdrop-blur-md z-[100] flex justify-center items-center p-4" onClick={() => setIsDeleteAccountModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-[0_0_50px_rgba(220,38,38,0.5)] w-full max-w-md border-2 border-red-500 overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-8 text-center relative">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-orange-500 to-red-500"></div>
                            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/50 mb-6 animate-pulse">
                                <TrashIcon className="h-10 w-10 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">حذف الحساب نهائياً</h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                                <span className="font-bold text-red-600">تحذير:</span> سيتم فقدان جميع البيانات بشكل دائم. سيتم تحميل نسخة احتياطية تلقائياً قبل الحذف.
                            </p>
                            
                            <div className="space-y-3">
                                <button
                                    onClick={handleExportAndDelete}
                                    disabled={isDeletingAccount}
                                    className="w-full flex items-center justify-center gap-3 rounded-xl shadow-lg shadow-red-600/40 px-4 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                                >
                                    {isDeletingAccount ? <LoadingSpinner className="h-6 w-6 text-white" /> : <ArrowDownOnSquareIcon className="h-6 w-6" />}
                                    <span>تحميل البيانات وحذف الحساب</span>
                                </button>
                                
                                <button
                                    onClick={() => setIsDeleteAccountModalOpen(false)}
                                    disabled={isDeletingAccount}
                                    className="w-full rounded-xl px-4 py-3 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white font-semibold transition-colors"
                                >
                                    تراجع
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
