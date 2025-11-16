import React, { useEffect, useState, useCallback } from 'react';
import { User, UserRole, Permission } from '../../types';
import { api, ApiError } from '../../services/api';
import { PlusIcon, PencilIcon, TrashIcon, XIcon } from '../../components/Icons';
import { CenteredLoadingSpinner } from '../../components/LoadingSpinner';
import { useQuery } from '@tanstack/react-query';


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
// AddSecretaryModal Component
// ===================================================================
interface AddSecretaryModalProps {
    onSave: (newUser: Omit<User, 'id' | 'role' | 'permissions'> & { permissions?: number[] }) => Promise<void>;
    onClose: () => void;
}

const AddSecretaryModal: React.FC<AddSecretaryModalProps> = ({ onSave, onClose }) => {
    const { data: allPermissions, isLoading: isLoadingPermissions } = useQuery({
        queryKey: ['permissions'],
        queryFn: api.permissions.getAll
    });

    const availablePermissions = allPermissions?.filter(p => p.name !== 'view_all_appointments');

    const [formData, setFormData] = useState({ name: '', email: '', password: '', permissions: [] as number[] });
    const [isSaving, setIsSaving] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
    const [formErrors, setFormErrors] = useState({ email: '', password: '' });

    const handlePermissionChange = (permissionId: number) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permissionId)
                ? prev.permissions.filter(id => id !== permissionId)
                : [...prev.permissions, permissionId]
        }));
    };

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

        if (!formData.password) {
            errors.password = 'كلمة المرور مطلوبة.';
        } else if (formData.password.length < 6) {
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
            await onSave(formData);
        } catch (error) {
            setIsSaving(false);
            if (error instanceof ApiError && error.errors) {
                setValidationErrors(error.errors);
            } else {
                alert(`فشل في إنشاء السكرتير: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
            }
        }
    };
    
    const inputStyle = "w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black dark:text-white";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md" role="dialog" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">إضافة سكرتير جديد</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div>
                            <label htmlFor="nameAdd" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاسم</label>
                            <input type="text" id="nameAdd" name="name" value={formData.name} onChange={handleChange} required className={inputStyle} />
                        </div>
                        <div>
                            <label htmlFor="emailAdd" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">البريد الإلكتروني</label>
                            <input type="email" id="emailAdd" name="email" value={formData.email} onChange={handleChange} required className={inputStyle} />
                            {validationErrors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">هذا الايميل موجود بالفعل</p>}
                            {formErrors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.email}</p>}
                        </div>
                        <div>
                            <label htmlFor="passwordAdd" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">كلمة المرور</label>
                            <input type="password" id="passwordAdd" name="password" value={formData.password} onChange={handleChange} required className={inputStyle} />
                            {formErrors.password && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.password}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الصلاحيات</label>
                            <div className="mt-2 p-3 border border-gray-800 dark:border-gray-600 rounded-md max-h-40 overflow-y-auto space-y-2">
                                {isLoadingPermissions ? <CenteredLoadingSpinner /> : availablePermissions?.map(permission => (
                                    <label key={permission.id} className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.permissions.includes(permission.id)}
                                            onChange={() => handlePermissionChange(permission.id)}
                                            className="h-4 w-4 text-primary rounded border-gray-300 dark:border-gray-500 focus:ring-primary"
                                        />
                                        <span className="text-sm text-gray-900 dark:text-gray-100">{permission.display_name}</span>
                                    </label>
                                ))}
                            </div>
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
// EditSecretaryModal Component
// ===================================================================
interface EditSecretaryModalProps {
    secretary: User;
    // FIX: Changed onSave signature to pass ID and updates separately, resolving type errors.
    onSave: (id: string, updates: Partial<Omit<User, 'permissions'>> & { permissions?: number[] }) => Promise<void>;
    onClose: () => void;
}

const EditSecretaryModal: React.FC<EditSecretaryModalProps> = ({ secretary, onSave, onClose }) => {
    const { data: allPermissions, isLoading: isLoadingPermissions } = useQuery({
        queryKey: ['permissions'],
        queryFn: api.permissions.getAll
    });
    
    const availablePermissions = allPermissions?.filter(p => p.name !== 'view_all_appointments');

    const [formData, setFormData] = useState({ name: secretary.name, email: secretary.email, password: '', permissions: secretary.permissions?.map(p => p.id) || [] as number[] });
    const [isSaving, setIsSaving] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
    const [formErrors, setFormErrors] = useState({ email: '', password: '' });

    const handlePermissionChange = (permissionId: number) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permissionId)
                ? prev.permissions.filter(id => id !== permissionId)
                : [...prev.permissions, permissionId]
        }));
    };

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

        if (formData.password && formData.password.length < 6) {
            errors.password = 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.';
        }

        setFormErrors(errors);
        return !errors.email && !errors.password;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!validateForm()){
            return;
        }
        setIsSaving(true);
        setValidationErrors({});
        try {
            // FIX: Constructed a clean 'updates' object to pass to onSave, resolving type conflicts.
            const updates: Partial<Omit<User, 'permissions'>> & { permissions?: number[] } = {
                name: formData.name,
                email: formData.email,
                permissions: formData.permissions
            };
            if (formData.password) {
                updates.password = formData.password;
            }
            await onSave(secretary.id, updates);
        } catch (error) {
            setIsSaving(false);
             if (error instanceof ApiError && error.errors) {
                setValidationErrors(error.errors);
            } else {
                alert(`فشل في تعديل السكرتير: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
            }
        }
    };
    
    const inputStyle = "w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black dark:text-white";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md" role="dialog" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">تعديل بيانات السكرتير</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div><label htmlFor="nameEdit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاسم</label><input type="text" id="nameEdit" name="name" value={formData.name} onChange={handleChange} required className={inputStyle} /></div>
                        <div>
                            <label htmlFor="emailEdit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">البريد الإلكتروني</label>
                            <input type="email" id="emailEdit" name="email" value={formData.email} onChange={handleChange} required className={inputStyle} />
                            {validationErrors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">هذا الايميل موجود بالفعل</p>}
                            {formErrors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.email}</p>}
                        </div>
                        <div>
                            <label htmlFor="passwordEdit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">كلمة المرور (اتركها فارغة لعدم التغيير)</label>
                            <input type="password" id="passwordEdit" name="password" value={formData.password} onChange={handleChange} className={inputStyle} />
                            {formErrors.password && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.password}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الصلاحيات</label>
                            <div className="mt-2 p-3 border border-gray-800 dark:border-gray-600 rounded-md max-h-40 overflow-y-auto space-y-2">
                                {isLoadingPermissions ? <CenteredLoadingSpinner /> : availablePermissions?.map(permission => (
                                    <label key={permission.id} className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.permissions.includes(permission.id)}
                                            onChange={() => handlePermissionChange(permission.id)}
                                            className="h-4 w-4 text-primary rounded border-gray-300 dark:border-gray-500 focus:ring-primary"
                                        />
                                        <span className="text-sm text-gray-900 dark:text-gray-100">{permission.display_name}</span>
                                    </label>
                                ))}
                            </div>
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

