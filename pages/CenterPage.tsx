import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useAppSettings } from '../hooks/useAppSettings';
import { CenteredLoadingSpinner } from '../components/LoadingSpinner';
import { Center } from '../types';
import { OfficeBuildingIcon, UsersIcon, CalendarIcon, DocumentTextIcon, BeakerIcon, PencilIcon, CameraIcon, TrashIcon, XIcon, CheckIcon } from '../components/Icons';
import LoadingSpinner from '../components/LoadingSpinner';

const InfoCard: React.FC<{ label: string; value: string | number | null; icon?: React.ElementType }> = ({ label, value, icon: Icon }) => (
    <div className="group relative w-full p-5 rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/60 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md h-full flex flex-col justify-center">
        <div className="absolute top-1/2 -translate-y-1/2 right-0 h-10 w-1 bg-gradient-to-b from-transparent via-primary-300 to-transparent rounded-l-full opacity-50 group-hover:opacity-100 group-hover:h-12 transition-all duration-500"></div>
        <div className="relative z-10 flex items-start gap-4">
            {Icon && (
                <div className="flex-shrink-0 p-3 rounded-2xl bg-gray-50 dark:bg-slate-900/50 text-primary-600 dark:text-primary-400 shadow-inner">
                    <Icon className="h-6 w-6" />
                </div>
            )}
            <div className="flex-grow">
                <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">{label}</h3>
                <p className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100 break-words">{value || 'غير متوفر'}</p>
            </div>
        </div>
    </div>
);

const EditCard: React.FC<{ label: string; children: React.ReactNode; icon?: React.ElementType; className?: string }> = ({ label, children, icon: Icon, className }) => (
    <div className={`bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md ${className}`}>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            {Icon && <Icon className="h-5 w-5" />}
            <span>{label}</span>
        </label>
        {children}
    </div>
);

