import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { User, Patient, UserRole, Session, SessionTreatment, Treatment, Payment, Gender, PatientPhoto, ActivityLog, ActivityLogActionType, CreatePatientPhotosPayload } from '../types';
import { api, getSessionsByPatient } from '../services/api';
import { PlusIcon, PencilIcon, TrashIcon, XIcon, ClipboardListIcon, BeakerIcon, ArrowBackIcon, EyeIcon, CurrencyDollarIcon, CheckIcon, SearchIcon, PhotographIcon, ListBulletIcon, DocumentTextIcon, UserCircleIcon, CalendarIcon, ChevronDownIcon } from '../components/Icons';
import LoadingSpinner, { CenteredLoadingSpinner } from '../components/LoadingSpinner';
import { useAppSettings } from '../hooks/useAppSettings';

// ===================================================================
// AddEditPhotoModal Component
// ===================================================================
interface AddEditPhotoModalProps {
    photo?: PatientPhoto;
    patientId: string;
    onSave: (data: PatientPhoto | CreatePatientPhotosPayload) => Promise<void>;
    onClose: () => void;
}

const AddEditPhotoModal: React.FC<AddEditPhotoModalProps> = ({ photo, patientId, onSave, onClose }) => {
    const isEditMode = !!photo;
    
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>(isEditMode && photo ? [photo.imageUrl] : []);
    const [captions, setCaptions] = useState<string[]>(isEditMode && photo ? [photo.caption || ''] : []);

    const [isSaving, setIsSaving] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const inputStyle = "w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black dark:text-white";

    const fileToBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });

    const handleFilesSelect = (selectedFiles: FileList | null) => {
        if (!selectedFiles) return;
        const newFiles = Array.from(selectedFiles).filter(file => file.type.startsWith('image/'));
        if (newFiles.length === 0) return;

        const newPreviews = newFiles.map(file => URL.createObjectURL(file));

        if (isEditMode) {
            setFiles(newFiles.slice(0, 1));
            setPreviews(newPreviews.slice(0, 1));
        } else {
            setFiles(prev => [...prev, ...newFiles]);
            setPreviews(prev => [...prev, ...newPreviews]);
            setCaptions(prev => [...prev, ...new Array(newFiles.length).fill('')]);
        }
    };

    const handleCaptionChange = (index: number, value: string) => {
        setCaptions(prev => {
            const newCaptions = [...prev];
            newCaptions[index] = value;
            return newCaptions;
        });
    };

    const handleRemoveImage = (index: number) => {
        if (isEditMode) {
            setFiles([]);
            setPreviews([]);
        } else {
            setFiles(prev => prev.filter((_, i) => i !== index));
            setPreviews(prev => prev.filter((_, i) => i !== index));
            setCaptions(prev => prev.filter((_, i) => i !== index));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => handleFilesSelect(e.target.files);
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFilesSelect(e.dataTransfer.files);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (previews.length === 0) {
            alert('يرجى رفع صورة واحدة على الأقل.');
            return;
        }
        if (files.length === 0 && !isEditMode) {
             alert('يرجى رفع صورة واحدة على الأقل.');
             return;
        }

        setIsSaving(true);
        try {
            if (isEditMode && photo) {
                let imageUrl = photo.imageUrl;
                if (files.length > 0) {
                    imageUrl = await fileToBase64(files[0]);
                }
                const dataToSave: PatientPhoto = { ...photo, imageUrl, caption: captions[0] || '' };
                await onSave(dataToSave);
            } else {
                const imageUrls = await Promise.all(files.map(file => fileToBase64(file)));
                const dataToSave: CreatePatientPhotosPayload = { patientId, imageUrls, captions };
                await onSave(dataToSave);
            }
        } catch (error) {
            console.error("Failed to save photos", error);
            // FIX: Correctly handle 'unknown' error type in catch block. The 'error' variable cannot be directly used in a template literal with property access, so its message is first extracted into a variable.
            const message = error instanceof Error ? error.message : "خطأ غير معروف";
            alert(`فشل الحفظ: ${message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl" role="dialog" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{isEditMode ? 'تعديل الصورة' : 'إضافة صور جديدة'}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        {isEditMode ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الصورة</label>
                                <div className={`w-full h-48 border-2 border-dashed rounded-lg flex justify-center items-center cursor-pointer transition-colors hover:border-primary`} onClick={() => fileInputRef.current?.click()}>
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                                    {previews.length > 0 ? <img src={previews[0]} alt="معاينة" className="max-h-full max-w-full object-contain rounded-md" /> : <div className="text-center text-gray-500 dark:text-gray-400"><PhotographIcon className="h-12 w-12 mx-auto" /><p>انقر لتغيير الصورة</p></div>}
                                </div>
                                <div className="mt-4">
                                    <label htmlFor="caption" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تعليق</label>
                                    <textarea id="caption" value={captions[0] || ''} onChange={(e) => handleCaptionChange(0, e.target.value)} rows={3} className={inputStyle} placeholder="أضف تعليقًا وصفيًا..."></textarea>
                                </div>
                            </div>
                        ) : (
                            <div>
                                {previews.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                        {previews.map((previewUrl, index) => (
                                            <div key={index} className="relative group border dark:border-gray-600 rounded-lg p-2 space-y-2 bg-gray-50 dark:bg-gray-900">
                                                <img src={previewUrl} alt={`معاينة ${index + 1}`} className="w-full h-32 object-cover rounded-md" />
                                                <textarea value={captions[index] || ''} onChange={(e) => handleCaptionChange(index, e.target.value)} placeholder={`تعليق الصورة ${index + 1}`} rows={2} className={inputStyle} />
                                                <button type="button" onClick={() => handleRemoveImage(index)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100" aria-label={`Remove image ${index + 1}`}><XIcon className="h-4 w-4" /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className={`w-full h-32 border-2 border-dashed rounded-lg flex flex-col justify-center items-center cursor-pointer transition-colors ${isDragging ? 'border-primary bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-primary'}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}>
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" multiple />
                                    <div className="text-center text-gray-500 dark:text-gray-400"><PhotographIcon className="h-12 w-12 mx-auto" /><p>اسحب وأفلت الصور هنا، أو انقر للاختيار</p></div>
                                </div>
                            </div>
                        )}
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

    const handleSavePhoto = async (data: PatientPhoto | CreatePatientPhotosPayload) => {
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
// EditSessionTreatmentModal Component
// ===================================================================
interface EditSessionTreatmentModalProps {
    treatment: SessionTreatment;
    onSave: () => Promise<void>;
    onClose: () => void;
    user: User;
}

const EditSessionTreatmentModal: React.FC<EditSessionTreatmentModalProps> = ({ treatment, onSave, onClose, user }) => {
    const [formData, setFormData] = useState({
        sessionPrice: treatment.sessionPrice.toString(),
        sessionNotes: treatment.sessionNotes || '',
        treatmentDate: treatment.treatmentDate ? new Date(treatment.treatmentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        additionalCosts: treatment.additionalCosts?.toString() || '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const inputStyle = "w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black dark:text-white";

    useEffect(() => {
        const numbers = formData.sessionNotes.match(/\d+(\.\d+)?/g);
        if (numbers) {
            const sum = numbers.reduce((total, num) => total + parseFloat(num), 0);
            setFormData(prev => ({...prev, additionalCosts: sum > 0 ? sum.toFixed(2) : ''}));
        } else {
            setFormData(prev => ({...prev, additionalCosts: ''}));
        }
    }, [formData.sessionNotes]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.sessionTreatments.update(treatment.instanceId, {
                sessionPrice: parseFloat(formData.sessionPrice) || 0,
                sessionNotes: formData.sessionNotes,
                treatmentDate: formData.treatmentDate,
                additionalCosts: parseFloat(formData.additionalCosts) || undefined,
            });
            await onSave();
        } catch (error) {
            console.error("Failed to update treatment:", error);
            const message = error instanceof Error ? error.message : 'Unknown error';
            alert(`فشل في تحديث العلاج: ${message}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md" role="dialog" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">تعديل العلاج: {treatment.name}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="treatmentDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاريخ العلاج</label>
                            <input type="date" id="treatmentDate" name="treatmentDate" value={formData.treatmentDate} onChange={handleChange} required className={inputStyle} />
                        </div>
                        {user.role !== UserRole.Doctor && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="sessionPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">السعر</label>
                                    <input type="number" step="0.01" id="sessionPrice" name="sessionPrice" value={formData.sessionPrice} onChange={handleChange} required className={inputStyle} />
                                </div>
                                 <div>
                                    <label htmlFor="additionalCosts" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تكاليف اضافية</label>
                                    <input type="number" step="0.01" id="additionalCosts" name="additionalCosts" value={formData.additionalCosts} readOnly className={`${inputStyle} bg-gray-100 dark:bg-gray-800 cursor-not-allowed`} placeholder="يتم حسابه من الملاحظات" />
                                </div>
                            </div>
                        )}
                        <div>
                            <label htmlFor="sessionNotes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ملاحظات</label>
                            <textarea id="sessionNotes" name="sessionNotes" value={formData.sessionNotes} onChange={handleChange} rows={3} className={inputStyle} placeholder="ملاحظات حول العلاج... سيتم استخلاص الأرقام للتكاليف الإضافية"></textarea>
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
// PatientSessionsPage Component
// ===================================================================
interface PatientSessionsPageProps {
    patient: Patient;
    doctors: User[];
    onBack: () => void;
    user: User;
}

const PatientSessionsPage: React.FC<PatientSessionsPageProps> = ({ patient, doctors, onBack, user }) => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddingSession, setIsAddingSession] = useState(false);
    const [editingSession, setEditingSession] = useState<Session | null>(null);
    const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
    const [addingTreatmentToSession, setAddingTreatmentToSession] = useState<Session | null>(null);
    const [treatmentToDelete, setTreatmentToDelete] = useState<SessionTreatment | null>(null);
    const [editingTreatment, setEditingTreatment] = useState<SessionTreatment | null>(null);
    const [viewingTreatment, setViewingTreatment] = useState<SessionTreatment | null>(null);
    const [viewingTreatmentsForSession, setViewingTreatmentsForSession] = useState<Session | null>(null);

    const getDoctorName = (doctorId: string) => doctors.find(d => d.id === doctorId)?.name || 'غير معروف';

    const fetchSessions = useCallback(async () => {
        setLoading(true);
        try {
            const allSessions = await api.sessions.getAll();
            const patientSessions = allSessions
                .filter(s => s.patientId === patient.id)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setSessions(patientSessions);
        } catch (error) {
            console.error("Failed to fetch sessions:", error);
            alert("فشل في تحميل الجلسات.");
        } finally {
            setLoading(false);
        }
    }, [patient.id]);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    const handleCreateSession = async (newSessionData: Omit<Session, 'id' | 'treatments'>) => {
        await api.sessions.create({ ...newSessionData, treatments: [] });
        setIsAddingSession(false);
        await fetchSessions();
    };

    const handleUpdateSession = async (updatedSession: Session) => {
        await api.sessions.update(updatedSession.id, updatedSession);
        setEditingSession(null);
        await fetchSessions();
    };

    const confirmDeleteSession = async () => {
        if (sessionToDelete) {
            await api.sessions.delete(sessionToDelete.id);
            setSessionToDelete(null);
            await fetchSessions();
        }
    };

    const handleSaveTreatment = async (keepModalOpen?: boolean) => {
        if (!keepModalOpen) {
            setAddingTreatmentToSession(null);
        }
        await fetchSessions();
        // After saving, find the updated session object and update the viewing state
        const updatedSession = (await api.sessions.getAll()).find(s => s.id === viewingTreatmentsForSession?.id);
        if(updatedSession) {
            setViewingTreatmentsForSession(updatedSession);
        }
    };

    const handleUpdateTreatment = async () => {
        setEditingTreatment(null);
        await fetchSessions();
        const updatedSession = (await api.sessions.getAll()).find(s => s.id === viewingTreatmentsForSession?.id);
        if(updatedSession) {
            setViewingTreatmentsForSession(updatedSession);
        }
    }

    const confirmDeleteTreatment = async () => {
        if (treatmentToDelete) {
            await api.sessionTreatments.delete(treatmentToDelete.instanceId);
            setTreatmentToDelete(null);
            await fetchSessions();
            const updatedSession = (await api.sessions.getAll()).find(s => s.id === viewingTreatmentsForSession?.id);
            if (updatedSession) {
                setViewingTreatmentsForSession(updatedSession);
            }
        }
    };

    const handleToggleTreatmentComplete = async (treatment: SessionTreatment) => {
        try {
            await api.sessionTreatments.update(treatment.instanceId, { completed: !treatment.completed });
            await fetchSessions();
            const updatedSession = (await api.sessions.getAll()).find(s => s.id === viewingTreatmentsForSession?.id);
             if (updatedSession) {
                setViewingTreatmentsForSession(updatedSession);
            }
        } catch (error) {
            console.error("Failed to update treatment status:", error);
            alert('فشل في تحديث حالة العلاج.');
        }
    };

    return (
        <div>
            {viewingTreatmentsForSession ? (
                // TREATMENTS VIEW (as cards)
                <div>
                    <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setViewingTreatmentsForSession(null)} className="flex items-center gap-2 px-4 py-2 font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                                <ArrowBackIcon className="h-5 w-5" />
                                <span>العودة للجلسات</span>
                            </button>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">علاجات جلسة: {viewingTreatmentsForSession.title || 'بدون عنوان'}</h1>
                                <p className="text-gray-500 dark:text-gray-400">للمريض: {patient.name} - بتاريخ {new Date(viewingTreatmentsForSession.date).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <button onClick={() => setAddingTreatmentToSession(viewingTreatmentsForSession)} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition-colors">
                            <PlusIcon className="h-5 w-5 ml-2" />
                            إضافة علاج
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {viewingTreatmentsForSession.treatments.length > 0 ? (
                            viewingTreatmentsForSession.treatments.map(t => (
                                <div key={t.instanceId} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <button onClick={() => handleToggleTreatmentComplete(t)} title={t.completed ? 'وضع علامة كغير مكتمل' : 'وضع علامة كمكتمل'}>
                                                {t.completed 
                                                  ? <CheckIcon className="h-6 w-6 text-green-500" />
                                                  : <div className="h-6 w-6 rounded-full border-2 border-gray-400 dark:border-gray-500"></div>
                                                }
                                            </button>
                                            <p className={`font-bold text-lg ${t.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-100'}`}>{t.name}</p>
                                        </div>
                                        {user.role !== UserRole.Doctor && (
                                            <p className="text-md font-semibold text-green-600 dark:text-green-400">
                                                SYP {t.sessionPrice.toFixed(2)}
                                                {t.additionalCosts ? ` (+ SYP ${t.additionalCosts.toFixed(2)})` : ''}
                                            </p>
                                        )}
                                        {t.treatmentDate && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">تاريخ العلاج: {new Date(t.treatmentDate).toLocaleDateString()}</p>}
                                    </div>
                                    <div className="mt-4 pt-4 border-t dark:border-gray-700 flex justify-end items-center gap-1">
                                        <button onClick={() => setViewingTreatment(t)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600" title="عرض التفاصيل"><EyeIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" /></button>
                                        <button onClick={() => setEditingTreatment(t)} className="p-2 rounded-full text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40" title="تعديل العلاج"><PencilIcon className="h-5 w-5" /></button>
                                        <button onClick={() => setTreatmentToDelete(t)} className="p-2 rounded-full text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40" title="حذف العلاج"><TrashIcon className="h-5 w-5" /></button>
                                    </div>
                                </div>
                            ))
                        ) : (
                             <div className="col-span-full text-center py-16 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-800 rounded-xl">
                                <BeakerIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">لا توجد علاجات</h3>
                                <p className="mt-1 text-sm">ابدأ بإضافة أول علاج لهذه الجلسة.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                // SESSIONS VIEW (as cards)
                <div>
                    <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                         <div className="flex items-center gap-4">
                            <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                                <ArrowBackIcon className="h-5 w-5" />
                                <span>العودة</span>
                            </button>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">جلسات المريض</h1>
                                <p className="text-gray-500 dark:text-gray-400">{patient.name}</p>
                            </div>
                        </div>
                        <button onClick={() => setIsAddingSession(true)} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700 transition-colors">
                            <PlusIcon className="h-5 w-5 ml-2" />
                            إضافة جلسة
                        </button>
                    </div>

                    <div className="space-y-6">
                        {loading ? <CenteredLoadingSpinner /> : sessions.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {sessions.map(session => {
                                const isSessionCompleted = session.treatments.length > 0 && session.treatments.every(t => t.completed);
                                return (
                                <div key={session.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{session.title || 'جلسة بدون عنوان'}</h2>
                                            {isSessionCompleted && (
                                                <span title="الجلسة مكتملة" className="flex items-center justify-center bg-green-100 dark:bg-green-900/40 rounded-full p-1">
                                                    <CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">بتاريخ: {new Date(session.date).toLocaleDateString()} - الطبيب: {getDoctorName(session.doctorId)}</p>
                                        {session.notes && <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 bg-gray-50 dark:bg-slate-700/50 p-2 rounded-md">ملاحظات: {session.notes}</p>}
                                    </div>
                                    <div className="mt-4 pt-4 border-t dark:border-gray-700 flex flex-wrap items-center justify-end gap-2">
                                        <button onClick={() => setViewingTreatmentsForSession(session)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white bg-teal-600 rounded-md hover:bg-teal-700"><BeakerIcon className="h-4 w-4" /> علاجات ({session.treatments.length})</button>
                                        <button onClick={() => setEditingSession(session)} className="p-2 rounded-full text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40" title="تعديل الجلسة"><PencilIcon className="h-5 w-5" /></button>
                                        <button onClick={() => setSessionToDelete(session)} className="p-2 rounded-full text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40" title="حذف الجلسة"><TrashIcon className="h-5 w-5" /></button>
                                    </div>
                                </div>
                                )
                            })}
                            </div>
                        ) : (
                            <div className="text-center py-16 text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800 rounded-xl shadow-md">
                                <ClipboardListIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">لا توجد جلسات</h3>
                                <p className="mt-1 text-sm">ابدأ بإضافة أول جلسة لهذا المريض.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {isAddingSession && <AddSessionModal onSave={handleCreateSession} onClose={() => setIsAddingSession(false)} patientId={patient.id} doctors={doctors} user={user} patient={patient} />}
            {editingSession && <EditSessionModal session={editingSession} onSave={handleUpdateSession} onClose={() => setEditingSession(null)} />}
            {sessionToDelete && <ConfirmDeleteModal title="حذف الجلسة" message="هل أنت متأكد من حذف هذه الجلسة وجميع علاجاتها؟" onConfirm={confirmDeleteSession} onCancel={() => setSessionToDelete(null)} />}
            {addingTreatmentToSession && <AddTreatmentToSessionModal session={addingTreatmentToSession} onSave={handleSaveTreatment} onClose={() => setAddingTreatmentToSession(null)} user={user} />}
            {editingTreatment && <EditSessionTreatmentModal treatment={editingTreatment} onSave={handleUpdateTreatment} onClose={() => setEditingTreatment(null)} user={user} />}
            {treatmentToDelete && <ConfirmDeleteModal title="حذف العلاج" message={`هل أنت متأكد من حذف علاج "${treatmentToDelete.name}" من الجلسة؟`} onConfirm={confirmDeleteTreatment} onCancel={() => setTreatmentToDelete(null)} />}
            {viewingTreatment && <ViewTreatmentDetailsModal treatment={viewingTreatment} onClose={() => setViewingTreatment(null)} user={user} />}
        </div>
    );
};

// ===================================================================
// PatientDetailsPage Component
// ===================================================================
interface PatientDetailsPageProps {
    patient: Patient;
    doctors: User[];
    onBack: () => void;
}

const DetailItem: React.FC<{ label: string; value?: string | number | null; children?: React.ReactNode }> = ({ label, value, children }) => (
    <div className="py-3 sm:py-4">
        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
        <dd className="mt-1 text-lg text-gray-900 dark:text-gray-100 sm:mt-0">{children || value || <span className="text-gray-400 dark:text-gray-500">لا يوجد</span>}</dd>
    </div>
);

const PatientDetailsPage: React.FC<PatientDetailsPageProps> = ({ patient, doctors, onBack }) => {
    const patientDoctors = useMemo(() => {
        return doctors.filter(d => patient.doctorIds.includes(d.id));
    }, [patient, doctors]);
    
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
                        <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"> <DetailItem label="الأطباء المسؤولون" value={patientDoctors.map(d => d.name).join(', ')} /> </div>
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
        title: session.title || '',
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
            title: formData.title,
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
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">عنوان الجلسة</label>
                            <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required className={inputStyle} />
                        </div>
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
    user: User;
}

const ViewTreatmentDetailsModal: React.FC<ViewTreatmentDetailsModalProps> = ({ treatment, onClose, user }) => {
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
                    {user.role !== UserRole.Doctor && (
                        <div className="pt-3 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">السعر</p>
                                <p className="text-lg font-semibold text-green-600 dark:text-green-400">SYP {treatment.sessionPrice.toFixed(2)}</p>
                            </div>
                             {treatment.additionalCosts && treatment.additionalCosts > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">تكاليف إضافية</p>
                                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">SYP {treatment.additionalCosts.toFixed(2)}</p>
                                </div>
                             )}
                        </div>
                    )}
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
    doctors: User[];
    user: User;
    patient: Patient;
}

const AddSessionModal: React.FC<AddSessionModalProps> = ({ onSave, onClose, patientId, doctors, user, patient }) => {
    const [formData, setFormData] = useState({ title: '', date: new Date().toISOString().split('T')[0], notes: '' });
    const [isSaving, setIsSaving] = useState(false);
    const inputStyle = "w-full px-3 py-2 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-black dark:text-white bg-white dark:bg-gray-700";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        let doctorId = '';
        if (user.role === UserRole.Doctor && patient.doctorIds.includes(user.id)) {
            doctorId = user.id;
        } else if (patient.doctorIds && patient.doctorIds.length > 0) {
            // Default to the first assigned doctor
            doctorId = patient.doctorIds[0];
        }

        if (!formData.date || !doctorId) { 
            alert('لا يمكن إضافة جلسة. المريض ليس لديه طبيب مسؤول.'); 
            return; 
        }

        setIsSaving(true);
        await onSave({ title: formData.title, date: new Date(formData.date).toISOString(), notes: formData.notes, patientId, doctorId: doctorId });
        setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md" role="dialog" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700"><h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">إضافة جلسة جديدة</h2><button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" /></button></div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div><label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">عنوان الجلسة</label><input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required className={inputStyle} /></div>
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
    user: User;
}

const AddTreatmentToSessionModal: React.FC<AddTreatmentToSessionModalProps> = ({ session, onSave, onClose, user }) => {
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
            const message = error instanceof Error ? error.message : 'Unknown error';
            alert(`فشل في حفظ العلاج: ${message}`);
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
                                {allTreatments.map(t => <option key={t.id} value={t.id}>{t.name}{user.role !== UserRole.Doctor && ` (SYP ${t.price})`}</option>)}
                            </select>
                        </div>
                        {selectedTreatmentId && (
                            <>
                                <div>
                                    <label htmlFor="treatmentDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاريخ العلاج</label>
                                    <input type="date" id="treatmentDate" value={treatmentDate} onChange={e => setTreatmentDate(e.target.value)} required className={inputStyle} />
                                </div>
                                {user.role !== UserRole.Doctor && (
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
                                )}
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
// AddPatientModal Component
// ===================================================================
interface AddPatientModalProps {
    onSave: (newPatient: Omit<Patient, 'id' | 'code'>) => Promise<void>;
    onClose: () => void;
    doctors: User[];
    user: User;
}

const AddPatientModal: React.FC<AddPatientModalProps> = ({ onSave, onClose, doctors, user }) => {
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        phone: '',
        notes: '',
        gender: Gender.Male,
        isSmoker: false,
        isPregnant: false,
        drugAllergy: '',
        chronicDiseases: '',
        doctorIds: user.role === UserRole.Doctor ? [user.id] : [],
    });
    const [isSaving, setIsSaving] = useState(false);
    const inputStyle = "w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black dark:text-white";

    const canEditDoctors = user.role === UserRole.Admin || user.role === UserRole.Secretary || (user.role === UserRole.Doctor && user.is_diagnosis_doctor);


    const handleDoctorIdsChange = (doctorId: string) => {
        setFormData(prev => {
            const currentDoctorIds = prev.doctorIds;
            const newDoctorIds = currentDoctorIds.includes(doctorId)
                ? currentDoctorIds.filter(id => id !== doctorId)
                : [...currentDoctorIds, doctorId];
            return { ...prev, doctorIds: newDoctorIds };
        });
    };

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
        if (formData.doctorIds.length === 0) {
            alert('يرجى اختيار طبيب واحد على الأقل.');
            return;
        }
        setIsSaving(true);
        const newPatientData = {
            ...formData,
            age: parseInt(formData.age, 10) || 0,
            isPregnant: formData.gender === Gender.Female ? formData.isPregnant : false,
            createdAt: new Date().toISOString(),
        };
        try {
            await onSave(newPatientData);
            // On success, the parent component will close the modal.
        } catch (error) {
            let message = 'خطأ غير معروف';
            if (error instanceof Error) {
                message = error.message;
            } else if (typeof error === 'string') {
                message = error;
            }
            alert(`فشل الحفظ: ${message}`);
            setIsSaving(false);
        }
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
                        {canEditDoctors && (
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الأطباء المسؤولون</label>
                                <div className="mt-2 p-3 border border-gray-800 dark:border-gray-600 rounded-md h-32 overflow-y-auto space-y-2 bg-white dark:bg-gray-700">
                                    {doctors.map(doctor => (
                                        <label key={doctor.id} className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                                            <input
                                                type="checkbox"
                                                checked={formData.doctorIds.includes(doctor.id)}
                                                onChange={() => handleDoctorIdsChange(doctor.id)}
                                                className="h-4 w-4 text-primary rounded border-gray-300 dark:border-gray-500 focus:ring-primary"
                                            />
                                            <div>
                                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{doctor.name}</span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 block">{doctor.specialty || 'لا يوجد تخصص'}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="md:col-span-2"><label htmlFor="drugAllergy" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الحساسية الدوائية</label><textarea id="drugAllergy" name="drugAllergy" value={formData.drugAllergy} onChange={handleChange} rows={2} className={inputStyle}></textarea></div>
                        <div className="md:col-span-2"><label htmlFor="chronicDiseases" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الأمراض المزمنة</label><textarea id="chronicDiseases" name="chronicDiseases" value={formData.chronicDiseases} onChange={handleChange} rows={2} className={inputStyle}></textarea></div>
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
// EditPatientModal Component
// ===================================================================
interface EditPatientModalProps {
    patient: Patient;
    onSave: (updatedPatient: Patient) => Promise<void>;
    onClose: () => void;
    doctors: User[];
    user: User;
}

const EditPatientModal: React.FC<EditPatientModalProps> = ({ patient, onSave, onClose, doctors, user }) => {
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
        doctorIds: patient.doctorIds || [],
    });
    const [isSaving, setIsSaving] = useState(false);
    const inputStyle = "w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black dark:text-white";
    
    const isSecretary = user.role === UserRole.Secretary;
    const canEditDoctors = user.role === UserRole.Admin || user.role === UserRole.Secretary || (user.role === UserRole.Doctor && user.is_diagnosis_doctor);


    const handleDoctorIdsChange = (doctorId: string) => {
        setFormData(prev => {
            const currentDoctorIds = prev.doctorIds;
            const newDoctorIds = currentDoctorIds.includes(doctorId)
                ? currentDoctorIds.filter(id => id !== doctorId)
                : [...currentDoctorIds, doctorId];
            return { ...prev, doctorIds: newDoctorIds };
        });
    };

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
            doctorIds: formData.doctorIds,
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
                         {!isSecretary && (
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">كود المريض</label>
                                <p className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-400">{patient.code}</p>
                            </div>
                         )}
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
                        {canEditDoctors && !isSecretary && (
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الأطباء المسؤولون</label>
                                <div className="mt-2 p-3 border border-gray-800 dark:border-gray-600 rounded-md h-32 overflow-y-auto space-y-2 bg-white dark:bg-gray-700">
                                    {doctors.map(doctor => (
                                        <label key={doctor.id} className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                                            <input
                                                type="checkbox"
                                                checked={formData.doctorIds.includes(doctor.id)}
                                                onChange={() => handleDoctorIdsChange(doctor.id)}
                                                className="h-4 w-4 text-primary rounded border-gray-300 dark:border-gray-500 focus:ring-primary"
                                            />
                                            <div>
                                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{doctor.name}</span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 block">{doctor.specialty || 'لا يوجد تخصص'}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                        {!isSecretary && (
                            <>
                                <div className="md:col-span-2"><label htmlFor="drugAllergyEdit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الحساسية الدوائية</label><textarea id="drugAllergyEdit" name="drugAllergy" value={formData.drugAllergy} onChange={handleChange} rows={2} className={inputStyle}></textarea></div>
                                <div className="md:col-span-2"><label htmlFor="chronicDiseasesEdit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الأمراض المزمنة</label><textarea id="chronicDiseasesEdit" name="chronicDiseases" value={formData.chronicDiseases} onChange={handleChange} rows={2} className={inputStyle}></textarea></div>
                                <div className="md:col-span-2"><label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ملاحظات عامة</label><textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={2} className={inputStyle}></textarea></div>
                            </>
                        )}
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
// AddPaymentModalForPatient Component (NEW)
// ===================================================================
interface AddPaymentModalForPatientProps {
    onSave: (newPayment: Omit<Payment, 'id'>) => Promise<void>;
    onClose: () => void;
    patient: Patient;
}

const AddPaymentModalForPatient: React.FC<AddPaymentModalForPatientProps> = ({ onSave, onClose, patient }) => {
    const [formData, setFormData] = useState({ amount: '', date: new Date().toISOString().split('T')[0] });
    const [isSaving, setIsSaving] = useState(false);
    const inputStyle = "w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black dark:text-white";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.amount) {
            alert('يرجى إدخال المبلغ.');
            return;
        }
        setIsSaving(true);
        await onSave({
            patientId: patient.id,
            amount: parseFloat(formData.amount),
            date: formData.date
        });
        setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md" role="dialog" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">إضافة دفعة لـ {patient.name}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المبلغ</label>
                            <input type="number" step="0.01" id="amount" name="amount" value={formData.amount} onChange={handleChange} required className={inputStyle} placeholder="0.00" />
                        </div>
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">التاريخ</label>
                            <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required className={inputStyle} />
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
// EditPaymentModalForPatient Component (NEW)
// ===================================================================
interface EditPaymentModalForPatientProps {
    payment: Payment;
    onSave: (updatedPayment: Payment) => Promise<void>;
    onClose: () => void;
    patientName: string;
}

const EditPaymentModalForPatient: React.FC<EditPaymentModalForPatientProps> = ({ payment, onSave, onClose, patientName }) => {
    const [formData, setFormData] = useState({ amount: payment.amount.toString(), date: payment.date });
    const [isSaving, setIsSaving] = useState(false);
    const inputStyle = "w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black dark:text-white";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave({ ...payment, amount: parseFloat(formData.amount), date: formData.date });
        setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md" role="dialog" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">تعديل دفعة لـ {patientName}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المبلغ</label>
                            <input type="number" step="0.01" id="amount" name="amount" value={formData.amount} onChange={handleChange} required className={inputStyle} />
                        </div>
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">التاريخ</label>
                            <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required className={inputStyle} />
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
// PatientPaymentsPage Component (NEW)
// ===================================================================
const PatientPaymentsPage: React.FC<{ patient: Patient; onBack: () => void; }> = ({ patient, onBack }) => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [stats, setStats] = useState({ totalPayments: 0, totalCost: 0, balance: 0 });
    const [loading, setLoading] = useState(true);
    const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
    const [isAddingPayment, setIsAddingPayment] = useState(false);
    const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [allPaymentsResponse, allSessions] = await Promise.all([
                api.payments.getAll({ page: 1, per_page: 9999 }),
                api.sessions.getAll()
            ]);

            const allPayments = allPaymentsResponse.payments;
            const patientPayments = allPayments.filter(p => p.patientId === patient.id);
            const patientSessions = allSessions.filter(s => s.patientId === patient.id);
            setPayments(patientPayments.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

            const totalPayments = patientPayments.reduce((sum, p) => sum + p.amount, 0);
            
            const totalCost = patientSessions.reduce((sessionSum, s) => {
                const treatmentsCost = s.treatments.reduce((treatmentSum, t) => {
                    return treatmentSum + t.sessionPrice + (t.additionalCosts || 0);
                }, 0);
                return sessionSum + treatmentsCost;
            }, 0);

            setStats({
                totalPayments,
                totalCost,
                balance: totalCost - totalPayments
            });

        } catch (error) {
            console.error("Failed to fetch payment data:", error);
            alert("فشل في تحميل البيانات المالية للمريض.");
        } finally {
            setLoading(false);
        }
    }, [patient.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreatePayment = async (newPayment: Omit<Payment, 'id'>) => {
        await api.payments.create(newPayment);
        setIsAddingPayment(false);
        await fetchData();
    };

    const handleUpdatePayment = async (updatedPayment: Payment) => {
        await api.payments.update(updatedPayment.id, updatedPayment);
        setEditingPayment(null);
        await fetchData();
    };

    const confirmDeletePayment = async () => {
        if (paymentToDelete) {
            await api.payments.delete(paymentToDelete.id);
            setPaymentToDelete(null);
            await fetchData();
        }
    };
    
    const StatCard: React.FC<{ title: string; value: string; icon: React.ElementType; color: string; }> = ({ title, value, icon: Icon, color }) => (
        <div className="p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-xl shadow-md flex items-center space-x-4 rtl:space-x-reverse">
            <div className="flex-shrink-0">
                <div className={`p-3 bg-${color}-100 dark:bg-${color}-900/40 rounded-full`}>
                    <Icon className={`h-6 w-6 text-${color}-600 dark:text-${color}-300`} />
                </div>
            </div>
            <div>
                <div className="text-lg sm:text-xl font-medium text-black dark:text-white">{value}</div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            </div>
        </div>
    );
    
    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                    <ArrowBackIcon className="h-5 w-5" />
                    <span>العودة</span>
                </button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">البيان المالي للمريض</h1>
                    <p className="text-gray-500 dark:text-gray-400">{patient.name}</p>
                </div>
            </div>
            
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
                <StatCard title="إجمالي تكاليف العلاج" value={`SYP ${stats.totalCost.toFixed(2)}`} icon={BeakerIcon} color="red" />
                <StatCard title="إجمالي الإيرادات" value={`SYP ${stats.totalPayments.toFixed(2)}`} icon={CurrencyDollarIcon} color="green" />
                <StatCard title="المتبقي" value={`SYP ${stats.balance.toFixed(2)}`} icon={ListBulletIcon} color={stats.balance > 0 ? 'yellow' : 'blue'} />
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">سجل الدفعات</h2>
                    <button onClick={() => setIsAddingPayment(true)} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700 transition-colors">
                        <PlusIcon className="h-5 w-5 ml-2" />
                        إضافة دفعة
                    </button>
                </div>

                {loading ? <CenteredLoadingSpinner /> : payments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm text-gray-800 dark:text-gray-200">
                            <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-100 dark:bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3">التاريخ</th>
                                    <th scope="col" className="px-6 py-3">المبلغ</th>
                                    <th scope="col" className="px-6 py-3">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map(pay => (
                                    <tr key={pay.id} className="bg-white dark:bg-slate-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                        <td className="px-6 py-4 font-medium">{new Date(pay.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 font-bold text-green-600 dark:text-green-400">SYP {pay.amount.toFixed(2)}</td>
                                        <td className="px-6 py-4 flex justify-end items-center gap-2">
                                            <button onClick={() => setEditingPayment(pay)} className="p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400" title="تعديل"><PencilIcon className="h-5 w-5" /></button>
                                            <button onClick={() => setPaymentToDelete(pay)} className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400" title="حذف"><TrashIcon className="h-5 w-5" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">لا توجد دفعات مسجلة لهذا المريض.</p>
                )}
            </div>

            {isAddingPayment && <AddPaymentModalForPatient patient={patient} onSave={handleCreatePayment} onClose={() => setIsAddingPayment(false)} />}
            {editingPayment && <EditPaymentModalForPatient payment={editingPayment} onSave={handleUpdatePayment} onClose={() => setEditingPayment(null)} patientName={patient.name} />}
            {paymentToDelete && (
                 <ConfirmDeleteModal
                    title="حذف الدفعة"
                    message={`هل أنت متأكد من حذف دفعة بقيمة SYP ${paymentToDelete.amount.toFixed(2)}؟`}
                    onConfirm={confirmDeletePayment}
                    onCancel={() => setPaymentToDelete(null)}
                />
            )}
        </div>
    );
};


// ===================================================================
// PatientActivityLogPage Component (NEW)
// ===================================================================
const PatientActivityLogPage: React.FC<{ patient: Patient; onBack: () => void; }> = ({ patient, onBack }) => {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        const response = await api.activityLogs.getAll({ page: 1, per_page: 9999 });
        setLogs(response.logs.filter(log => log.patientId === patient.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        setLoading(false);
    }, [patient.id]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const ActionIcon: React.FC<{ action: ActivityLogActionType }> = ({ action }) => {
        const iconProps = { className: "h-5 w-5" };
        switch (action) {
            case ActivityLogActionType.Create:
                return <div className="bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-full p-2"><PlusIcon {...iconProps} /></div>;
            case ActivityLogActionType.Update:
                return <div className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full p-2"><PencilIcon {...iconProps} /></div>;
            case ActivityLogActionType.Delete:
                return <div className="bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full p-2"><TrashIcon {...iconProps} /></div>;
            default:
                return null;
        }
    };

    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                    <ArrowBackIcon className="h-5 w-5" />
                    <span>العودة</span>
                </button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">سجل نشاط المريض</h1>
                    <p className="text-gray-500 dark:text-gray-400">{patient.name}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md min-h-[200px]">
                {loading ? <CenteredLoadingSpinner /> : logs.length > 0 ? (
                    <div className="space-y-4">
                        {logs.map(log => (
                            <div key={log.id} className="flex items-start space-x-4 rtl:space-x-reverse p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                <ActionIcon action={log.actionType} />
                                <div className="flex-grow">
                                    <p className="text-sm text-gray-800 dark:text-gray-200">{log.description}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        بواسطة {log.userName} &bull; {new Date(log.timestamp).toLocaleString('ar-SA', { dateStyle: 'medium', timeStyle: 'short' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">لا يوجد سجل نشاط</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">لم يتم تسجيل أي نشاط لهذا المريض بعد.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// ===================================================================
// PatientPlanPage Component (NEW & Redesigned)
// ===================================================================
interface PlanSession {
    id?: string; // for tracking existing sessions
    clientId: string; // for React key
    title: string;
    doctorId: string;
    date: string;
    notes: string;
    treatments: SessionTreatment[];
}
interface AddTreatmentToPlanSessionProps {
    session: PlanSession;
    allTreatments: Treatment[];
    onAdd: (treatment: Treatment) => void;
    user: User;
}
const AddTreatmentToPlanSession: React.FC<AddTreatmentToPlanSessionProps> = ({ session, allTreatments, onAdd, user }) => {
    const [selectedTreatmentId, setSelectedTreatmentId] = useState('');
    const availableTreatments = allTreatments.filter(t => !session.treatments.some(st => st.id === t.id));

    const handleAdd = () => {
        const treatmentToAdd = allTreatments.find(t => t.id === selectedTreatmentId);
        if (treatmentToAdd) {
            onAdd(treatmentToAdd);
            setSelectedTreatmentId('');
        }
    };

    return (
        <div className="mt-2 flex rounded-md shadow-sm">
            <select
                value={selectedTreatmentId}
                onChange={e => setSelectedTreatmentId(e.target.value)}
                className="relative -mr-px block w-full flex-1 rounded-l-md border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 px-3 py-2 text-gray-900 focus:z-10 focus:border-primary focus:ring-primary sm:text-sm"
            >
                <option value="">اختر علاجًا...</option>
                {availableTreatments.map(t => (
                    <option key={t.id} value={t.id}>{t.name}{user.role !== UserRole.Doctor && ` (SYP ${t.price.toFixed(2)})`}</option>
                ))}
            </select>
            <button
                type="button"
                onClick={handleAdd}
                disabled={!selectedTreatmentId}
                className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-700 focus:z-10 disabled:bg-primary-300 disabled:cursor-not-allowed"
            >
                <PlusIcon className="h-5 w-5" aria-hidden="true" />
                <span>إضافة</span>
            </button>
        </div>
    );
};

const PatientPlanPage: React.FC<{ patient: Patient; doctors: User[]; user: User; onBack: () => void; }> = ({ patient, doctors, user, onBack }) => {
    const [plan, setPlan] = useState<PlanSession[]>([]);
    const [allTreatments, setAllTreatments] = useState<Treatment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [openSessionClientId, setOpenSessionClientId] = useState<string | null>(null);
    const initialPlanRef = useRef<PlanSession[]>([]);


    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const [sessions, treatments] = await Promise.all([
                    getSessionsByPatient(patient.id),
                    api.treatmentSettings.getAll(true) // force refresh
                ]);

                const initialPlanData = sessions.map(session => ({
                    id: session.id,
                    clientId: `session_${session.id}`,
                    title: session.title,
                    doctorId: session.doctorId,
                    date: session.date.split('T')[0],
                    notes: session.notes,
                    treatments: session.treatments
                })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                
                setPlan(initialPlanData);
                initialPlanRef.current = JSON.parse(JSON.stringify(initialPlanData)); // Deep copy for comparison
                setAllTreatments(treatments);
            } catch (error) {
                console.error("Failed to fetch initial data for plan:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [patient.id]);

    const patientDoctors = useMemo(() => doctors.filter(d => patient.doctorIds.includes(d.id)), [doctors, patient]);

    const addSession = () => {
        let assignedDoctorId = '';
        if (user.role === UserRole.Doctor && patient.doctorIds.includes(user.id)) {
            assignedDoctorId = user.id;
        } else if (patientDoctors.length > 0) {
            assignedDoctorId = patientDoctors[0].id;
        }
        
        const newSession: PlanSession = {
            clientId: `session_${Date.now()}`,
            title: '',
            doctorId: assignedDoctorId,
            date: new Date().toISOString().split('T')[0],
            notes: '',
            treatments: []
        };
        
        setPlan(prev => [...prev, newSession]);
        setOpenSessionClientId(newSession.clientId);
    };

    const removeSession = (clientId: string) => {
        setPlan(prev => prev.filter(s => s.clientId !== clientId));
    };

    const updateSessionField = (clientId: string, field: keyof Omit<PlanSession, 'treatments' | 'clientId'>, value: any) => {
        setPlan(prev => prev.map(s => s.clientId === clientId ? { ...s, [field]: value } : s));
    };

    const addTreatmentToSession = (clientId: string, treatment: Treatment) => {
        const newSessionTreatment: SessionTreatment = {
            ...treatment,
            instanceId: `new_${Date.now()}_${Math.random()}`,
            sessionId: '', 
            sessionPrice: treatment.price,
            completed: false,
        };
        setPlan(prev => prev.map(s => 
            s.clientId === clientId ? { ...s, treatments: [...s.treatments, newSessionTreatment] } : s
        ));
    };

    const removeTreatmentFromSession = (clientId: string, instanceId: string) => {
        setPlan(prev => prev.map(s =>
            s.clientId === clientId ? { ...s, treatments: s.treatments.filter(t => t.instanceId !== instanceId) } : s
        ));
    };
    
    const handleToggleSession = (clientId: string) => {
        setOpenSessionClientId(prevOpenId => (prevOpenId === clientId ? null : clientId));
    };

    const handleSavePlan = async () => {
        setIsSaving(true);
        try {
            const initialPlan = initialPlanRef.current;
            const currentPlan = plan;
    
            const initialSessionIds = new Set(initialPlan.map(s => s.id).filter(Boolean));
            const currentSessionIds = new Set(currentPlan.map(s => s.id).filter(Boolean));
    
            // 1. Handle Deleted Sessions
            for (const sessionId of initialSessionIds) {
                if (!currentSessionIds.has(sessionId)) {
                    await api.sessions.delete(sessionId!);
                }
            }
    
            for (const session of currentPlan) {
                if (session.id) { // Existing Session - handle updates and treatment changes
                    const initialSession = initialPlan.find(s => s.id === session.id);
                    if (!initialSession) continue;
    
                    // 2. Handle Session Detail Updates
                    if (
                        session.title !== initialSession.title ||
                        session.date !== initialSession.date ||
                        session.doctorId !== initialSession.doctorId ||
                        session.notes !== initialSession.notes
                    ) {
                        await api.sessions.update(session.id, {
                            title: session.title,
                            date: session.date,
                            doctorId: session.doctorId,
                            notes: session.notes,
                        });
                    }
    
                    // 3. Handle Treatment Changes
                    const initialTreatmentIds = new Set(initialSession.treatments.map(t => t.instanceId));
                    const currentTreatmentIds = new Set(session.treatments.map(t => t.instanceId));
                    
                    for (const treatmentId of initialTreatmentIds) {
                        if (!currentTreatmentIds.has(treatmentId)) {
                            await api.sessionTreatments.delete(treatmentId);
                        }
                    }
                    
                    for (const treatment of session.treatments) {
                        if (!initialTreatmentIds.has(treatment.instanceId)) {
                            await api.sessionTreatments.create({
                                session_id: session.id,
                                treatment_name: treatment.name,
                                treatment_price: treatment.sessionPrice,
                                treatment_date: session.date,
                                completed: false,
                            });
                        }
                    }
    
                } else { // New Session - create it and its treatments
                    if (!session.doctorId || !session.date) continue;
                    
                    const newSession = await api.sessions.create({
                        patientId: patient.id,
                        doctorId: session.doctorId,
                        date: session.date,
                        notes: session.notes,
                        treatments: [],
                        title: session.title.trim() || `جلسة بتاريخ ${new Date(session.date).toLocaleDateString()}`
                    });
    
                    for (const treatment of session.treatments) {
                        await api.sessionTreatments.create({
                            session_id: newSession.id,
                            treatment_name: treatment.name,
                            treatment_price: treatment.sessionPrice,
                            treatment_date: newSession.date,
                            completed: false,
                        });
                    }
                }
            }
            alert('تم حفظ الخطة بنجاح!');
            onBack();
        } catch (error) {
            console.error("Failed to save plan:", error);
            let message = 'خطأ غير معروف';
            if (error instanceof Error) {
                message = error.message;
            } else if (typeof error === 'string') {
                message = error;
            }
            alert(`فشل حفظ الخطة: ${message}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    if (loading) {
        return (
            <div className="bg-gray-50 dark:bg-slate-900/50 p-4 sm:p-6 rounded-lg">
                <div className="flex justify-between items-center mb-6">
                     <div className="flex items-center gap-4">
                        <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                            <ArrowBackIcon className="h-5 w-5" />
                            <span>العودة</span>
                        </button>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">خطة العلاج</h1>
                            <p className="text-gray-500 dark:text-gray-400">{patient.name}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md min-h-[200px]">
                    <CenteredLoadingSpinner />
                </div>
            </div>
        );
    }
    
    return (
        <div className="bg-gray-50 dark:bg-slate-900/50 p-4 sm:p-6 rounded-lg">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                        <ArrowBackIcon className="h-5 w-5" />
                        <span>العودة</span>
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">خطة العلاج</h1>
                        <p className="text-gray-500 dark:text-gray-400">{patient.name}</p>
                    </div>
                </div>
                 <button onClick={addSession} className="flex items-center gap-2 px-4 py-2 font-semibold text-primary dark:text-primary-300 bg-primary-100 dark:bg-primary-900/30 rounded-lg shadow-sm hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors">
                    <PlusIcon className="h-5 w-5" />
                    <span>إضافة جلسة جديدة</span>
                </button>
            </div>

            <div className="space-y-4">
                 {plan.length === 0 ? (
                    <div className="text-center py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">لا توجد جلسات في هذه الخطة بعد</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">انقر على "إضافة جلسة جديدة" للبدء.</p>
                    </div>
                ) : (
                    plan.map((session, index) => {
                        const isOpen = openSessionClientId === session.clientId;
                        const isExisting = !!session.id;
                        const inputStyles = `w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black dark:text-white bg-white dark:bg-gray-700`;

                        return (
                            <div key={session.clientId} className={`bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden`}>
                                <button 
                                    type="button"
                                    onClick={() => handleToggleSession(session.clientId)}
                                    className="w-full flex justify-between items-center p-4 text-right hover:bg-gray-50 dark:hover:bg-slate-700/50"
                                    aria-expanded={isOpen}
                                >
                                    <h2 className={`text-xl font-bold ${isExisting ? 'text-gray-600 dark:text-gray-300' : 'text-primary dark:text-primary-300'}`}>{session.title || (isExisting ? `جلسة بتاريخ ${new Date(session.date).toLocaleDateString()}` : `جلسة جديدة ${plan.length - index}`)}</h2>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); removeSession(session.clientId); }} 
                                            className={`p-2 text-red-600 dark:text-red-400 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40`} 
                                            title="إزالة الجلسة"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                        <ChevronDownIcon className={`h-6 w-6 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>
                                <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[1000px]' : 'max-h-0'}`}>
                                    <div className="p-6 pt-2 border-t dark:border-gray-700">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label htmlFor={`title-${session.clientId}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">عنوان الجلسة</label>
                                                <input type="text" id={`title-${session.clientId}`} value={session.title} onChange={e => updateSessionField(session.clientId, 'title', e.target.value)} className={inputStyles} required placeholder="مثال: جلسة تقويم الأسنان الأولى" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">التاريخ</label>
                                                <div className="relative">
                                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                                        <CalendarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                                    </div>
                                                    <input type="date" value={session.date} onChange={e => updateSessionField(session.clientId, 'date', e.target.value)} className={inputStyles} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الطبيب المسؤول</label>
                                                <div className="relative">
                                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                                        <UserCircleIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                                    </div>
                                                    <div className={`${inputStyles.replace('bg-white dark:bg-gray-700', '')} bg-gray-100 dark:bg-slate-700/50 cursor-not-allowed`}>
                                                        {doctors.find(d => d.id === session.doctorId)?.name || 'غير محدد'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ملاحظات الجلسة</label>
                                                <textarea value={session.notes} onChange={e => updateSessionField(session.clientId, 'notes', e.target.value)} rows={2} className={inputStyles.replace('pr-10', '')} placeholder="ملاحظات اختيارية..."></textarea>
                                            </div>
                                        </div>

                                        <div className="mt-6">
                                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">العلاجات</h3>
                                            {session.treatments.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mb-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                                                    {session.treatments.map(t => (
                                                        <span key={t.instanceId} className="inline-flex items-center gap-x-1.5 py-1.5 pl-2 pr-3 rounded-full text-xs font-medium bg-teal-100 text-teal-800 dark:bg-teal-800/30 dark:text-teal-400">
                                                            <span>{t.name}</span>
                                                            <button type="button" onClick={() => removeTreatmentFromSession(session.clientId, t.instanceId)} className="group inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-teal-600 dark:text-teal-400 hover:bg-teal-200 dark:hover:bg-teal-700 hover:text-teal-900 dark:hover:text-white focus:outline-none">
                                                                <XIcon className="h-3 w-3" />
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            <AddTreatmentToPlanSession 
                                                session={session}
                                                allTreatments={allTreatments}
                                                onAdd={(treatment) => addTreatmentToSession(session.clientId, treatment)}
                                                user={user}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            <div className="mt-8 flex justify-end">
                <button onClick={handleSavePlan} disabled={isSaving} className="flex items-center justify-center gap-2 px-8 py-3 bg-green-600 text-white font-bold text-lg rounded-lg shadow-lg hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-wait">
                    {isSaving && <LoadingSpinner className="h-5 w-5 border-white" />}
                    <span>{isSaving ? 'جاري الحفظ...' : 'حفظ الخطة'}</span>
                </button>
            </div>
        </div>
    );
};

// ===================================================================
// Pagination Component
// ===================================================================
const Pagination: React.FC<{
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    return (
        <nav className="flex items-center justify-center mt-8" aria-label="Pagination">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 mx-1 leading-tight text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
                السابق
            </button>
            <div className="flex items-center mx-4">
                <span className="text-sm text-gray-700 dark:text-gray-400">
                    صفحة <span className="font-semibold text-gray-900 dark:text-white">{currentPage}</span> من <span className="font-semibold text-gray-900 dark:text-white">{totalPages}</span>
                </span>
            </div>
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 mx-1 leading-tight text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
                التالي
            </button>
        </nav>
    );
};


// ===================================================================
// PrintOptionsModal Component (NEW)
// ===================================================================
interface PrintOptionsModalProps {
    patientName: string;
    onConfirm: (includeFinancial: boolean) => void;
    onCancel: () => void;
    user: User;
}

const PrintOptionsModal: React.FC<PrintOptionsModalProps> = ({ patientName, onConfirm, onCancel, user }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 transition-opacity" onClick={onCancel}>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md transform transition-all" role="dialog" onClick={e => e.stopPropagation()}>
            <div className="p-6">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/30">
                        <DocumentTextIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-4">طباعة تقرير لـ {patientName}</h3>
                    {user.role !== UserRole.Doctor && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 px-4">هل ترغب في تضمين الملخص المالي في التقرير؟</p>
                    )}
                </div>
            </div>
            <div className="bg-gray-50 dark:bg-slate-700/50 px-6 py-4 rounded-b-2xl flex flex-col sm:flex-row justify-center gap-3">
                {user.role !== UserRole.Doctor ? (
                    <>
                        <button type="button" onClick={() => onConfirm(true)} className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                            نعم، تضمين الملخص
                        </button>
                        <button type="button" onClick={() => onConfirm(false)} className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-500 shadow-sm px-4 py-2 bg-white dark:bg-gray-600 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400">
                            لا، بدون ملخص
                        </button>
                    </>
                ) : (
                     <button type="button" onClick={() => onConfirm(false)} className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                        طباعة التقرير
                    </button>
                )}
                <button type="button" onClick={onCancel} className="mt-2 sm:mt-0 w-full sm:w-auto inline-flex justify-center rounded-md px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white focus:outline-none">
                    إلغاء
                </button>
            </div>
        </div>
    </div>
);


// ===================================================================
// Main PatientsPage Component
// ===================================================================
interface PatientsPageProps {
    user: User;
    refreshTrigger: number;
}
const PatientsPage: React.FC<PatientsPageProps> = ({ user, refreshTrigger }) => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [doctors, setDoctors] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddingPatient, setIsAddingPatient] = useState(false);
    const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
    const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);
    const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
    const [currentPage, setCurrentPage] = useState<'list' | 'details' | 'sessions' | 'payments' | 'gallery' | 'activity' | 'plan'>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [isPrinting, setIsPrinting] = useState<string | null>(null);
    const [patientToPrint, setPatientToPrint] = useState<Patient | null>(null);
    const [forceRefresh, setForceRefresh] = useState(0);
    
    const { settings } = useAppSettings();
    const PATIENTS_PER_PAGE = 10;

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch doctors only on initial load
                const doctorsPromise = doctors.length === 0 ? api.doctors.getAll() : Promise.resolve(null);

                const apiParams: { page: number; per_page: number; search?: string; doctorId?: string; } = {
                    page: page,
                    per_page: PATIENTS_PER_PAGE,
                    search: searchTerm,
                };

                if (user.role === UserRole.Doctor) {
                    apiParams.doctorId = user.id;
                } else if (selectedDoctorId) {
                    apiParams.doctorId = selectedDoctorId;
                }

                const patientsPromise = api.patients.getAll(apiParams);

                const [docsResult, patientsResult] = await Promise.all([doctorsPromise, patientsPromise]);
                
                if (docsResult) {
                    setDoctors(docsResult);
                }
                setPatients(patientsResult.patients);
                setTotalResults(patientsResult.total);
                setTotalPages(patientsResult.last_page);
                setCurrentPage('list'); // Ensure we are on the list view
                
            } catch (error) {
                console.error("Failed to fetch patients:", error);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(() => {
            fetchData();
        }, 300); // Debounce search

        return () => clearTimeout(timer);
    }, [page, searchTerm, selectedDoctorId, refreshTrigger, doctors.length, forceRefresh, user.id, user.role]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };


    const handlePrintReport = async (patient: Patient, includeFinancial: boolean) => {
        setPatientToPrint(null);
        setIsPrinting(patient.id);
    
        const [allSessions] = await Promise.all([
            api.sessions.getAll(),
        ]);

        const sessions = allSessions.filter(s => s.patientId === patient.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const getDoctorName = (doctorId: string) => doctors.find(d => d.id === doctorId)?.name || 'غير معروف';
    
        const patientDoctors = doctors.filter(d => patient.doctorIds.includes(d.id));
        const shouldShowFinancial = user.role !== UserRole.Doctor && includeFinancial;

        let financialHTML = '';
        const totalCost = sessions.reduce((sessionSum, s) => {
            const treatmentsCost = s.treatments.reduce((treatmentSum, t) => {
                return treatmentSum + t.sessionPrice + (t.additionalCosts || 0);
            }, 0);
            return sessionSum + treatmentsCost;
        }, 0);

        if (shouldShowFinancial) {
            const allPaymentsResponse = await api.payments.getAll({ page: 1, per_page: 9999 });
            const allPayments = allPaymentsResponse.payments;
            const payments = allPayments.filter(p => p.patientId === patient.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
            const balance = totalCost - totalPayments;
        
            financialHTML = `
                <section class="mt-8">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">الملخص المالي</h2>
                     ${payments.length > 0 ? `
                         <div class="mb-4 break-inside-avoid">
                            <h3 class="font-semibold mb-2">الدفعات المسجلة</h3>
                            <table class="w-full text-right text-sm">
                                <thead class="text-xs text-gray-700 uppercase bg-gray-100">
                                    <tr><th class="px-2 py-1">التاريخ</th><th class="px-2 py-1">المبلغ</th></tr>
                                </thead>
                                <tbody>
                                ${payments.map(p => `
                                    <tr class="border-b">
                                        <td class="px-2 py-1">${new Date(p.date).toLocaleDateString()}</td>
                                        <td class="px-2 py-1">SYP ${p.amount.toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                                </tbody>
                            </table>
                         </div>
                     ` : ''}
                    <div class="border-t border-gray-300 pt-4 space-y-2 text-md">
                         <div class="flex justify-between"><span class="font-medium text-gray-600">إجمالي التكاليف:</span><span class="font-bold">SYP ${totalCost.toFixed(2)}</span></div>
                         <div class="flex justify-between"><span class="font-medium text-gray-600">إجمالي المدفوعات:</span><span class="font-bold text-green-600">SYP ${totalPayments.toFixed(2)}</span></div>
                         <div class="flex justify-between text-lg"><span class="font-bold">الرصيد المتبقي:</span><span class="font-bold">SYP ${balance.toFixed(2)}</span></div>
                    </div>
                </section>
            `;
        }
        
        const patientDetailsHTML = `
            <div class="flex flex-wrap -mx-2 text-sm mb-2">
                <div class="px-2 mb-2">
                    <span class="font-medium text-gray-500">الاسم: </span>
                    <span class="text-gray-900 font-semibold">${patient.name}</span>
                </div>
                <div class="px-2 mb-2">
                    <span class="font-medium text-gray-500">الكود: </span>
                    <span class="text-gray-900 font-semibold">${patient.code}</span>
                </div>
                <div class="px-2 mb-2">
                    <span class="font-medium text-gray-500">العمر: </span>
                    <span class="text-gray-900 font-semibold">${patient.age}</span>
                </div>
                <div class="px-2 mb-2">
                    <span class="font-medium text-gray-500">الهاتف: </span>
                    <span class="text-gray-900 font-semibold">${patient.phone}</span>
                </div>
                <div class="px-2 mb-2">
                    <span class="font-medium text-gray-500">الجنس: </span>
                    <span class="text-gray-900 font-semibold">${patient.gender === 'female' ? 'أنثى' : 'ذكر'}</span>
                </div>
                ${patient.isSmoker ? `<div class="px-2 mb-2"><span class="font-medium text-gray-500">مدخن: </span><span class="text-gray-900 font-semibold">نعم</span></div>` : ''}
                ${patient.gender === 'female' && patient.isPregnant ? `<div class="px-2 mb-2"><span class="font-medium text-gray-500">حامل: </span><span class="text-gray-900 font-semibold">نعم</span></div>` : ''}
            </div>
            <dl class="text-sm">
                <div class="py-2 border-t border-gray-200 grid grid-cols-3 gap-4">
                    <dt class="font-medium text-gray-500">الأطباء</dt>
                    <dd class="text-gray-900 sm:mt-0 col-span-2">${patientDoctors.map(d => d.name).join(', ')}</dd>
                </div>
                <div class="py-2 border-t border-gray-200 grid grid-cols-3 gap-4">
                    <dt class="font-medium text-gray-500">الحساسية الدوائية</dt>
                    <dd class="text-gray-900 sm:mt-0 col-span-2">${patient.drugAllergy || 'لا يوجد'}</dd>
                </div>
                <div class="py-2 border-t border-gray-200 grid grid-cols-3 gap-4">
                    <dt class="font-medium text-gray-500">الأمراض المزمنة</dt>
                    <dd class="text-gray-900 sm:mt-0 col-span-2">${patient.chronicDiseases || 'لا يوجد'}</dd>
                </div>
                <div class="py-2 border-t border-gray-200 grid grid-cols-3 gap-4">
                    <dt class="font-medium text-gray-500">ملاحظات عامة</dt>
                    <dd class="text-gray-900 sm:mt-0 col-span-2">${patient.notes || 'لا يوجد'}</dd>
                </div>
            </dl>
        `;
    
        const sessionsHTML = sessions.length > 0 ? `
            <section class="mt-8">
                <h2 class="text-xl font-bold text-gray-800 mb-4">سجل الجلسات</h2>
                <div class="space-y-4">
                    ${sessions.map(session => `
                        <div class="border border-gray-200 rounded-lg p-4 break-inside-avoid">
                            <h3 class="font-semibold">${session.title || `جلسة بتاريخ ${new Date(session.date).toLocaleDateString()}`} - الطبيب: ${getDoctorName(session.doctorId)}</h3>
                            ${session.notes ? `<p class="text-sm text-gray-600 mt-1">ملاحظات الجلسة: ${session.notes}</p>` : ''}
                            ${session.treatments.length > 0 ? `
                                 <table class="w-full text-right text-sm mt-2">
                                    <thead class="text-xs text-gray-700 uppercase bg-gray-100">
                                        <tr>
                                            <th class="px-2 py-1">العلاج</th>
                                            <th class="px-2 py-1">التاريخ</th>
                                            ${shouldShowFinancial ? '<th class="px-2 py-1">السعر</th>' : ''}
                                            <th class="px-2 py-1">ملاحظات</th>
                                            <th class="px-2 py-1">مكتمل</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    ${session.treatments.map(t => `
                                        <tr class="border-b">
                                            <td class="px-2 py-1">${t.name}</td>
                                            <td class="px-2 py-1">${t.treatmentDate ? new Date(t.treatmentDate).toLocaleDateString() : '-'}</td>
                                            ${shouldShowFinancial ? `<td class="px-2 py-1">SYP ${(t.sessionPrice + (t.additionalCosts || 0)).toFixed(2)}</td>` : ''}
                                            <td class="px-2 py-1">${t.sessionNotes || '-'}</td>
                                            <td class="px-2 py-1">${t.completed ? 'نعم' : 'لا'}</td>
                                        </tr>
                                    `).join('')}
                                    </tbody>
                                 </table>
                            ` : '<p class="text-sm text-gray-500 mt-2">لا توجد علاجات لهذه الجلسة.</p>'}
                        </div>
                    `).join('')}
                </div>
            </section>
        ` : '';
    
        const reportHTML = `
          <!DOCTYPE html>
          <html lang="ar" dir="rtl">
            <head>
              <meta charset="UTF-8" />
              <title>تقرير - ${patient.name}</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <script>
                tailwind.config = {
                  theme: {
                    extend: {
                      colors: {
                        primary: {
                          DEFAULT: '#06b6d4', '50': '#ecfeff', '100': '#cffafe', '200': '#a5f3fd',
                          '300': '#67e8f9', '400': '#22d3ee', '500': '#06b6d4', '600': '#0891b2',
                          '700': '#0e7490', '800': '#155e75', '900': '#164e63', '950': '#083344',
                        },
                      }
                    }
                  }
                }
              </script>
              <style>
                @media print {
                  @page { size: A4; margin: 20mm; }
                  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                  .no-print { display: none !important; }
                }
                body { font-family: sans-serif; }
              </style>
            </head>
            <body class="bg-white">
              <div id="printable-report" class="p-6 md:p-8">
                <header class="flex justify-between items-start border-b border-gray-300 pb-4 mb-6">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-800">${settings.appName}</h1>
                        <p class="text-gray-500">تقرير المريض</p>
                    </div>
                     <img src="${settings.appLogo}" alt="شعار التطبيق" class="h-16 w-16" />
                </header>
                <section>
                    <h2 class="text-xl font-bold text-gray-800 mb-2">معلومات المريض</h2>
                    ${patientDetailsHTML}
                </section>
                ${sessionsHTML}
                ${financialHTML}
                <footer class="text-center text-xs text-gray-400 mt-8 pt-4 border-t border-gray-300">
                    تاريخ الطباعة: ${new Date().toLocaleString()}
                </footer>
              </div>
            </body>
          </html>
        `;
    
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.open();
            printWindow.document.write(reportHTML);
            printWindow.document.close();
            printWindow.onload = () => {
                printWindow.focus();
                printWindow.print();
            };
        }
        
        setIsPrinting(null);
    };

    const handleCreatePatient = async (newPatientData: Omit<Patient, 'id' | 'code'>) => {
        await api.patients.create(newPatientData, user.id);
        setIsAddingPatient(false);
        // After creating, go to page 1 and trigger a refresh.
        // Setting page to 1 won't trigger if it's already 1, so forceRefresh is needed.
        setPage(1);
        setForceRefresh(c => c + 1);
    };

    const handleUpdatePatient = async (updatedPatient: Patient) => {
        await api.patients.update(updatedPatient.id, updatedPatient, user.id);
        setEditingPatient(null);
        setForceRefresh(c => c + 1);
    };

    const confirmDeletePatient = async () => {
        if (deletingPatient) {
            await api.patients.delete(deletingPatient.id, user.id);
            setDeletingPatient(null);
            setForceRefresh(c => c + 1);
        }
    };
    
    const viewDetails = (patient: Patient, page: 'details' | 'sessions' | 'payments' | 'gallery' | 'activity' | 'plan') => {
        setViewingPatient(patient);
        setCurrentPage(page);
    };


    if (viewingPatient && currentPage === 'details') {
        return <PatientDetailsPage patient={viewingPatient} onBack={() => setCurrentPage('list')} doctors={doctors} />;
    }
    if (viewingPatient && currentPage === 'sessions') {
        return <PatientSessionsPage patient={viewingPatient} onBack={() => setCurrentPage('list')} doctors={doctors} user={user} />;
    }
     if (viewingPatient && currentPage === 'payments') {
        return <PatientPaymentsPage patient={viewingPatient} onBack={() => setCurrentPage('list')} />;
    }
    if (viewingPatient && currentPage === 'gallery') {
        return <PatientGalleryPage patient={viewingPatient} onBack={() => setCurrentPage('list')} />;
    }
    if (viewingPatient && currentPage === 'activity') {
        return <PatientActivityLogPage patient={viewingPatient} onBack={() => setCurrentPage('list')} />;
    }
    if (viewingPatient && currentPage === 'plan') {
        return <PatientPlanPage patient={viewingPatient} onBack={() => setCurrentPage('list')} doctors={doctors} user={user} />;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">
                    {user.role === UserRole.Doctor ? 'مرضاي' : 'إدارة المرضى'}
                </h1>
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="relative">
                       <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                           <SearchIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                       </div>
                       <input
                           type="text"
                           value={searchTerm}
                           onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                           }}
                           placeholder="ابحث بالاسم، الكود، أو الهاتف..."
                           className="w-full sm:w-64 pl-3 pr-10 py-2 bg-white dark:bg-gray-700 text-black dark:text-white border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                       />
                    </div>
                     {user.role !== UserRole.Doctor && (
                         <div className="relative">
                            <select
                                value={selectedDoctorId}
                                onChange={(e) => {
                                    setSelectedDoctorId(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full sm:w-48 px-3 py-2 pr-8 bg-white dark:bg-gray-700 text-black dark:text-white border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none"
                                aria-label="Filter by doctor"
                            >
                                <option value="">كل الأطباء</option>
                                {doctors.map(doctor => (
                                    <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                     {(user.role === UserRole.Admin || user.role === UserRole.SubManager || user.role === UserRole.Secretary || user.role === UserRole.Doctor) && (
                        <button onClick={() => setIsAddingPatient(true)} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700 transition-colors">
                            <PlusIcon className="h-5 w-5 ml-2" />
                            إضافة مريض
                        </button>
                     )}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md min-h-[200px]">
                {loading ? <CenteredLoadingSpinner /> : (
                     patients.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {patients.map(p => (
                                    <div key={p.id} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col justify-between transition-shadow hover:shadow-lg">
                                        <div>
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{p.name}</h3>
                                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">{p.code}</span>
                                            </div>
                                            <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                                <p><span className="font-semibold">العمر:</span> {p.age}</p>
                                                <p><span className="font-semibold">الهاتف:</span> {p.phone}</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t dark:border-gray-600 flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
                                            <button onClick={() => viewDetails(p, 'details')} className="flex items-center text-gray-600 dark:text-gray-300 hover:text-primary p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-sm" title="عرض التفاصيل"><EyeIcon className="h-4 w-4" /><span className="mr-1">التفاصيل</span></button>
                                            {user.role !== UserRole.Secretary && (
                                                <>
                                                    <button onClick={() => viewDetails(p, 'sessions')} className="flex items-center text-teal-600 dark:text-teal-400 hover:text-teal-800 p-1 rounded hover:bg-teal-100 dark:hover:bg-teal-900/40 text-sm"><ClipboardListIcon className="h-4 w-4" /><span className="mr-1">الجلسات</span></button>
                                                    <button onClick={() => viewDetails(p, 'plan')} className="flex items-center text-purple-600 dark:text-purple-400 hover:text-purple-800 p-1 rounded hover:bg-purple-100 dark:hover:bg-purple-900/40 text-sm"><DocumentTextIcon className="h-4 w-4" /><span className="mr-1">الخطة</span></button>
                                                </>
                                            )}
                                            <button onClick={() => viewDetails(p, 'gallery')} className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 p-1 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-sm"><PhotographIcon className="h-4 w-4" /><span className="mr-1">الصور</span></button>
                                            
                                            {user.role !== UserRole.Doctor && (
                                                <button onClick={() => viewDetails(p, 'payments')} className="flex items-center text-green-600 dark:text-green-400 hover:text-green-800 p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/40 text-sm"><CurrencyDollarIcon className="h-4 w-4" /><span className="mr-1">المالية</span></button>
                                            )}
                                            
                                            {(user.role === UserRole.Admin || user.role === UserRole.SubManager) && (
                                                <button onClick={() => viewDetails(p, 'activity')} className="flex items-center text-orange-600 dark:text-orange-400 hover:text-orange-800 p-1 rounded hover:bg-orange-100 dark:hover:bg-orange-900/40 text-sm"><ListBulletIcon className="h-4 w-4" /><span className="mr-1">السجل</span></button>
                                            )}
                                            
                                            
                                            <button 
                                                onClick={() => setPatientToPrint(p)} 
                                                disabled={isPrinting === p.id}
                                                className="flex items-center text-red-600 dark:text-red-400 hover:text-red-800 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/40 text-sm disabled:opacity-50 disabled:cursor-wait" 
                                                title="طباعة تقرير"
                                            >
                                                {isPrinting === p.id ? <LoadingSpinner className="h-4 w-4" /> : <DocumentTextIcon className="h-4 w-4" />}
                                                <span className="mr-1">طباعة</span>
                                            </button>
                                            

                                            {(user.role === UserRole.Admin || user.role === UserRole.Secretary || user.role === UserRole.Doctor) && (
                                                <button onClick={() => setEditingPatient(p)} className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 text-sm"><PencilIcon className="h-4 w-4" /><span className="mr-1">تعديل</span></button>
                                            )}
                                            {(user.role === UserRole.Admin || user.role === UserRole.Secretary) && (
                                                <button onClick={() => setDeletingPatient(p)} className="flex items-center text-red-600 dark:text-red-400 hover:text-red-800 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/40 text-sm"><TrashIcon className="h-4 w-4" /><span className="mr-1">حذف</span></button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 flex justify-between items-center">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    عرض {patients.length} من أصل {totalResults} مرضى
                                </p>
                                <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
                            </div>
                        </>
                    ) : (
                         <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                            {user.role === UserRole.Doctor ? 'لا يوجد مرضى مسجلون لك حالياً.' : 'لم يتم العثور على مرضى.'}
                        </p>
                    )
                )}
            </div>
            {isAddingPatient && <AddPatientModal onClose={() => setIsAddingPatient(false)} onSave={handleCreatePatient} doctors={doctors} user={user} />}
            {editingPatient && <EditPatientModal patient={editingPatient} onClose={() => setEditingPatient(null)} onSave={handleUpdatePatient} doctors={doctors} user={user} />}
            {deletingPatient && (
                <ConfirmDeleteModal
                    title="حذف مريض"
                    message={`هل أنت متأكد من رغبتك في حذف ${deletingPatient.name}؟ لا يمكن التراجع عن هذا الإجراء.`}
                    onConfirm={confirmDeletePatient}
                    onCancel={() => setDeletingPatient(null)}
                />
            )}
            {patientToPrint && (
                <PrintOptionsModal 
                    patientName={patientToPrint.name}
                    onCancel={() => setPatientToPrint(null)}
                    onConfirm={(includeFinancial) => handlePrintReport(patientToPrint, includeFinancial)}
                    user={user}
                />
            )}
        </div>
    );
};

export default PatientsPage;