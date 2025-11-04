import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Patient, PatientPhoto, CreatePatientPhotosPayload, User } from '../types';
import { api } from '../services/api';
import { CenteredLoadingSpinner } from '../components/LoadingSpinner';
import { PlusIcon, PencilIcon, TrashIcon, XIcon, ArrowBackIcon, PhotographIcon, MinusIcon, ResetIcon, ArrowDownOnSquareIcon } from '../components/Icons';


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

const getDistance = (touches: React.TouchList): number => {
    const [touch1, touch2] = [touches[0], touches[1]];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };
  
  const getMidpoint = (touches: React.TouchList): { x: number; y: number } => {
    const [touch1, touch2] = [touches[0], touches[1]];
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  };

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ imageUrl, onClose }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startDrag, setStartDrag] = useState({ x: 0, y: 0 });
    const [pinchDistance, setPinchDistance] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);


    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const newScale = e.deltaY > 0 ? scale / 1.1 : scale * 1.1;
        const clampedScale = Math.min(Math.max(0.5, newScale), 5);
    
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
    
        const zoomPointOnScreenX = e.clientX - rect.left;
        const zoomPointOnScreenY = e.clientY - rect.top;
    
        const newPosX = zoomPointOnScreenX - (zoomPointOnScreenX - position.x) * (clampedScale / scale);
        const newPosY = zoomPointOnScreenY - (zoomPointOnScreenY - position.y) * (clampedScale / scale);
    
        setScale(clampedScale);
        setPosition({ x: newPosX, y: newPosY });
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

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            setIsDragging(false);
            setPinchDistance(getDistance(e.touches));
        } else if (e.touches.length === 1) {
            setIsDragging(true);
            setStartDrag({
                x: e.touches[0].clientX - position.x,
                y: e.touches[0].clientY - position.y,
            });
        }
    };
    
    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 2 && pinchDistance !== null) {
            e.preventDefault();
            const newDistance = getDistance(e.touches);
            const scaleRatio = newDistance / pinchDistance;
            const newScale = Math.min(Math.max(0.5, scale * scaleRatio), 5);
            
            const midpoint = getMidpoint(e.touches);
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
    
            const zoomPointOnScreenX = midpoint.x - rect.left;
            const zoomPointOnScreenY = midpoint.y - rect.top;
    
            const newPosX = zoomPointOnScreenX - (zoomPointOnScreenX - position.x) * (newScale / scale);
            const newPosY = zoomPointOnScreenY - (zoomPointOnScreenY - position.y) * (newScale / scale);
    
            setScale(newScale);
            setPosition({ x: newPosX, y: newPosY });
            setPinchDistance(newDistance);
    
        } else if (isDragging && e.touches.length === 1) {
            setPosition({
                x: e.touches[0].clientX - startDrag.x,
                y: e.touches[0].clientY - startDrag.y,
            });
        }
    };
    
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (e.touches.length < 2) {
            setPinchDistance(null);
        }
        if (e.touches.length < 1) {
            setIsDragging(false);
        }
    };


    const reset = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };
    
    const zoomIn = () => setScale(s => Math.min(s * 1.2, 5));
    const zoomOut = () => setScale(s => Math.max(s / 1.2, 0.5));

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-80 z-[100] flex justify-center items-center" 
            onClick={onClose}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <div 
                ref={containerRef}
                className="relative w-full h-full flex justify-center items-center overflow-hidden"
                onWheel={handleWheel}
                onClick={e => e.stopPropagation()}
                onTouchStart={handleTouchStart}
            >
                <img
                    src={imageUrl}
                    alt="Full screen view"
                    className={`max-w-[90vw] max-h-[90vh] object-contain transition-transform duration-100 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        touchAction: 'none'
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseUp}
                />
            </div>
            
            <div className="absolute top-4 right-4 flex flex-col gap-2">
                 <button onClick={onClose} className="p-2 bg-gray-800 bg-opacity-50 text-white rounded-full hover:bg-opacity-75 focus:outline-none">
                    <XIcon className="w-6 h-6" />
                </button>
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-gray-800 bg-opacity-50 text-white rounded-full">
                <button onClick={(e) => { e.stopPropagation(); zoomOut(); }} className="p-2 hover:bg-gray-700 rounded-full focus:outline-none"><MinusIcon className="w-6 h-6" /></button>
                <button onClick={(e) => { e.stopPropagation(); reset(); }} className="p-2 hover:bg-gray-700 rounded-full focus:outline-none"><ResetIcon className="w-6 h-6" /></button>
                <button onClick={(e) => { e.stopPropagation(); zoomIn(); }} className="p-2 hover:bg-gray-700 rounded-full focus:outline-none"><PlusIcon className="w-6 h-6" /></button>
            </div>
        </div>
    );
};

// ===================================================================
// PatientPhotosPage Component
// ===================================================================
interface PatientPhotosPageProps {
    patient: Patient;
    user: User;
    onBack: () => void;
    refreshTrigger: number;
}

const PatientPhotosPage: React.FC<PatientPhotosPageProps> = ({ patient, user, onBack, refreshTrigger }) => {
    const [photos, setPhotos] = useState<PatientPhoto[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingPhoto, setEditingPhoto] = useState<PatientPhoto | null>(null);
    const [deletingPhoto, setDeletingPhoto] = useState<PatientPhoto | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [viewingPhotoUrl, setViewingPhotoUrl] = useState<string | null>(null);

    const fetchPhotos = useCallback(async () => {
        setLoading(true);
        const allPhotos = await api.patientPhotos.getAll();
        setPhotos(allPhotos.filter(p => p.patientId === patient.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setLoading(false);
    }, [patient.id]);

    useEffect(() => {
        fetchPhotos();
    }, [fetchPhotos, refreshTrigger]);

    const handleSavePhoto = async (data: PatientPhoto | CreatePatientPhotosPayload) => {
        if ('id' in data) {
            await api.patientPhotos.update(data.id, data, user.id);
        } else {
            await api.patientPhotos.create(data, user.id);
        }
        setIsAdding(false);
        setEditingPhoto(null);
        await fetchPhotos();
    };

    const confirmDeletePhoto = async () => {
        if (deletingPhoto) {
            setIsDeleting(true);
            try {
                await api.patientPhotos.delete(deletingPhoto.id, user.id);
                setDeletingPhoto(null);
                await fetchPhotos();
            } catch (error) {
                alert(`فشل في حذف الصورة: ${error instanceof Error ? error.message : "خطأ غير معروف"}`);
            } finally {
                setIsDeleting(false);
            }
        }
    };
    
    const handleDownload = (imageUrl: string, filename: string) => {
        try {
            const a = document.createElement('a');
            a.href = imageUrl;
            a.download = filename;
            a.target = '_blank'; // Open in new tab as a fallback for cross-origin
            a.rel = 'noopener noreferrer';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download failed:', error);
            alert('فشل تحميل الصورة. يرجى المحاولة مرة أخرى.');
        }
    };


    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary" aria-label="العودة">
                        <ArrowBackIcon className="h-5 w-5" />
                    </button>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">{patient.name}</p>
                    </div>
                </div>
                <button onClick={() => setIsAdding(true)} className="hidden lg:flex items-center bg-primary text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700 transition-colors">
                    <PlusIcon className="h-5 w-5 ml-2" />
                    إضافة صورة
                </button>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md min-h-[200px]">
                {loading ? <CenteredLoadingSpinner /> : photos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {photos.map(photo => (
                            <div key={photo.id} className="border bg-gray-50 dark:bg-gray-800 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-shadow">
                                <img
                                    src={photo.imageUrl}
                                    alt={photo.caption}
                                    className="w-full h-48 object-cover cursor-pointer"
                                    onClick={() => setViewingPhotoUrl(photo.imageUrl)}
                                    loading="lazy"
                                    decoding="async"
                                />
                                <div className="p-4">
                                    <p className="font-semibold text-gray-800 dark:text-gray-100">{photo.caption || "بدون تعليق"}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(photo.date).toLocaleDateString()}</p>
                                    <div className="mt-4 flex justify-end gap-2">
                                        <button 
                                            onClick={() => handleDownload(photo.imageUrl, `patient_${patient.code}_photo_${photo.id}.jpg`)}
                                            className="p-2 rounded-full hover:bg-green-100 dark:hover:bg-green-900/40 text-green-600 dark:text-green-400"
                                            title="تحميل الصورة"
                                        >
                                            <ArrowDownOnSquareIcon className="h-5 w-5" />
                                        </button>
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

            <button 
                onClick={() => setIsAdding(true)} 
                className="lg:hidden fixed bottom-20 right-4 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary-700 transition-colors z-20"
                aria-label="إضافة صورة"
            >
                <PlusIcon className="h-6 w-6" />
            </button>

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
                    onCancel={() => !isDeleting && setDeletingPhoto(null)}
                    isDeleting={isDeleting}
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

export default PatientPhotosPage;