const CenterPage: React.FC<{ refreshTrigger: number }> = ({ refreshTrigger }) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { setAppName, setAppLogo } = useAppSettings();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<Center>>({});
    const [newLogoFile, setNewLogoFile] = useState<File | null>(null);
    const [newLogoPreview, setNewLogoPreview] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    
    const { data: center, isLoading, error } = useQuery({
        queryKey: ['center', user?.center_id, refreshTrigger],
        queryFn: () => api.centers.getOne(),
        enabled: !!user?.center_id,
    });

    useEffect(() => {
        if (center) {
            setFormData(center);
        }
    }, [center]);
    
    const handleEditToggle = () => {
        if (isEditing) {
            setNewLogoFile(null);
            setNewLogoPreview(null);
            if (center) setFormData(center);
        }
        setIsEditing(!isEditing);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setNewLogoFile(file);
            setNewLogoPreview(URL.createObjectURL(file));
        }
    };
    
  const handleSave = async () => {
    if (!center) return;
    setIsSaving(true);

    try {
        const changedData: Partial<Omit<Center, 'id' | 'logo_url' | 'created_at'>> = {};
        let dataHasChanged = false;

        (Object.keys(formData) as Array<keyof typeof formData>).forEach(key => {
            if (key !== 'id' && key !== 'logo_url' && key !== 'created_at' && formData[key] !== center[key]) {
                (changedData as any)[key] = formData[key];
                dataHasChanged = true;
            }
        });

        // أولاً تعديل البيانات العادية إذا في تغييرات
        if (dataHasChanged) {
            await api.centers.update(changedData);
        }

        // ثانياً رفع الصورة إذا موجودة
        if (newLogoFile) {
            const uploadResponse = await api.centers.uploadPhoto(newLogoFile);
            if (uploadResponse.logo_url) {
                // نجاح رفع الصورة => خروج من وضع التعديل
                setIsEditing(false);
                setNewLogoFile(null);
                setNewLogoPreview(null);
            }
        }

        // تحديث البيانات بعد أي تعديل
        await queryClient.invalidateQueries({ queryKey: ['center', user?.center_id] });

        // إذا ما في صورة، نطلع من وضع التعديل بعد تحديث البيانات
        if (!newLogoFile) setIsEditing(false);

    } catch (err) {
        alert(`فشل حفظ التعديلات: ${err instanceof Error ? err.message : 'خطأ غير متوقع'}`);
    } finally {
        setIsSaving(false);
    }
};


    
    const handleDeletePhoto = async () => {
        setIsDeletingPhoto(true);
        try {
            const updatedCenter = await api.centers.deletePhoto();
            setAppLogo(updatedCenter.logo_url);
            await queryClient.invalidateQueries({ queryKey: ['center', user?.center_id] });
            setShowDeleteConfirm(false);
        } catch (err) {
             alert(`فشل حذف الصورة: ${err instanceof Error ? err.message : 'خطأ غير متوقع'}`);
        } finally {
            setIsDeletingPhoto(false);
        }
    };

    if (isLoading) return <CenteredLoadingSpinner />;
    if (error) return <div className="text-center p-8 text-red-500">حدث خطأ أثناء جلب بيانات المركز.</div>;
    if (!center) return <div className="text-center p-8">لم يتم العثور على بيانات المركز.</div>;

    const inputStyle = "w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black dark:text-white";

    return (
       <div className="max-w-5xl mx-auto">
            <div className="flex flex-col items-center md:flex-row md:justify-between md:items-start mb-8">
                 <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-right">
                    <div className="flex-shrink-0 relative group">
                        <img src={newLogoPreview || center.logo_url} alt="شعار المركز" className="h-24 w-24 rounded-full object-cover border-4 border-primary-200 dark:border-primary-700 shadow-lg" />
                        {isEditing && (
                            <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-white/80 rounded-full text-blue-600 hover:bg-white" title="تغيير الصورة">
                                    <CameraIcon className="h-6 w-6" />
                                </button>
                                 <button onClick={() => setShowDeleteConfirm(true)} className="p-2 bg-white/80 rounded-full text-red-600 hover:bg-white" title="حذف الصورة">
                                    <TrashIcon className="h-6 w-6" />
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                            </div>
                        )}
                    </div>
                    <div className="flex-grow">
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">{isEditing ? 'تعديل بيانات المركز' : center.name}</h1>
                    </div>
                </div>
                 <div className="flex gap-2 mt-4 md:mt-0">
                    {isEditing ? (
                        <>
                            <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-green-600 rounded-lg shadow-sm hover:bg-green-700 transition-colors disabled:bg-green-300">
                                {isSaving ? <LoadingSpinner className="h-5 w-5" /> : <CheckIcon className="h-5 w-5" />}
                                <span>حفظ</span>
                            </button>
                             <button onClick={handleEditToggle} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 font-semibold text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-slate-600 rounded-lg shadow-sm hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors">
                                <XIcon className="h-5 w-5" />
                                <span>إلغاء</span>
                            </button>
                        </>
                    ) : (
                        <button onClick={handleEditToggle} className="flex items-center gap-2 px-4 py-2 font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40 rounded-lg shadow-sm hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors">
                            <PencilIcon className="h-5 w-5" />
                            <span>تعديل</span>
                        </button>
                    )}
                </div>
            </div>

            {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <EditCard label="اسم المركز" icon={DocumentTextIcon} className="md:col-span-2">
                        <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className={inputStyle} />
                    </EditCard>
                     <EditCard label="الوصف" icon={DocumentTextIcon} className="md:col-span-2">
                        <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={3} className={inputStyle}></textarea>
                    </EditCard>
                    <EditCard label="العنوان" icon={OfficeBuildingIcon} className="md:col-span-2">
                        <input type="text" name="address" value={formData.address || ''} onChange={handleChange} className={inputStyle} />
                    </EditCard>
                    <EditCard label="نوع المركز" icon={BeakerIcon}>
                        <input type="text" name="type" value={formData.type || ''} onChange={handleChange} className={inputStyle} />
                    </EditCard>
                    <InfoCard label="الحد الأقصى للمستخدمين" value={center.max_users} icon={UsersIcon} />
                    <InfoCard label="بداية الاشتراك" value={new Date(center.subscription_start).toLocaleDateString('ar-EG')} icon={CalendarIcon} />
                    <InfoCard label="نهاية الاشتراك" value={new Date(center.subscription_end).toLocaleDateString('ar-EG')} icon={CalendarIcon} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <InfoCard label="الوصف" value={center.description} icon={DocumentTextIcon} />
                    </div>
                     <div className="md:col-span-2">
                        <InfoCard label="العنوان" value={center.address} icon={OfficeBuildingIcon} />
                    </div>
                    <InfoCard label="نوع المركز" value={center.type} icon={BeakerIcon} />
                    <InfoCard label="الحد الأقصى للمستخدمين" value={center.max_users} icon={UsersIcon} />
                    <InfoCard label="بداية الاشتراك" value={new Date(center.subscription_start).toLocaleDateString('ar-EG')} icon={CalendarIcon} />
                    <InfoCard label="نهاية الاشتراك" value={new Date(center.subscription_end).toLocaleDateString('ar-EG')} icon={CalendarIcon} />
                </div>
            )}
            
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 transition-opacity" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm transform transition-all" role="dialog" onClick={e => e.stopPropagation()}>
                        <div className="p-6 text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30">
                                <TrashIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-4">حذف الصورة</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">هل أنت متأكد من حذف صورة شعار المركز؟</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-slate-700/50 px-6 py-4 rounded-b-2xl flex justify-center gap-4">
                            <button onClick={handleDeletePhoto} disabled={isDeletingPhoto} className="w-full rounded-md px-4 py-2 bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400">
                                {isDeletingPhoto ? 'جاري الحذف...' : 'نعم، حذف'}
                            </button>
                            <button onClick={() => setShowDeleteConfirm(false)} disabled={isDeletingPhoto} className="w-full rounded-md px-4 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500">
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CenterPage;
