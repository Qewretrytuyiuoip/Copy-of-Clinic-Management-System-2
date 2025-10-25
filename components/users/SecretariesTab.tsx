import React, { useEffect, useState, useCallback } from 'react';
import { User, UserRole } from '../../types';
import { api } from '../../services/api';
import { PlusIcon, PencilIcon, TrashIcon, XIcon } from '../../components/Icons';
import { CenteredLoadingSpinner } from '../../components/LoadingSpinner';


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
// AddSecretaryModal Component
// ===================================================================
interface AddSecretaryModalProps {
    onSave: (newUser: Omit<User, 'id' | 'role'>) => Promise<void>;
    onClose: () => void;
}

const AddSecretaryModal: React.FC<AddSecretaryModalProps> = ({ onSave, onClose }) => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.password) {
            alert('كلمة المرور مطلوبة للسكرتير الجديد.');
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
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">إضافة سكرتير جديد</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="nameAdd" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاسم</label>
                            <input type="text" id="nameAdd" name="name" value={formData.name} onChange={handleChange} required className={inputStyle} />
                        </div>
                        <div>
                            <label htmlFor="emailAdd" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">البريد الإلكتروني</label>
                            <input type="email" id="emailAdd" name="email" value={formData.email} onChange={handleChange} required className={inputStyle} />
                        </div>
                        <div>
                            <label htmlFor="passwordAdd" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">كلمة المرور</label>
                            <input type="password" id="passwordAdd" name="password" value={formData.password} onChange={handleChange} required className={inputStyle} />
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
    onSave: (updatedSecretary: User) => Promise<void>;
    onClose: () => void;
}

const EditSecretaryModal: React.FC<EditSecretaryModalProps> = ({ secretary, onSave, onClose }) => {
    const [formData, setFormData] = useState({ name: secretary.name, email: secretary.email, password: '' });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const updates: Partial<User> = { name: formData.name, email: formData.email };
        if (formData.password) {
            updates.password = formData.password;
        }
        await onSave({ ...secretary, ...updates });
        setIsSaving(false);
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
                    <div className="p-6 space-y-4">
                        <div><label htmlFor="nameEdit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاسم</label><input type="text" id="nameEdit" name="name" value={formData.name} onChange={handleChange} required className={inputStyle} /></div>
                        <div><label htmlFor="emailEdit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">البريد الإلكتروني</label><input type="email" id="emailEdit" name="email" value={formData.email} onChange={handleChange} required className={inputStyle} /></div>
                        <div><label htmlFor="passwordEdit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">كلمة المرور (اتركها فارغة لعدم التغيير)</label><input type="password" id="passwordEdit" name="password" value={formData.password} onChange={handleChange} className={inputStyle} /></div>
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


const SecretariesTab: React.FC<{ refreshTrigger: number }> = ({ refreshTrigger }) => {
    const [secretaries, setSecretaries] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isAddingSecretary, setIsAddingSecretary] = useState(false);
    const [editingSecretary, setEditingSecretary] = useState<User | null>(null);
    const [deletingSecretary, setDeletingSecretary] = useState<User | null>(null);


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

    const handleCreateSecretary = async (newSecretaryData: Omit<User, 'id' | 'role'>) => {
        await api.secretaries.create({ ...newSecretaryData, role: UserRole.Secretary });
        setIsAddingSecretary(false);
        await fetchSecretaries();
    };
    
    const handleUpdateSecretary = async (updatedSecretary: User) => {
        await api.secretaries.update(updatedSecretary.id, updatedSecretary);
        setEditingSecretary(null);
        await fetchSecretaries();
    };

    const confirmDeleteSecretary = async () => {
        if (deletingSecretary) {
            await api.secretaries.delete(deletingSecretary.id);
            setDeletingSecretary(null);
            await fetchSecretaries();
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">قائمة السكرتارية</h2>
                <button onClick={() => setIsAddingSecretary(true)} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700 transition-colors">
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
            {isAddingSecretary && <AddSecretaryModal onClose={() => setIsAddingSecretary(false)} onSave={handleCreateSecretary} />}
            {editingSecretary && <EditSecretaryModal secretary={editingSecretary} onClose={() => setEditingSecretary(null)} onSave={handleUpdateSecretary} />}
            {deletingSecretary && (
                <ConfirmDeleteModal
                    title="حذف سكرتير"
                    message={`هل أنت متأكد من رغبتك في حذف ${deletingSecretary.name}؟ لا يمكن التراجع عن هذا الإجراء.`}
                    onConfirm={confirmDeleteSecretary}
                    onCancel={() => setDeletingSecretary(null)}
                />
            )}
        </div>
    );
};

export default SecretariesTab;