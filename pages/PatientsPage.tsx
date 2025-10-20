import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { User, Patient, UserRole, Session, SessionTreatment, Treatment, Payment, Gender, PatientPhoto, ActivityLog, ActivityLogActionType } from '../types';
import { api } from '../services/api';
import { PlusIcon, PencilIcon, TrashIcon, XIcon, ClipboardListIcon, BeakerIcon, ArrowBackIcon, EyeIcon, CurrencyDollarIcon, CheckIcon, SearchIcon, PhotographIcon, ListBulletIcon } from '../components/Icons';
import LoadingSpinner, { CenteredLoadingSpinner } from '../components/LoadingSpinner';

// ===================================================================
// AddEditPhotoModal Component
// ===================================================================
interface AddEditPhotoModalProps {
    photo?: PatientPhoto;
    patientId: string;
    onSave: (data: Omit<PatientPhoto, 'id'> | PatientPhoto) => Promise<void>;
    onClose: () => void;
}

const AddEditPhotoModal: React.FC<AddEditPhotoModalProps> = ({ photo, patientId, onSave, onClose }) => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(photo?.imageUrl || null);
    const [caption, setCaption] = useState(photo?.caption || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const isEditMode = !!photo;
    const inputStyle = "w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black dark:text-white";

    const fileToBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });

    const handleFileSelect = (file: File) => {
        if (file && file.type.startsWith('image/')) {
            setImageFile(file);
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
        } else {
            alert('الرجاء اختيار ملف صورة صالح.');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };
    
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageFile && !isEditMode) {
            alert('يرجى رفع صورة.');
            return;
        }
        setIsSaving(true);
        
        let imageUrl = photo?.imageUrl || '';
        if (imageFile) {
            imageUrl = await fileToBase64(imageFile);
        }

        const dataToSave = {
            patientId: patientId,
            imageUrl: imageUrl,
            caption: caption,
            date: new Date().toISOString().split('T')[0],
        };

        if (isEditMode) {
            await onSave({ ...photo, ...dataToSave });
        } else {
            await onSave(dataToSave);
        }
        setIsSaving(false);
    };
    
    const dropzoneClasses = `w-full h-48 border-2 border-dashed rounded-lg flex flex-col justify-center items-center cursor-pointer transition-colors ${isDragging ? 'border-primary bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-primary'}`;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md" role="dialog" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{isEditMode ? 'تعديل الصورة' : 'إضافة صورة جديدة'}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الصورة</label>
                            <div 
                                className={dropzoneClasses}
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                                {imagePreview ? (
                                    <img src={imagePreview} alt="معاينة الصورة" className="max-h-full max-w-full object-contain rounded-md" />
                                ) : (
                                    <div className="text-center text-gray-500 dark:text-gray-400">
                                        <PhotographIcon className="h-12 w-12 mx-auto" />
                                        <p>اسحب وأفلت الصورة هنا، أو انقر للاختيار</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="caption" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تعليق</label>
                            <textarea id="caption" name="caption" value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} className={inputStyle} placeholder="أضف تعليقًا وصفيًا..."></textarea>
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
// ImageViewerModal Component
// ===================================================================
interface ImageViewerModalProps {
    imageUrl: string;
    onClose: () => void;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ imageUrl, onClose }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startDrag, setStartDrag] = useState({ x: 0, y: 0 });
    const imageRef = useRef<HTMLImageElement>(null);

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const newScale = e.deltaY > 0 ? scale / 1.1 : scale * 1.1;
        setScale(Math.min(Math.max(0.5, newScale), 5));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        e.preventDefault();
        setIsDragging(true);
        setStartDrag({
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        setPosition({
            x: e.clientX - startDrag.x,
            y: e.clientY - startDrag.y,
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const reset = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };
    
    const zoomIn = () => setScale(s => Math.min(s * 1.2, 5));
    const zoomOut = () => setScale(s => Math.max(s / 1.2, 0.5));
    
    const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
    const MinusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" /></svg>;
    const ResetIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-11.664 0l-3.181-3.183a8.25 8.25 0 0111.664 0l3.181 3.183" /></svg>;
    const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-80 z-[100] flex justify-center items-center" 
            onClick={onClose}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            <div 
                className="relative w-full h-full flex justify-center items-center overflow-hidden"
                onWheel={handleWheel}
                onClick={e => e.stopPropagation()}
            >
                <img
                    ref={imageRef}
                    src={imageUrl}
                    alt="Full screen view"
                    className="max-w-none max-h-none transition-transform duration-100"
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        cursor: isDragging ? 'grabbing' : 'grab',
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseUp}
                />
            </div>
            
            <div className="absolute top-4 right-4 flex flex-col gap-2">
                 <button onClick={onClose} className="p-2 bg-gray-800 bg-opacity-50 text-white rounded-full hover:bg-opacity-75 focus:outline-none">
                    <CloseIcon />
                </button>
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-gray-800 bg-opacity-50 text-white rounded-full">
                <button onClick={zoomOut} className="p-2 hover:bg-gray-700 rounded-full focus:outline-none"><MinusIcon /></button>
                <button onClick={reset} className="p-2 hover:bg-gray-700 rounded-full focus:outline-none"><ResetIcon /></button>
                <button onClick={zoomIn} className="p-2 hover:bg-gray-700 rounded-full focus:outline-none"><PlusIcon /></button>
            </div>
        </div>
    );
};

// ===================================================================
// PatientGalleryPage Component
// ===================================================================
interface PatientGalleryPageProps {
    patient: Patient;
    onBack: () => void;
}

