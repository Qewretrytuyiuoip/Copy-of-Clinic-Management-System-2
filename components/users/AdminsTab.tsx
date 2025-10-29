import React, { useEffect, useState, useCallback } from 'react';
import { User, UserRole } from '../../types';
import { api, ApiError } from '../../services/api';
import { PlusIcon, PencilIcon, TrashIcon, XIcon } from '../../components/Icons';
import { CenteredLoadingSpinner } from '../../components/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';

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
// Add/Edit Modals for SubManager
// ===================================================================
interface SubManagerFormModalProps {
    subManager?: User;
    onSave: (data: Omit<User, 'id' | 'role'> | User) => Promise<void>;
    onClose: () => void;
}

const SubManagerFormModal: React.FC<SubManagerFormModalProps> = ({ subManager, onSave, onClose }) => {
    const isEditMode = !!subManager;
    const [formData, setFormData] = useState({ 
        name: subManager?.name || '', 
        email: subManager?.email || '', 
        password: '' 
    });
    const [isSaving, setIsSaving] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
    const [formErrors, setFormErrors] = useState({ email: '', password: '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (validationErrors[name]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
        if (formErrors[name as keyof typeof formErrors]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const errors = { email: '', password: '' };
        const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

        if (!emailRegex.test(formData.email)) {
            errors.email = 'الرجاء إدخال بريد إلكتروني صحيح.';
        }
        
        if (!isEditMode) {
            if (!formData.password) {
                errors.password = 'كلمة المرور مطلوبة.';
            } else if (formData.password.length < 6) {
                errors.password = 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.';
            }
        } 
        else if (formData.password && formData.password.length < 6) {
            errors.password = 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.';
        }

        setFormErrors(errors);
        return !errors.email && !errors.password;
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }
        setIsSaving(true);
        setValidationErrors({});
        try {
            const updates: Partial<User> = { name: formData.name, email: formData.email };
            if (formData.password) {
                updates.password = formData.password;
            }
            const dataToSave = isEditMode ? { ...subManager, ...updates } : formData;
            await onSave(dataToSave);
        } catch(error) {
            setIsSaving(false);
            if (error instanceof ApiError && error.errors) {
                setValidationErrors(error.errors);
            } else {
                alert(`فشل الحفظ: ${error instanceof Error ? error.message : "خطأ غير معروف"}`);
            }
        }
    };
    
    const inputStyle = "w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black dark:text-white";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md" role="dialog" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{isEditMode ? 'تعديل مدير فرعي' : 'إضافة مدير فرعي جديد'}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div><label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاسم</label><input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className={inputStyle} /></div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">البريد الإلكتروني</label>
                            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className={inputStyle} />
                            {validationErrors.email && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">هذا الايميل موجود بالفعل</p>
                            )}
                            {formErrors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.email}</p>}
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">كلمة المرور {isEditMode && '(اتركها فارغة لعدم التغيير)'}</label>
                            <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required={!isEditMode} className={inputStyle} />
                            {formErrors.password && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.password}</p>}
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

const AdminsTab: React.FC<{ refreshTrigger: number }> = ({ refreshTrigger }) => {
    const { user: currentUser } = useAuth();
    const [admins, setAdmins] = useState<User[]>([]);
    const [subManagers, setSubManagers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [editing, setEditing] = useState<User | null>(null);
    const [deleting, setDeleting] = useState<User | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const [fetchedAdmins, fetchedSubManagers] = await Promise.all([
                api.admins.getAll(),
                api.subManagers.getAll(),
            ]);
            setAdmins(fetchedAdmins);
            setSubManagers(fetchedSubManagers);
        } catch (error) {
             if (error instanceof Error && error.message.includes('Failed to fetch')) {
                setFetchError('فشل جلب البيانات الرجاء التأكد من اتصالك بالانترنت واعادة تحميل البيانات');
            } else {
                setFetchError('حدث خطأ غير متوقع.');
                console.error("Failed to fetch admins:", error);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData, refreshTrigger]);

    const handleSave = async (data: Omit<User, 'id' | 'role'> | User) => {
        try {
            if ('id' in data) { // Editing
                await api.subManagers.update(data.id, data);
            } else { // Adding
                await api.subManagers.create({ ...data, role: UserRole.SubManager });
            }
            setIsAdding(false);
            setEditing(null);
            await fetchData();
        } catch(error) {
            console.error("Failed to save sub-manager:", error);
            throw error;
        }
    };

    const confirmDelete = async () => {
        if (deleting) {
             setIsDeleting(true);
             try {
                await api.subManagers.delete(deleting.id);
                setDeleting(null);
                await fetchData();
             } catch(error) {
                 alert(`فشل حذف المدير الفرعي: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
             } finally {
                setIsDeleting(false);
             }
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">المدراء الأساسيون</h2>
             <div className="min-h-[100px] mb-8">
                 {loading ? <CenteredLoadingSpinner /> : fetchError ? (
                     <div className="text-center py-8 text-red-500 dark:text-red-400"><p>{fetchError}</p></div>
                ) : (
                     admins.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {admins.map(admin => (
                                <div key={admin.id} className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 transition-shadow">
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{admin.name}</h3>
                                    <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">{admin.email}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <p className="text-center text-gray-500 dark:text-gray-400 py-8">لم يتم العثور على مدراء.</p>
                    )
                )}
            </div>

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">المدراء الفرعيون</h2>
                <button onClick={() => setIsAdding(true)} className="hidden lg:flex items-center bg-primary text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700 transition-colors">
                    <PlusIcon className="h-5 w-5 ml-2" />
                    إضافة مدير فرعي
                </button>
            </div>

            <div className="min-h-[200px]">
                 {loading ? <CenteredLoadingSpinner /> : (
                     subManagers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {subManagers.map(sub => (
                                <div key={sub.id} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col justify-between transition-shadow hover:shadow-lg">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{sub.name}</h3>
                                        <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">{sub.email}</p>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 flex items-center justify-end space-x-2">
                                        <button onClick={() => setEditing(sub)} className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 text-sm">
                                            <PencilIcon className="h-4 w-4" />
                                            <span className="mr-1">تعديل</span>
                                        </button>
                                        {sub.id !== currentUser?.id && (
                                            <button onClick={() => setDeleting(sub)} className="flex items-center text-red-600 dark:text-red-400 hover:text-red-800 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/40 text-sm">
                                                <TrashIcon className="h-4 w-4" />
                                                <span className="mr-1">حذف</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <p className="text-center text-gray-500 dark:text-gray-400 py-8">لم يتم العثور على مدراء فرعيين.</p>
                    )
                )}
            </div>

            <button 
                onClick={() => setIsAdding(true)} 
                className="lg:hidden fixed bottom-20 right-4 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary-700 transition-colors z-20"
                aria-label="إضافة مدير فرعي"
            >
                <PlusIcon className="h-6 w-6" />
            </button>
            
            {(isAdding || editing) && (
                <SubManagerFormModal 
                    key={editing?.id || 'add'}
                    subManager={editing || undefined}
                    onClose={() => { setIsAdding(false); setEditing(null); }} 
                    onSave={handleSave}
                />
            )}
            {deleting && (
                <ConfirmDeleteModal
                    title="حذف مدير فرعي"
                    message={`هل أنت متأكد من رغبتك في حذف ${deleting.name}؟ لا يمكن التراجع عن هذا الإجراء.`}
                    onConfirm={confirmDelete}
                    onCancel={() => !isDeleting && setDeleting(null)}
                    isDeleting={isDeleting}
                />
            )}
        </div>
    );
};

// FIX: Add default export to make the component importable.
export default AdminsTab;