interface SecretariesTabProps {
    refreshTrigger: number;
    canAddUser: boolean;
}

const SecretariesTab: React.FC<SecretariesTabProps> = ({ refreshTrigger, canAddUser }) => {
    const [secretaries, setSecretaries] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isAddingSecretary, setIsAddingSecretary] = useState(false);
    const [editingSecretary, setEditingSecretary] = useState<User | null>(null);
    const [deletingSecretary, setDeletingSecretary] = useState<User | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchSecretaries = useCallback(async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const allUsers = await api.secretaries.getAll();
            setSecretaries(allUsers);
        } catch (error) {
            if (error instanceof Error && error.message.includes('Failed to fetch')) {
                setFetchError('فشل جلب البيانات الرجاء التأكد من اتصالك بالانترنت واعادة تحميل البيانات');
            } else {
                setFetchError('حدث خطأ غير متوقع.');
                console.error("Failed to fetch secretaries:", error);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSecretaries();
    }, [fetchSecretaries, refreshTrigger]);
    
    const handleAddClick = () => {
        if (canAddUser) {
            setIsAddingSecretary(true);
        } else {
            alert('لا يمكنك اضافة المزيد من المستخدمين. الرجاء ترقية الخطة.');
        }
    };

    const handleCreateSecretary = async (newSecretaryData: Omit<User, 'id' | 'role' | 'permissions'> & { permissions?: number[] }) => {
        try {
            await api.secretaries.create({ ...newSecretaryData, role: UserRole.Secretary });
            setIsAddingSecretary(false);
            await fetchSecretaries();
        } catch(error) {
            console.error("Failed to create secretary:", error);
            throw error;
        }
    };
    
    // FIX: Updated handler signature to match the corrected `onSave` prop, resolving type errors.
    const handleUpdateSecretary = async (id: string, updates: Partial<Omit<User, 'permissions'>> & { permissions?: number[] }) => {
        try {
            await api.secretaries.update(id, updates);
            setEditingSecretary(null);
            await fetchSecretaries();
        } catch(error) {
            console.error("Failed to update secretary:", error);
            throw error;
        }
    };

    const confirmDeleteSecretary = async () => {
        if (deletingSecretary) {
            setIsDeleting(true);
             try {
                await api.secretaries.delete(deletingSecretary.id);
                setDeletingSecretary(null);
                await fetchSecretaries();
             } catch(error) {
                 alert(`فشل حذف السكرتير: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
             } finally {
                setIsDeleting(false);
             }
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">قائمة السكرتارية</h2>
                <button onClick={handleAddClick} className="hidden lg:flex items-center bg-primary text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700 transition-colors">
                    <PlusIcon className="h-5 w-5 ml-2" />
                    إضافة سكرتير
                </button>
            </div>
            
            <div className="min-h-[200px]">
                {loading ? <CenteredLoadingSpinner /> : fetchError ? (
                     <div className="text-center py-16 text-red-500 dark:text-red-400"><p>{fetchError}</p></div>
                ) : (
                     secretaries.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {secretaries.map(sec => (
                                <div key={sec.id} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col justify-between transition-shadow hover:shadow-lg">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{sec.name}</h3>
                                        <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">{sec.email}</p>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 flex items-center justify-end space-x-2">
                                        <button onClick={() => setEditingSecretary(sec)} className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 text-sm">
                                            <PencilIcon className="h-4 w-4" />
                                            <span className="mr-1">تعديل</span>
                                        </button>
                                        <button onClick={() => setDeletingSecretary(sec)} className="flex items-center text-red-600 dark:text-red-400 hover:text-red-800 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/40 text-sm">
                                            <TrashIcon className="h-4 w-4" />
                                            <span className="mr-1">حذف</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <p className="text-center text-gray-500 dark:text-gray-400 py-8">لم يتم العثور على سكرتارية.</p>
                    )
                )}
            </div>

            <button 
                onClick={handleAddClick} 
                className="lg:hidden fixed bottom-20 right-4 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary-700 transition-colors z-20"
                aria-label="إضافة سكرتير"
            >
                <PlusIcon className="h-6 w-6" />
            </button>
            
            {isAddingSecretary && <AddSecretaryModal onClose={() => setIsAddingSecretary(false)} onSave={handleCreateSecretary} />}
            {editingSecretary && <EditSecretaryModal secretary={editingSecretary} onClose={() => setEditingSecretary(null)} onSave={handleUpdateSecretary} />}
            {deletingSecretary && (
                <ConfirmDeleteModal
                    title="حذف سكرتير"
                    message={`هل أنت متأكد من رغبتك في حذف ${deletingSecretary.name}؟ لا يمكن التراجع عن هذا الإجراء.`}
                    onConfirm={confirmDeleteSecretary}
                    onCancel={() => !isDeleting && setDeletingSecretary(null)}
                    isDeleting={isDeleting}
                />
            )}
        </div>
    );
};
export default SecretariesTab;