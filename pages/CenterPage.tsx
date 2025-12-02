
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useAppSettings } from '../hooks/useAppSettings';
import { CenteredLoadingSpinner } from '../components/LoadingSpinner';
import { Center } from '../types';
import { OfficeBuildingIcon, UsersIcon, CalendarIcon, DocumentTextIcon, BeakerIcon, PencilIcon, CameraIcon, TrashIcon, XIcon, CheckIcon, ChevronDownIcon, SearchIcon } from '../components/Icons';
import LoadingSpinner from '../components/LoadingSpinner';

const CLINIC_TYPES = [
    "باطنة",
    "أطفال",
    "نساء وتوليد",
    "جراحة عامة",
    "تجميل",
    "عيون",
    "أنف وأذن وحنجرة",
    "أسنان",
    "جلدية",
    "أعصاب",
    "قلب",
    "غدد صماء",
    "باطنية أطفال",
    "مسالك بولية",
    "عظام",
    "تخدير",
    "نفسي",
    "تغذية",
    "علاج فيزيائي",
    "علاج طبيعي"
];

// Liquid Glass Card Component
const InfoCard: React.FC<{ label: string; value: string | number | null; icon?: React.ElementType }> = ({ label, value, icon: Icon }) => (
    <div className="group relative w-full p-6 rounded-3xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:bg-white/60 dark:hover:bg-slate-800/60">
        
        {/* Liquid Decoration */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-primary-400/20 to-secondary-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
        
        <div className="relative z-10 flex items-start gap-5">
            {Icon && (
                <div className="flex-shrink-0 p-3.5 rounded-2xl bg-gradient-to-br from-white/80 to-white/40 dark:from-slate-700/80 dark:to-slate-700/40 shadow-inner text-primary-600 dark:text-primary-400 ring-1 ring-white/50">
                    <Icon className="h-6 w-6" />
                </div>
            )}
            <div className="flex-grow">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">{label}</h3>
                <p className="text-xl font-bold text-gray-900 dark:text-white break-words drop-shadow-sm">{value || 'غير متوفر'}</p>
            </div>
        </div>
    </div>
);

const EditCard: React.FC<{ label: string; children: React.ReactNode; icon?: React.ElementType; className?: string }> = ({ label, children, icon: Icon, className }) => (
    <div className={`bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-white/40 dark:border-white/5 p-5 rounded-3xl shadow-sm ${className}`}>
        <label className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300 mb-3">
            {Icon && <Icon className="h-5 w-5 text-primary-500" />}
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
    
    // Dropdown States for Type
    const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
    const [typeSearch, setTypeSearch] = useState('');
    const typeDropdownRef = useRef<HTMLDivElement>(null);
    
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

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
                setIsTypeDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    const handleEditToggle = () => {
        if (isEditing) {
            // Cancel editing
            setNewLogoFile(null);
            setNewLogoPreview(null);
            if (center) setFormData(center);
        } else {
            // Start editing
            setTypeSearch(center?.type || '');
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

        if (dataHasChanged) {
            await api.centers.update(changedData);
        }

        if (newLogoFile) {
            await api.centers.uploadPhoto(newLogoFile);
            setNewLogoFile(null);
            setNewLogoPreview(null);
        }

        await queryClient.invalidateQueries({ queryKey: ['center', user?.center_id] });
        setIsEditing(false); 

    } catch (err) {
        alert(`فشل حفظ التعديلات: ${err instanceof Error ? err.message : 'خطأ غير متوقع'}`);
    } finally {
        setIsSaving(false);
    }
};

    const handleDeletePhoto = async () => {
        setIsDeletingPhoto(true);
        try {
            await api.centers.deletePhoto();
            await queryClient.invalidateQueries({ queryKey: ['center', user?.center_id] });
            
            const updatedCenter = await api.centers.getOne();
            if (updatedCenter) setAppLogo(updatedCenter.logo_url);

            setNewLogoFile(null);
            setNewLogoPreview(null);
            setShowDeleteConfirm(false);
        } catch (err) {
             alert(`فشل حذف الصورة: ${err instanceof Error ? err.message : 'خطأ غير متوقع'}`);
        } finally {
            setIsDeletingPhoto(false);
        }
    };

    const filteredClinicTypes = useMemo(() => {
        return CLINIC_TYPES.filter(t => t.toLowerCase().includes(typeSearch.toLowerCase()));
    }, [typeSearch]);

    if (isLoading) return <CenteredLoadingSpinner />;
    if (error) return <div className="text-center p-8 text-red-500 bg-white/50 backdrop-blur-md rounded-2xl">حدث خطأ أثناء جلب بيانات المركز.</div>;
    if (!center) return <div className="text-center p-8 bg-white/50 backdrop-blur-md rounded-2xl">لم يتم العثور على بيانات المركز.</div>;

    const inputStyle = "w-full px-4 py-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-gray-200 dark:border-gray-600 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent text-gray-900 dark:text-white transition-all";

    return (
       <div className="relative min-h-[80vh] max-w-5xl mx-auto pb-20">
            {/* Background Blobs for Liquid Effect */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-300/20 dark:bg-primary-900/20 rounded-full blur-[100px] transform translate-x-1/3 -translate-y-1/3"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary-300/20 dark:bg-secondary-900/20 rounded-full blur-[100px] transform -translate-x-1/3 translate-y-1/3"></div>
            </div>

            {/* Header Section */}
            <div className="relative bg-white/30 dark:bg-slate-800/30 backdrop-blur-2xl border border-white/40 dark:border-white/5 shadow-2xl rounded-[2.5rem] p-8 mb-10 overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-70"></div>
                 
                 <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 relative z-10">
                     <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-right">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary-400 to-secondary-400 rounded-full blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <img src={newLogoPreview || center.logo_url} alt="شعار المركز" className="relative h-32 w-32 rounded-full object-cover border-4 border-white/50 dark:border-white/10 shadow-lg" />
                            
                            {isEditing && (
                                <div className="absolute inset-0 rounded-full bg-black/60 backdrop-blur-[2px] flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-95 group-hover:scale-100">
                                    <button onClick={() => fileInputRef.current?.click()} className="p-2.5 bg-white rounded-full text-blue-600 hover:scale-110 transition-transform shadow-lg" title="تغيير الصورة">
                                        <CameraIcon className="h-5 w-5" />
                                    </button>
                                     <button onClick={() => setShowDeleteConfirm(true)} className="p-2.5 bg-white rounded-full text-red-600 hover:scale-110 transition-transform shadow-lg" title="حذف الصورة">
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col justify-center">
                            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 drop-shadow-sm mb-2">
                                {isEditing ? 'تعديل المركز' : center.name}
                            </h1>
                            {!isEditing && (
                                <span className="inline-flex self-center md:self-start items-center px-4 py-1.5 rounded-full text-sm font-bold bg-primary-100/50 text-primary-800 dark:bg-primary-900/40 dark:text-primary-200 border border-primary-200/50 dark:border-primary-800/50 shadow-sm backdrop-blur-sm">
                                    {center.type || 'مركز طبي'}
                                </span>
                            )}
                        </div>
                    </div>

                     <div className="flex gap-3 mt-2">
                        {isEditing ? (
                            <>
                                <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 font-bold text-white bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-lg hover:shadow-green-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-50">
                                    {isSaving ? <LoadingSpinner className="h-5 w-5" /> : <CheckIcon className="h-5 w-5" />}
                                    <span>حفظ</span>
                                </button>
                                 <button onClick={handleEditToggle} disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 font-bold text-gray-700 dark:text-gray-200 bg-white/50 dark:bg-slate-700/50 border border-gray-200 dark:border-gray-600 rounded-2xl shadow-sm hover:bg-white dark:hover:bg-slate-600 transition-all">
                                    <XIcon className="h-5 w-5" />
                                    <span>إلغاء</span>
                                </button>
                            </>
                        ) : (
                            <button onClick={handleEditToggle} className="flex items-center gap-2 px-6 py-2.5 font-bold text-primary-700 dark:text-primary-300 bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-white/10 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all">
                                <PencilIcon className="h-5 w-5" />
                                <span>تعديل</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Section */}
            {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
                    <EditCard label="اسم المركز" icon={DocumentTextIcon} className="md:col-span-2">
                        <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className={inputStyle} />
                    </EditCard>
                     <EditCard label="الوصف" icon={DocumentTextIcon} className="md:col-span-2">
                        <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={3} className={inputStyle}></textarea>
                    </EditCard>
                    <EditCard label="العنوان" icon={OfficeBuildingIcon} className="md:col-span-2">
                        <input type="text" name="address" value={formData.address || ''} onChange={handleChange} className={inputStyle} />
                    </EditCard>
                    <EditCard label="نوع المركز" icon={BeakerIcon} className="relative z-20">
                        <div ref={typeDropdownRef} className="relative">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={typeSearch}
                                    onChange={(e) => {
                                        setTypeSearch(e.target.value);
                                        setFormData(prev => ({ ...prev, type: e.target.value }));
                                        setIsTypeDropdownOpen(true);
                                    }}
                                    onFocus={() => {
                                        setTypeSearch('');
                                        setIsTypeDropdownOpen(true);
                                    }}
                                    placeholder="ابحث واختر نوع المركز..."
                                    className={`${inputStyle} pl-10 pr-10`}
                                    autoComplete="off"
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                                </div>
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <SearchIcon className="h-4 w-4 text-gray-400" />
                                </div>
                            </div>
                            
                            {isTypeDropdownOpen && (
                                <ul className="absolute z-50 w-full mt-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-gray-200 dark:border-gray-600 rounded-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar">
                                    {filteredClinicTypes.length > 0 ? (
                                        filteredClinicTypes.map((type) => (
                                            <li
                                                key={type}
                                                className="px-4 py-3 hover:bg-primary-50 dark:hover:bg-primary-900/30 cursor-pointer text-gray-800 dark:text-gray-200 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-none font-medium"
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, type: type }));
                                                    setTypeSearch(type);
                                                    setIsTypeDropdownOpen(false);
                                                }}
                                            >
                                                {type}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm text-center">لا توجد نتائج</li>
                                    )}
                                </ul>
                            )}
                        </div>
                    </EditCard>
                    <InfoCard label="الحد الأقصى للمستخدمين" value={center.max_users} icon={UsersIcon} />
                    <InfoCard label="بداية الاشتراك" value={new Date(center.subscription_start).toLocaleDateString('ar-EG')} icon={CalendarIcon} />
                    <InfoCard label="نهاية الاشتراك" value={new Date(center.subscription_end).toLocaleDateString('ar-EG')} icon={CalendarIcon} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
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
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-2xl rounded-3xl shadow-2xl w-full max-w-sm border border-white/20 dark:border-white/10 transform transition-all scale-100" role="dialog" onClick={e => e.stopPropagation()}>
                        <div className="p-8 text-center">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-6 shadow-inner">
                                <TrashIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">حذف الصورة</h3>
                            <p className="text-gray-500 dark:text-gray-300 mb-6">هل أنت متأكد من حذف صورة شعار المركز؟</p>
                            
                            <div className="flex gap-3">
                                <button onClick={handleDeletePhoto} disabled={isDeletingPhoto} className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 bg-red-600 text-white font-bold shadow-lg shadow-red-500/30 hover:bg-red-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0">
                                    {isDeletingPhoto ? (
                                        <>
                                            <LoadingSpinner className="h-5 w-5" />
                                            <span>جاري الحذف...</span>
                                        </>
                                    ) : (
                                        'نعم، حذف'
                                    )}
                                </button>
                                <button onClick={() => setShowDeleteConfirm(false)} disabled={isDeletingPhoto} className="flex-1 rounded-xl px-4 py-3 bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                    إلغاء
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CenterPage;