const PatientGalleryPage: React.FC<PatientGalleryPageProps> = ({ patient, onBack }) => {
    const [photos, setPhotos] = useState<PatientPhoto[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingPhoto, setEditingPhoto] = useState<PatientPhoto | null>(null);
    const [deletingPhoto, setDeletingPhoto] = useState<PatientPhoto | null>(null);
    const [viewingPhotoUrl, setViewingPhotoUrl] = useState<string | null>(null);

    const fetchPhotos = useCallback(async () => {
        setLoading(true);
        const allPhotos = await api.patientPhotos.getAll();
        setPhotos(allPhotos.filter(p => p.patientId === patient.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setLoading(false);
    }, [patient.id]);

    useEffect(() => {
        fetchPhotos();
    }, [fetchPhotos]);

    const handleSavePhoto = async (data: Omit<PatientPhoto, 'id'> | PatientPhoto) => {
        if ('id' in data) {
            await api.patientPhotos.update(data.id, data);
        } else {
            await api.patientPhotos.create(data);
        }
        setIsAdding(false);
        setEditingPhoto(null);
        await fetchPhotos();
    };

    const confirmDeletePhoto = async () => {
        if (deletingPhoto) {
            await api.patientPhotos.delete(deletingPhoto.id);
            setDeletingPhoto(null);
            await fetchPhotos();
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                        <ArrowBackIcon className="h-5 w-5" />
                        <span>العودة</span>
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">معرض صور المريض</h1>
                        <p className="text-gray-500 dark:text-gray-400">{patient.name}</p>
                    </div>
                </div>
                <button onClick={() => setIsAdding(true)} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700 transition-colors">
                    <PlusIcon className="h-5 w-5 ml-2" />
                    إضافة صورة
                </button>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md min-h-[200px]">
                {loading ? <CenteredLoadingSpinner /> : photos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {photos.map(photo => (
                            <div key={photo.id} className="border bg-gray-50 dark:bg-gray-800 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-shadow">
                                <img src={photo.imageUrl} alt={photo.caption} className="w-full h-48 object-cover cursor-pointer" onClick={() => setViewingPhotoUrl(photo.imageUrl)} />
                                <div className="p-4">
                                    <p className="font-semibold text-gray-800 dark:text-gray-100">{photo.caption || "بدون تعليق"}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(photo.date).toLocaleDateString()}</p>
                                    <div className="mt-4 flex justify-end gap-2">
                                        <button onClick={() => setEditingPhoto(photo)} className="p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400" title="تعديل"><PencilIcon className="h-5 w-5" /></button>
                                        <button onClick={() => setDeletingPhoto(photo)} className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400" title="حذف"><TrashIcon className="h-5 w-5" /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <PhotographIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">لا توجد صور</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">ابدأ بإضافة أول صورة لهذا المريض.</p>
                    </div>
                )}
            </div>

            {(isAdding || editingPhoto) && (
                <AddEditPhotoModal 
                    key={editingPhoto?.id || 'add'}
                    photo={editingPhoto || undefined}
                    patientId={patient.id}
                    onClose={() => { setIsAdding(false); setEditingPhoto(null); }} 
                    onSave={handleSavePhoto}
                />
            )}

            {deletingPhoto && (
                <ConfirmDeleteModal
                    title="حذف الصورة"
                    message="هل أنت متأكد من رغبتك في حذف هذه الصورة؟ لا يمكن التراجع عن هذا الإجراء."
                    onConfirm={confirmDeletePhoto}
                    onCancel={() => setDeletingPhoto(null)}
                />
            )}
            
            {viewingPhotoUrl && (
                <ImageViewerModal 
                    imageUrl={viewingPhotoUrl}
                    onClose={() => setViewingPhotoUrl(null)}
                />
            )}
        </div>
    );
};


// ===================================================================
// PatientDetailsPage Component
// ===================================================================
interface PatientDetailsPageProps {
    patient: Patient;
    onBack: () => void;
}

const DetailItem: React.FC<{ label: string; value?: string | number | null; children?: React.ReactNode }> = ({ label, value, children }) => (
    <div className="py-3 sm:py-4">
        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
        <dd className="mt-1 text-lg text-gray-900 dark:text-gray-100 sm:mt-0">{children || value || <span className="text-gray-400 dark:text-gray-500">لا يوجد</span>}</dd>
    </div>
);

const PatientDetailsPage: React.FC<PatientDetailsPageProps> = ({ patient, onBack }) => {
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                        <ArrowBackIcon className="h-5 w-5" />
                        <span>العودة</span>
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">تفاصيل المريض</h1>
                        <p className="text-gray-500 dark:text-gray-400">{patient.name}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 shadow-md rounded-xl overflow-hidden">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-xl leading-6 font-bold text-gray-900 dark:text-gray-100">
                        {patient.name}
                        <span className="ml-3 inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300">{patient.code}</span>
                    </h3>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-0">
                    <dl className="sm:divide-y sm:divide-gray-200 dark:sm:divide-gray-700">
                        <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"> <DetailItem label="العمر" value={patient.age} /> </div>
                        <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"> <DetailItem label="الهاتف" value={patient.phone} /> </div>
                        <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"> <DetailItem label="الجنس" value={patient.gender === Gender.Female ? 'أنثى' : 'ذكر'} /> </div>
                        <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <DetailItem label="الحالة الاجتماعية/الصحية">
                                <div className="flex items-center space-x-4">
                                    {patient.isSmoker && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">مدخن</span>}
                                    {patient.isPregnant && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300">حامل</span>}
                                    {!patient.isSmoker && !patient.isPregnant && <span className="text-gray-400 dark:text-gray-500">لا يوجد</span>}
                                </div>
                            </DetailItem>
                        </div>
                        <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"> <DetailItem label="الحساسية الدوائية" value={patient.drugAllergy} /> </div>
                        <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"> <DetailItem label="الأمراض المزمنة" value={patient.chronicDiseases} /> </div>
                        <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"> <DetailItem label="ملاحظات عامة" value={patient.notes} /> </div>
                    </dl>
                </div>
            </div>
        </div>
    );
};

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
// EditSessionModal Component
// ===================================================================
interface EditSessionModalProps {
    session: Session;
    onSave: (updatedSession: Session) => Promise<void>;
    onClose: () => void;
}

const EditSessionModal: React.FC<EditSessionModalProps> = ({ session, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        date: new Date(session.date).toISOString().split('T')[0],
        notes: session.notes,
    });
    const [isSaving, setIsSaving] = useState(false);
    const inputStyle = "w-full px-3 py-2 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-black dark:text-white bg-white dark:bg-gray-700";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const updatedSessionData = {
            ...session,
            date: new Date(formData.date).toISOString(),
            notes: formData.notes,
        };
        await onSave(updatedSessionData);
        setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md" role="dialog" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">تعديل الجلسة</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاريخ الجلسة</label>
                            <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required className={inputStyle} />
                        </div>
                        <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ملاحظات</label>
                            <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={4} className={inputStyle}></textarea>
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
// ViewTreatmentDetailsModal Component
// ===================================================================
interface ViewTreatmentDetailsModalProps {
    treatment: SessionTreatment;
    onClose: () => void;
}

const ViewTreatmentDetailsModal: React.FC<ViewTreatmentDetailsModalProps> = ({ treatment, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md" role="dialog" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">تفاصيل العلاج</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" /></button>
                </div>
                <div className="p-6 space-y-3 divide-y divide-gray-200 dark:divide-gray-700">
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">اسم العلاج</p>
                        <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">{treatment.name}</p>
                    </div>
                    {treatment.treatmentDate && (
                        <div className="pt-3">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">تاريخ العلاج</p>
                            <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">{new Date(treatment.treatmentDate).toLocaleDateString()}</p>
                        </div>
                    )}
                    <div className="pt-3 grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">السعر</p>
                            <p className="text-lg font-semibold text-green-600 dark:text-green-400">${treatment.sessionPrice.toFixed(2)}</p>
                        </div>
                         {treatment.additionalCosts && treatment.additionalCosts > 0 && (
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">تكاليف إضافية</p>
                                <p className="text-lg font-semibold text-green-600 dark:text-green-400">${treatment.additionalCosts.toFixed(2)}</p>
                            </div>
                         )}
                    </div>
                    {treatment.sessionNotes && (
                         <div className="pt-3">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">ملاحظات الجلسة</p>
                            <p className="text-md text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{treatment.sessionNotes}</p>
                        </div>
                    )}
                     {treatment.notes && (
                         <div className="pt-3">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">ملاحظات عامة</p>
                            <p className="text-md text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{treatment.notes}</p>
                        </div>
                    )}
                </div>
                <div className="flex justify-end items-center p-4 bg-gray-50 dark:bg-slate-700/50 border-t dark:border-gray-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-primary border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-700">إغلاق</button>
                </div>
            </div>
        </div>
    );
};


// ===================================================================
// AddSessionModal Component
// ===================================================================
interface AddSessionModalProps {
    onSave: (newSession: Omit<Session, 'id' | 'treatments'>) => Promise<void>;
    onClose: () => void;
    patientId: string;
    doctorId: string;
}

const AddSessionModal: React.FC<AddSessionModalProps> = ({ onSave, onClose, patientId, doctorId }) => {
    const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], notes: '' });
    const [isSaving, setIsSaving] = useState(false);
    const inputStyle = "w-full px-3 py-2 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-black dark:text-white bg-white dark:bg-gray-700";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.date) { alert('يرجى تحديد تاريخ الجلسة.'); return; }
        setIsSaving(true);
        await onSave({ date: new Date(formData.date).toISOString(), notes: formData.notes, patientId, doctorId });
        setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md" role="dialog" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700"><h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">إضافة جلسة جديدة</h2><button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" /></button></div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div><label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاريخ الجلسة</label><input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required className={inputStyle} /></div>
                        <div><label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ملاحظات</label><textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={4} className={inputStyle}></textarea></div>
                    </div>
                    <div className="flex justify-end items-center p-4 bg-gray-50 dark:bg-slate-700/50 border-t dark:border-gray-700"><button type="button" onClick={onClose} className="px-4 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500">إلغاء</button><button type="submit" disabled={isSaving} className="px-4 py-2 bg-primary border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-700 disabled:bg-primary-300 mr-2">{isSaving ? 'جاري الحفظ...' : 'حفظ'}</button></div>
                </form>
            </div>
        </div>
    );
};


