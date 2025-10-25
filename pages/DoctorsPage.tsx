import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { useAuth } from '../hooks/useAuth';
import { ROLE_NAMES } from '../constants';
import { LogoutIcon, PencilIcon, UserCircleIcon, XIcon, TrashIcon } from '../components/Icons';
import { api, ApiError } from '../services/api';

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

const ProfilePage: React.FC = () => {
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
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">الملف الشخصي</h1>

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