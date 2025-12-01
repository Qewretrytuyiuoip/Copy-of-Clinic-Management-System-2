import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Center } from '../../types';
import { api } from '../../services/api';
import { CenteredLoadingSpinner } from '../LoadingSpinner';
import { OfficeBuildingIcon, CalendarIcon, UsersIcon, PencilIcon, XIcon, CheckIcon } from '../Icons';

interface DashboardApplicationManagerProps {
    user: User;
    refreshTrigger: number;
}

interface EditCenterModalProps {
    center: Center;
    onClose: () => void;
    onSave: (updatedData: Partial<Center>) => Promise<void>;
}

const EditCenterModal: React.FC<EditCenterModalProps> = ({ center, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: center.name,
        type: center.type,
        address: center.address,
        description: center.description,
        max_users: center.max_users,
        subscription_start: center.subscription_start ? new Date(center.subscription_start).toISOString().split('T')[0] : '',
        subscription_end: center.subscription_end ? new Date(center.subscription_end).toISOString().split('T')[0] : '',
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
            await onSave({ ...formData, id: center.id });
            onClose();
        } catch (error) {
            console.error(error);
            alert('فشل حفظ التعديلات');
        } finally {
            setIsSaving(false);
        }
    };

    const inputStyle = "w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black dark:text-white";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">تعديل المركز: {center.name}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم المركز</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputStyle} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">النوع</label>
                        <input type="text" name="type" value={formData.type} onChange={handleChange} className={inputStyle} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العنوان</label>
                        <input type="text" name="address" value={formData.address} onChange={handleChange} className={inputStyle} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">عدد المستخدمين الأقصى</label>
                        <input type="number" name="max_users" value={formData.max_users} onChange={handleChange} className={inputStyle} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">بداية الاشتراك</label>
                            <input type="date" name="subscription_start" value={formData.subscription_start} onChange={handleChange} className={inputStyle} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نهاية الاشتراك</label>
                            <input type="date" name="subscription_end" value={formData.subscription_end} onChange={handleChange} className={inputStyle} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الوصف</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className={inputStyle}></textarea>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 ml-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600">إلغاء</button>
                        <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-700 disabled:opacity-50">
                            {isSaving ? 'جاري الحفظ...' : (
                                <>
                                    <CheckIcon className="w-4 h-4" />
                                    <span>حفظ</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const CenterCard: React.FC<{ center: Center; onEdit: (center: Center) => void }> = ({ center, onEdit }) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700 flex flex-col h-full relative group">
        {/* Edit Button */}
        <button 
            onClick={() => onEdit(center)}
            className="absolute top-4 left-4 p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-primary hover:text-white dark:hover:bg-primary transition-colors shadow-sm z-10"
            title="تعديل المركز"
        >
            <PencilIcon className="h-4 w-4" />
        </button>

        <div className="p-5 flex-grow">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-grow">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-1" title={center.name}>{center.name}</h3>
                    <p className="text-sm text-primary font-medium mb-3">{center.type || 'غير محدد'}</p>
                </div>
                {center.logo_url ? (
                    <img src={center.logo_url} alt={center.name} className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-600 bg-gray-50" />
                ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800">
                        <OfficeBuildingIcon className="w-6 h-6" />
                    </div>
                )}
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 min-h-[2.5em]">{center.description || 'لا يوجد وصف'}</p>
            
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-2">
                    <UsersIcon className="w-4 h-4 text-gray-400" />
                    <span>المستخدمين: <span className="font-semibold">{center.max_users}</span></span>
                </div>
                <div className="flex items-center gap-2">
                    <OfficeBuildingIcon className="w-4 h-4 text-gray-400" />
                    <span className="truncate" title={center.address}>{center.address}</span>
                </div>
            </div>
        </div>
        <div className="bg-gray-50 dark:bg-slate-700/50 px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1" title="تاريخ انتهاء الاشتراك">
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>ينتهي: {new Date(center.subscription_end).toLocaleDateString('ar-EG')}</span>
            </div>
        </div>
    </div>
);

const DashboardApplicationManager: React.FC<DashboardApplicationManagerProps> = ({ user, refreshTrigger }) => {
    const queryClient = useQueryClient();
    const [editingCenter, setEditingCenter] = useState<Center | null>(null);

    const { data: centers, isLoading, error } = useQuery({
        queryKey: ['allCenters', refreshTrigger],
        queryFn: api.centers.getAll,
    });

    const updateCenterMutation = useMutation({
        mutationFn: (updatedData: Partial<Center>) => api.centers.update(updatedData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allCenters'] });
        },
    });

    if (isLoading) {
        return <CenteredLoadingSpinner />;
    }

    if (error) {
        return <p className="text-center text-red-500">حدث خطأ أثناء تحميل بيانات المراكز.</p>;
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">إدارة المراكز</h1>
            {centers && centers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {centers.map(center => (
                        <CenterCard key={center.id} center={center} onEdit={setEditingCenter} />
                    ))}
                </div>
            ) : (
                <p className="text-center text-gray-500 dark:text-gray-400">لا توجد مراكز لعرضها.</p>
            )}

            {editingCenter && (
                <EditCenterModal 
                    center={editingCenter} 
                    onClose={() => setEditingCenter(null)} 
                    onSave={async (data) => {
                        await updateCenterMutation.mutateAsync(data);
                    }}
                />
            )}
        </div>
    );
};

export default DashboardApplicationManager;