// ===================================================================
// AddTreatmentToSessionModal Component
// ===================================================================
interface AddTreatmentToSessionModalProps {
    session: Session;
    onSave: (keepOpen?: boolean) => Promise<void>;
    onClose: () => void;
}

const AddTreatmentToSessionModal: React.FC<AddTreatmentToSessionModalProps> = ({ session, onSave, onClose }) => {
    const [allTreatments, setAllTreatments] = useState<Treatment[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTreatmentId, setSelectedTreatmentId] = useState('');
    const [sessionPrice, setSessionPrice] = useState('');
    const [sessionNotes, setSessionNotes] = useState('');
    const [treatmentDate, setTreatmentDate] = useState(new Date().toISOString().split('T')[0]);
    const [additionalCosts, setAdditionalCosts] = useState('');
    const [isSaving, setIsSaving] = useState(false); // For "save and close"
    const [isSavingAndAdding, setIsSavingAndAdding] = useState(false); // For "save and add"
    const inputStyle = "w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black dark:text-white";

    useEffect(() => {
        const fetchTreatments = async () => {
            setLoading(true);
            const availableTreatments = await api.treatmentSettings.getAll();
            const sessionTreatmentNames = new Set(session.treatments.map(t => t.name));
            setAllTreatments(availableTreatments.filter(t => !sessionTreatmentNames.has(t.name)));
            setLoading(false);
        };
        fetchTreatments();
    }, [session.treatments]);
    
    useEffect(() => {
        const numbers = sessionNotes.match(/\d+(\.\d+)?/g);
        if (numbers) {
            const sum = numbers.reduce((total, num) => total + parseFloat(num), 0);
            setAdditionalCosts(sum > 0 ? sum.toFixed(2) : '');
        } else {
            setAdditionalCosts('');
        }
    }, [sessionNotes]);

    const handleTreatmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setSelectedTreatmentId(id);
        const treatment = allTreatments.find(t => t.id === id);
        if (treatment) { setSessionPrice(treatment.price.toString()); } else { setSessionPrice(''); }
    };

    const resetForm = useCallback(() => {
        setSelectedTreatmentId('');
        setSessionPrice('');
        setSessionNotes('');
        setTreatmentDate(new Date().toISOString().split('T')[0]);
        setAdditionalCosts('');
        document.getElementById('treatment')?.focus();
    }, []);

    const handleSave = async (closeAfterSave: boolean) => {
        const treatment = allTreatments.find(t => t.id === selectedTreatmentId);
        if (!treatment) {
            alert("الرجاء اختيار علاج.");
            return;
        }
        
        const spinnerStateSetter = closeAfterSave ? setIsSaving : setIsSavingAndAdding;
        spinnerStateSetter(true);
        
        try {
            await api.sessionTreatments.create({
                session_id: session.id,
                treatment_name: treatment.name,
                treatment_price: parseFloat(sessionPrice) || 0,
                treatment_notes: sessionNotes,
                treatment_date: treatmentDate,
                completed: false,
                additional_costs: parseFloat(additionalCosts) || undefined,
            });

            await onSave(!closeAfterSave);

            if (!closeAfterSave) {
                resetForm();
            }
        } catch (error) {
            console.error("Failed to save treatment:", error);
            alert(`فشل في حفظ العلاج: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            spinnerStateSetter(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSave(true);
    };

    const handleSaveAndAddAnother = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        handleSave(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md" role="dialog" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700"><h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">إضافة علاج للجلسة</h2><button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" /></button></div>
                {loading ? <div className="p-6 flex justify-center items-center h-48"><LoadingSpinner/></div> : (
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="treatment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اختر علاج</label>
                            <select id="treatment" value={selectedTreatmentId} onChange={handleTreatmentChange} required className={inputStyle}>
                                <option value="">-- اختر علاج --</option>
                                {allTreatments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        {selectedTreatmentId && (
                            <>
                                <div>
                                    <label htmlFor="treatmentDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاريخ العلاج</label>
                                    <input type="date" id="treatmentDate" value={treatmentDate} onChange={e => setTreatmentDate(e.target.value)} required className={inputStyle} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="sessionPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">السعر</label>
                                        <input type="number" step="0.01" id="sessionPrice" value={sessionPrice} onChange={e => setSessionPrice(e.target.value)} required className={inputStyle} />
                                    </div>
                                    <div>
                                        <label htmlFor="additionalCosts" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تكاليف اضافية</label>
                                        <input type="number" step="0.01" id="additionalCosts" value={additionalCosts} readOnly className={`${inputStyle} bg-gray-100 dark:bg-gray-800 cursor-not-allowed`} placeholder="يتم حسابه من الملاحظات" />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="sessionNotes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ملاحظات</label>
                                    <textarea id="sessionNotes" value={sessionNotes} onChange={e => setSessionNotes(e.target.value)} rows={3} className={inputStyle} placeholder="ملاحظات حول العلاج... سيتم استخلاص الأرقام للتكاليف الإضافية (مثال: 'مادة خاصة 150 ومادة أخرى 50.5')"></textarea>
                                </div>
                            </>
                        )}
                    </div>
                     <div className="flex justify-end items-center p-4 bg-gray-50 dark:bg-slate-700/50 border-t dark:border-gray-700 space-x-2 space-x-reverse">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500">إلغاء</button>
                        <button
                            type="button"
                            onClick={handleSaveAndAddAnother}
                            disabled={isSaving || isSavingAndAdding || !selectedTreatmentId}
                            className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 disabled:bg-green-300"
                        >
                            {isSavingAndAdding ? 'جاري الحفظ...' : 'حفظ واضافة علاج'}
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving || isSavingAndAdding || !selectedTreatmentId}
                            className="px-4 py-2 bg-primary border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-700 disabled:bg-primary-300"
                        >
                            {isSaving ? 'جاري الحفظ...' : 'حفظ وإغلاق'}
                        </button>
                    </div>
                </form>
                )}
            </div>
        </div>
    );
};


// ===================================================================
// EditPatientModal Component
// ===================================================================
interface EditPatientModalProps {
    patient: Patient;
    onSave: (updatedPatient: Patient) => Promise<void>;
    onClose: () => void;
}

const EditPatientModal: React.FC<EditPatientModalProps> = ({ patient, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: patient.name,
        age: patient.age.toString(),
        phone: patient.phone,
        notes: patient.notes,
        gender: patient.gender || Gender.Male,
        isSmoker: patient.isSmoker || false,
        isPregnant: patient.isPregnant || false,
        drugAllergy: patient.drugAllergy || '',
        chronicDiseases: patient.chronicDiseases || '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const inputStyle = "w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black dark:text-white";


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
             if (name === 'gender' && value === Gender.Male) {
                setFormData(prev => ({ ...prev, isPregnant: false }));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const updatedPatientData = {
            ...patient,
            name: formData.name,
            age: parseInt(formData.age, 10) || 0,
            phone: formData.phone,
            notes: formData.notes,
            gender: formData.gender,
            isSmoker: formData.isSmoker,
            isPregnant: formData.gender === Gender.Female ? formData.isPregnant : false,
            drugAllergy: formData.drugAllergy,
            chronicDiseases: formData.chronicDiseases,
        };
        await onSave(updatedPatientData);
        setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg" role="dialog" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">تعديل بيانات المريض</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 max-h-[70vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">كود المريض</label>
                            <p className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-400">{patient.code}</p>
                        </div>
                         <div><label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاسم</label><input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className={inputStyle} /></div>
                         <div><label htmlFor="age" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العمر</label><input type="number" id="age" name="age" value={formData.age} onChange={handleChange} required className={inputStyle} /></div>
                         <div><label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الهاتف</label><input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required className={inputStyle} /></div>
                         <div>
                            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الجنس</label>
                            <select id="gender" name="gender" value={formData.gender} onChange={handleChange} className={inputStyle}>
                                <option value={Gender.Male}>ذكر</option>
                                <option value={Gender.Female}>أنثى</option>
                            </select>
                        </div>
                        <div className="md:col-span-2"><label htmlFor="drugAllergyEdit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الحساسية الدوائية</label><textarea id="drugAllergyEdit" name="drugAllergy" value={formData.drugAllergy} onChange={handleChange} rows={2} className={inputStyle}></textarea></div>
                        <div className="md:col-span-2"><label htmlFor="chronicDiseasesEdit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الأمراض المزمنة</label><textarea id="chronicDiseasesEdit" name="chronicDiseases" value={formData.chronicDiseases} onChange={handleChange} rows={2} className={inputStyle}></textarea></div>
                        <div className="md:col-span-2"><label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ملاحظات عامة</label><textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={2} className={inputStyle}></textarea></div>
                        <div className="md:col-span-2 flex items-center space-x-4 pt-2">
                           <label className="flex items-center cursor-pointer">
                                <input type="checkbox" name="isSmoker" checked={formData.isSmoker} onChange={handleChange} className="h-4 w-4 text-primary rounded border-gray-300 dark:border-gray-500 focus:ring-primary" />
                                <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">مدخن</span>
                            </label>
                            {formData.gender === Gender.Female && (
                                <label className="flex items-center cursor-pointer">
                                    <input type="checkbox" name="isPregnant" checked={formData.isPregnant} onChange={handleChange} className="h-4 w-4 text-primary rounded border-gray-300 dark:border-gray-500 focus:ring-primary" />
                                    <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">حامل</span>
                                </label>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end items-center p-4 bg-gray-50 dark:bg-slate-700/50 border-t dark:border-gray-700 rounded-b-lg space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500">إلغاء</button>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 bg-primary border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-700 disabled:bg-primary-300">{isSaving ? 'جاري الحفظ...' : 'حفظ'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ===================================================================
// EditSessionTreatmentModal Component
// ===================================================================
interface EditSessionTreatmentModalProps {
    treatment: SessionTreatment;
    onSave: (updatedTreatment: Partial<SessionTreatment>) => Promise<void>;
    onClose: () => void;
}

const EditSessionTreatmentModal: React.FC<EditSessionTreatmentModalProps> = ({ treatment, onSave, onClose }) => {
    const [sessionPrice, setSessionPrice] = useState(treatment.sessionPrice.toString());
    const [sessionNotes, setSessionNotes] = useState(treatment.sessionNotes || '');
    const [treatmentDate, setTreatmentDate] = useState(treatment.treatmentDate || new Date().toISOString().split('T')[0]);
    const [additionalCosts, setAdditionalCosts] = useState(treatment.additionalCosts?.toString() || '');
    const [isSaving, setIsSaving] = useState(false);
    const inputStyle = "w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black dark:text-white";

    useEffect(() => {
        const numbers = sessionNotes.match(/\d+(\.\d+)?/g);
        if (numbers) {
            const sum = numbers.reduce((total, num) => total + parseFloat(num), 0);
            setAdditionalCosts(sum > 0 ? sum.toFixed(2) : '');
        } else {
            setAdditionalCosts('');
        }
    }, [sessionNotes]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave({ 
            sessionPrice: parseFloat(sessionPrice) || 0, 
            sessionNotes: sessionNotes,
            treatmentDate: treatmentDate,
            additionalCosts: parseFloat(additionalCosts) || undefined,
        });
        setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md" role="dialog" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">تعديل علاج الجلسة</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <p className="text-gray-700 dark:text-gray-300"><span className="font-semibold">العلاج:</span> {treatment.name}</p>
                        <div>
                            <label htmlFor="treatmentDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاريخ العلاج</label>
                            <input type="date" id="treatmentDate" value={treatmentDate} onChange={e => setTreatmentDate(e.target.value)} required className={inputStyle} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="sessionPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">السعر</label>
                                <input type="number" step="0.01" id="sessionPrice" value={sessionPrice} onChange={e => setSessionPrice(e.target.value)} required className={inputStyle} />
                            </div>
                            <div>
                                <label htmlFor="additionalCosts" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تكاليف اضافية</label>
                                <input type="number" step="0.01" id="additionalCosts" value={additionalCosts} readOnly className={`${inputStyle} bg-gray-100 dark:bg-gray-800 cursor-not-allowed`} placeholder="يتم حسابه من الملاحظات" />
                            </div>
                        </div>
                         <div>
                            <label htmlFor="sessionNotes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ملاحظات خاصة بالجلسة</label>
                            <textarea id="sessionNotes" name="sessionNotes" value={sessionNotes} onChange={(e) => setSessionNotes(e.target.value)} rows={3} className={inputStyle} placeholder="ملاحظات حول العلاج... سيتم استخلاص الأرقام للتكاليف الإضافية." />
                        </div>
                    </div>
                    <div className="flex justify-end items-center p-4 bg-gray-50 dark:bg-slate-700/50 border-t dark:border-gray-700 rounded-b-lg space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500">إلغاء</button>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 bg-primary border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-700 disabled:bg-primary-300">{isSaving ? 'جاري الحفظ...' : 'حفظ'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ===================================================================
// SessionTreatmentsPage Component
// ===================================================================
interface SessionTreatmentsPageProps {
    session: Session;
    onBack: () => void;
}
const SessionTreatmentsPage: React.FC<SessionTreatmentsPageProps> = ({ session: initialSession, onBack }) => {
    const [session, setSession] = useState<Session>(initialSession);
    const [loading, setLoading] = useState(false);
    const [editingTreatment, setEditingTreatment] = useState<SessionTreatment | null>(null);
    const [viewingTreatment, setViewingTreatment] = useState<SessionTreatment | null>(null);
    const [isAddingTreatment, setIsAddingTreatment] = useState(false);
    const [deletingTreatment, setDeletingTreatment] = useState<SessionTreatment | null>(null);

    const refreshSession = useCallback(async (keepAddModalOpen: boolean = false) => {
        if (!keepAddModalOpen) {
            setIsAddingTreatment(false);
        }
        setLoading(true);
        const freshSession = await api.sessions.getById(session.id);
        if (freshSession) { setSession(freshSession); }
        setLoading(false);
    }, [session.id]);
    
    useEffect(() => { refreshSession(); }, []);

    const handleUpdateTreatment = async (updates: Partial<SessionTreatment>) => {
        if (editingTreatment) {
            await api.sessionTreatments.update(editingTreatment.instanceId, updates);
            setEditingTreatment(null);
            await refreshSession();
        }
    };

    const confirmDeleteTreatment = async () => {
        if (deletingTreatment) {
            await api.sessionTreatments.delete(deletingTreatment.instanceId);
            setDeletingTreatment(null);
            await refreshSession();
        }
    };
    
    const handleToggleCompletion = async (treatment: SessionTreatment) => {
        const newTreatments = session.treatments.map(t =>
            t.instanceId === treatment.instanceId ? { ...t, completed: !t.completed } : t
        );
        setSession(prev => ({ ...prev!, treatments: newTreatments })); // Optimistic update
        await api.sessionTreatments.update(treatment.instanceId, { completed: !treatment.completed });
    };

    return (
        <div>
             <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                        <ArrowBackIcon className="h-5 w-5" />
                        <span>العودة</span>
                    </button>
                    <div><h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">علاجات جلسة</h1><p className="text-gray-500 dark:text-gray-400">{new Date(session.date).toLocaleDateString()}</p></div>
                </div>
                <div>
                    <button onClick={() => setIsAddingTreatment(true)} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700 transition-colors"><PlusIcon className="h-5 w-5 ml-2" />إضافة علاج</button>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md min-h-[200px]">
                 {loading ? <CenteredLoadingSpinner /> : ( session.treatments.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{session.treatments.map(t => (
                            <div key={t.instanceId} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col justify-between hover:shadow-lg">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t.name}</h3>
                                    <p className="text-green-600 dark:text-green-400 font-semibold text-lg mt-2">${t.sessionPrice.toFixed(2)}</p>
                                    {t.sessionNotes && <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 bg-gray-100 dark:bg-gray-700 p-2 rounded-md">{t.sessionNotes}</p>}
                                    <div className="mt-4">
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input type="checkbox" checked={t.completed} onChange={() => handleToggleCompletion(t)} className="h-5 w-5 rounded text-primary focus:ring-primary-500 border-gray-300 dark:border-gray-600"/>
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">مكتمل</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t dark:border-gray-600 flex items-center justify-end space-x-2">
                                    <button onClick={() => setViewingTreatment(t)} className="text-gray-600 dark:text-gray-300 hover:text-primary p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="عرض التفاصيل"><EyeIcon className="h-5 w-5" /></button>
                                    <button onClick={() => setEditingTreatment(t)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40" title="تعديل"><PencilIcon className="h-5 w-5" /></button>
                                    <button onClick={() => setDeletingTreatment(t)} className="text-red-600 dark:text-red-400 hover:text-red-800 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40" title="حذف"><TrashIcon className="h-5 w-5" /></button>
                                </div>
                            </div>))}
                        </div>) : <p className="text-center text-gray-500 dark:text-gray-400 py-8">لا توجد علاجات مسجلة لهذه الجلسة.</p>
                )}
            </div>
            {editingTreatment && <EditSessionTreatmentModal treatment={editingTreatment} onClose={() => setEditingTreatment(null)} onSave={handleUpdateTreatment} />}
            {viewingTreatment && <ViewTreatmentDetailsModal treatment={viewingTreatment} onClose={() => setViewingTreatment(null)} />}
            {isAddingTreatment && <AddTreatmentToSessionModal session={session} onClose={() => setIsAddingTreatment(false)} onSave={refreshSession} />}
            {deletingTreatment && (
                <ConfirmDeleteModal
                    title="حذف العلاج"
                    message={`هل أنت متأكد من حذف علاج "${deletingTreatment.name}" من هذه الجلسة؟`}
                    onConfirm={confirmDeleteTreatment}
                    onCancel={() => setDeletingTreatment(null)}
                />
            )}
        </div>
    );
};

// ===================================================================
// PatientSessionsPage Component
// ===================================================================
const PatientSessionsPage: React.FC<{ patient: Patient; onBack: () => void; }> = ({ patient, onBack }) => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewingTreatmentsFor, setViewingTreatmentsFor] = useState<Session | null>(null);
    const [editingSession, setEditingSession] = useState<Session | null>(null);
    const [isAddingSession, setIsAddingSession] = useState(false);
    const [deletingSession, setDeletingSession] = useState<Session | null>(null);

    const fetchSessions = useCallback(async () => {
        setLoading(true);
        const allSessions = await api.sessions.getAll();
        setSessions(allSessions.filter(s => s.patientId === patient.id));
        setLoading(false);
    }, [patient.id]);

    useEffect(() => { fetchSessions(); }, [fetchSessions]);

    const handleCreateSession = async (newSessionData: Omit<Session, 'id' | 'treatments'>) => {
        await api.sessions.create({ ...newSessionData, treatments: [] } as Omit<Session, 'id'>);
        setIsAddingSession(false);
        await fetchSessions();
    };

    const handleUpdateSession = async (updatedSession: Session) => {
        await api.sessions.update(updatedSession.id, updatedSession);
        setEditingSession(null);
        await fetchSessions();
    };

    const confirmDeleteSession = async () => {
        if (deletingSession) {
            await api.sessions.delete(deletingSession.id);
            setDeletingSession(null);
            await fetchSessions();
        }
    };

    if (viewingTreatmentsFor) {
        return <SessionTreatmentsPage session={viewingTreatmentsFor} onBack={() => { setViewingTreatmentsFor(null); fetchSessions(); }} />;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                        <ArrowBackIcon className="h-5 w-5" />
                        <span>العودة</span>
                    </button>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">جلسات: {patient.name}</h1>
                </div>
                 <div>
                    <button onClick={() => setIsAddingSession(true)} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700 transition-colors"><PlusIcon className="h-5 w-5 ml-2" />إضافة جلسة</button>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md min-h-[200px]">
                {loading ? <CenteredLoadingSpinner /> : sessions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{sessions.map(s => {
                        const allTreatmentsCompleted = s.treatments.length > 0 && s.treatments.every(t => t.completed);
                        return (
                        <div key={s.id} className="relative bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col justify-between hover:shadow-lg">
                             {allTreatmentsCompleted && (
                                <div className="absolute top-3 left-3 text-green-500 bg-white dark:bg-gray-800 rounded-full" title="الجلسة مكتملة">
                                    <CheckIcon className="h-6 w-6" />
                                </div>
                            )}
                            <div><p className="font-bold text-lg text-gray-800 dark:text-gray-100">{new Date(s.date).toLocaleDateString()}</p><p className="text-gray-600 dark:text-gray-300 mt-2 text-sm h-12 overflow-hidden">{s.notes || 'لا توجد ملاحظات.'}</p></div>
                            <div className="mt-4 pt-4 border-t dark:border-gray-600 flex items-center justify-end space-x-2">
                                <button onClick={() => setViewingTreatmentsFor(s)} className="flex items-center text-purple-600 dark:text-purple-400 hover:text-purple-800 p-1 rounded hover:bg-purple-100 dark:hover:bg-purple-900/40 text-sm"><BeakerIcon className="h-4 w-4" /><span className="mr-1">العلاجات ({s.treatments.length})</span></button>
                                <button onClick={() => setEditingSession(s)} className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 text-sm"><PencilIcon className="h-4 w-4" /><span className="mr-1">تعديل</span></button>
                                <button onClick={() => setDeletingSession(s)} className="flex items-center text-red-600 dark:text-red-400 hover:text-red-800 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/40 text-sm"><TrashIcon className="h-4 w-4" /><span className="mr-1">حذف</span></button>
                            </div>
                        </div>
                        )
                    })}
                    </div>) : <p className="text-center text-gray-500 dark:text-gray-400 py-8">لا توجد جلسات مسجلة.</p>}
            </div>
            {isAddingSession && <AddSessionModal onClose={() => setIsAddingSession(false)} onSave={handleCreateSession} patientId={patient.id} doctorId={patient.doctorId} />}
            {editingSession && <EditSessionModal session={editingSession} onClose={() => setEditingSession(null)} onSave={handleUpdateSession} />}
            {deletingSession && (
                <ConfirmDeleteModal
                    title="حذف الجلسة"
                    message={`هل أنت متأكد من حذف جلسة تاريخ ${new Date(deletingSession.date).toLocaleDateString()}؟`}
                    onConfirm={confirmDeleteSession}
                    onCancel={() => setDeletingSession(null)}
                />
            )}
        </div>
    );
};


// ===================================================================
// AddPatientModal Component
// ===================================================================
interface AddPatientModalProps {
    onSave: (newPatient: Omit<Patient, 'id' | 'code'>) => Promise<void>;
    onClose: () => void;
    doctors: User[]; // Pass doctors list for selection
}

const AddPatientModal: React.FC<AddPatientModalProps> = ({ onSave, onClose, doctors }) => {
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        phone: '',
        notes: '',
        doctorId: '',
        gender: Gender.Male,
        isSmoker: false,
        isPregnant: false,
        drugAllergy: '',
        chronicDiseases: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const inputStyle = "w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black dark:text-white";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
             if (name === 'gender' && value === Gender.Male) {
                setFormData(prev => ({ ...prev, isPregnant: false }));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.doctorId) {
            alert("الرجاء اختيار طبيب.");
            return;
        }
        setIsSaving(true);
        await onSave({
            ...formData,
            age: parseInt(formData.age, 10) || 0,
            isPregnant: formData.gender === Gender.Female ? formData.isPregnant : false,
        });
        setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg" role="dialog" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">إضافة مريض جديد</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 max-h-[70vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label htmlFor="nameAdd" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاسم</label><input type="text" id="nameAdd" name="name" value={formData.name} onChange={handleChange} required className={inputStyle} /></div>
                        <div><label htmlFor="ageAdd" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العمر</label><input type="number" id="ageAdd" name="age" value={formData.age} onChange={handleChange} required className={inputStyle} /></div>
                        <div><label htmlFor="phoneAdd" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الهاتف</label><input type="tel" id="phoneAdd" name="phone" value={formData.phone} onChange={handleChange} required className={inputStyle} /></div>
                        <div>
                            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الجنس</label>
                            <select id="gender" name="gender" value={formData.gender} onChange={handleChange} className={inputStyle}>
                                <option value={Gender.Male}>ذكر</option>
                                <option value={Gender.Female}>أنثى</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                             <label htmlFor="doctorId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الطبيب المسؤول</label>
                            <select id="doctorId" name="doctorId" value={formData.doctorId} onChange={handleChange} required className={inputStyle}>
                                <option value="">اختر طبيب...</option>
                                {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>

                        <div className="md:col-span-2"><label htmlFor="drugAllergyAdd" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الحساسية الدوائية</label><textarea id="drugAllergyAdd" name="drugAllergy" value={formData.drugAllergy} onChange={handleChange} rows={2} className={inputStyle}></textarea></div>
                        <div className="md:col-span-2"><label htmlFor="chronicDiseasesAdd" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الأمراض المزمنة</label><textarea id="chronicDiseasesAdd" name="chronicDiseases" value={formData.chronicDiseases} onChange={handleChange} rows={2} className={inputStyle}></textarea></div>
                        <div className="md:col-span-2"><label htmlFor="notesAdd" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ملاحظات عامة</label><textarea id="notesAdd" name="notes" value={formData.notes} onChange={handleChange} rows={2} className={inputStyle}></textarea></div>
                        <div className="md:col-span-2 flex items-center space-x-4 pt-2">
                           <label className="flex items-center cursor-pointer">
                                <input type="checkbox" name="isSmoker" checked={formData.isSmoker} onChange={handleChange} className="h-4 w-4 text-primary rounded border-gray-300 dark:border-gray-500 focus:ring-primary" />
                                <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">مدخن</span>
                            </label>
                            {formData.gender === Gender.Female && (
                                <label className="flex items-center cursor-pointer">
                                    <input type="checkbox" name="isPregnant" checked={formData.isPregnant} onChange={handleChange} className="h-4 w-4 text-primary rounded border-gray-300 dark:border-gray-500 focus:ring-primary" />
                                    <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">حامل</span>
                                </label>
                            )}
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
// Main PatientsPage Component
// ===================================================================
interface PatientsPageProps {
    user: User;
}

const PatientsPage: React.FC<PatientsPageProps> = ({ user }) => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [doctors, setDoctors] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewingSessionsFor, setViewingSessionsFor] = useState<Patient | null>(null);
    const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
    const [isAddingPatient, setIsAddingPatient] = useState(false);
    const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
    const [viewingPhotosFor, setViewingPhotosFor] = useState<Patient | null>(null);

    const fetchPatients = useCallback(async () => {
        setLoading(true);
        let patientsData: Patient[];
        if (user.role === UserRole.Doctor) {
            patientsData = await api.patients.getAll().then(pats => pats.filter(p => p.doctorId === user.id));
        } else {
            patientsData = await api.patients.getAll();
        }
        const doctorsData = await api.doctors.getAll();
        setPatients(patientsData);
        setDoctors(doctorsData);
        setLoading(false);
    }, [user.id, user.role]);

    useEffect(() => {
        fetchPatients();
    }, [fetchPatients]);

    const handleCreatePatient = async (newPatientData: Omit<Patient, 'id' | 'code'>) => {
        await api.patients.create(newPatientData);
        setIsAddingPatient(false);
        await fetchPatients();
    };

    const handleUpdatePatient = async (updatedPatient: Patient) => {
        try {
            await api.patients.update(updatedPatient.id, updatedPatient);
        } catch (error) {
            console.error("Failed to update patient:", error);
            alert(`فشل تحديث المريض: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
        } finally {
            setEditingPatient(null);
            await fetchPatients();
        }
    };

    const confirmDeletePatient = async () => {
        if (deletingPatient) {
            try {
                await api.patients.delete(deletingPatient.id);
            } catch(error) {
                console.error("Failed to delete patient:", error);
                alert(`فشل حذف المريض: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
            } finally {
                setDeletingPatient(null);
                await fetchPatients();
            }
        }
    };
    
    const filteredPatients = patients.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (viewingPatient) {
        return <PatientDetailsPage patient={viewingPatient} onBack={() => setViewingPatient(null)} />;
    }
    
    if (viewingPhotosFor) {
        return <PatientGalleryPage patient={viewingPhotosFor} onBack={() => setViewingPhotosFor(null)} />;
    }

    if (viewingSessionsFor) {
        return <PatientSessionsPage patient={viewingSessionsFor} onBack={() => setViewingSessionsFor(null)} />;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">
                    {user.role === UserRole.Doctor ? "مرضاي" : "إدارة المرضى"}
                </h1>
                <div className="relative w-full max-w-sm">
                   <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                       <SearchIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                   </div>
                   <input
                       type="text"
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       placeholder="ابحث بالاسم أو الكود..."
                       className="w-full pl-3 pr-10 py-2 bg-white dark:bg-gray-700 text-black dark:text-white border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                   />
                </div>
                {(user.role !== UserRole.Doctor) && (
                    <button onClick={() => setIsAddingPatient(true)} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700 transition-colors">
                        <PlusIcon className="h-5 w-5 ml-2" />
                        إضافة مريض
                    </button>
                )}
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md min-h-[200px]">
                {loading ? <CenteredLoadingSpinner /> : (
                    filteredPatients.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredPatients.map(patient => (
                                <div key={patient.id} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col justify-between hover:shadow-lg">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{patient.name}</h3>
                                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">{patient.code}</span>
                                        </div>
                                        <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                            <p><span className="font-semibold">العمر:</span> {patient.age}</p>
                                            <p><span className="font-semibold">الهاتف:</span> {patient.phone}</p>
                                            <p><span className="font-semibold">الجنس:</span> {patient.gender === Gender.Female ? 'أنثى' : 'ذكر'}</p>
                                            {patient.isSmoker && <p className="font-semibold text-orange-600 dark:text-orange-400">مدخن</p>}
                                            {patient.isPregnant && <p className="font-semibold text-pink-600 dark:text-pink-400">حامل</p>}
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t dark:border-gray-600 flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
                                         <button onClick={() => setViewingPatient(patient)} className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-sm" title="عرض التفاصيل"><EyeIcon className="h-4 w-4" /><span className="mr-1">عرض</span></button>
                                         <button onClick={() => setViewingPhotosFor(patient)} className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 p-1 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-sm" title="عرض الصور"><PhotographIcon className="h-4 w-4" /><span className="mr-1">الصور</span></button>
                                         {(user.role !== UserRole.Secretary) && (
                                            <button onClick={() => setViewingSessionsFor(patient)} className="flex items-center text-teal-600 dark:text-teal-400 hover:text-teal-800 p-1 rounded hover:bg-teal-100 dark:hover:bg-teal-900/40 text-sm"><ClipboardListIcon className="h-4 w-4" /><span className="mr-1">الجلسات</span></button>
                                         )}
                                         <button onClick={() => setEditingPatient(patient)} className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 text-sm"><PencilIcon className="h-4 w-4" /><span className="mr-1">تعديل</span></button>
                                         <button onClick={() => setDeletingPatient(patient)} className="flex items-center text-red-600 dark:text-red-400 hover:text-red-800 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/40 text-sm"><TrashIcon className="h-4 w-4" /><span className="mr-1">حذف</span></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                            {user.role === UserRole.Doctor ? "لا يوجد مرضى مسجلون باسمك." : "لم يتم العثور على مرضى."}
                        </p>
                    )
                )}
            </div>
            {isAddingPatient && <AddPatientModal onClose={() => setIsAddingPatient(false)} onSave={handleCreatePatient} doctors={doctors} />}
            {editingPatient && <EditPatientModal patient={editingPatient} onClose={() => setEditingPatient(null)} onSave={handleUpdatePatient} />}
            {deletingPatient && (
                <ConfirmDeleteModal
                    title="حذف المريض"
                    message={`هل أنت متأكد من رغبتك في حذف ${deletingPatient.name}؟`}
                    onConfirm={confirmDeletePatient}
                    onCancel={() => setDeletingPatient(null)}
                />
            )}
        </div>
    );
};

export default PatientsPage;