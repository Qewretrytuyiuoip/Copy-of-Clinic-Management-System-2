
import React, { useEffect, useState, useCallback } from 'react';
import { User, Patient, Session, SessionTreatment, Treatment, UserRole } from '../types';
import { api } from '../services/api';
import { PlusIcon, PencilIcon, TrashIcon, XIcon, ClipboardListIcon, BeakerIcon, ArrowBackIcon, EyeIcon, CheckIcon, PhotographIcon } from '../components/Icons';
import LoadingSpinner, { CenteredLoadingSpinner } from '../components/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import DentalChart from '../components/DentalChart';
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
        number: treatment.number?.toString() || '',
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
                number: formData.number ? parseInt(formData.number, 10) : undefined,
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
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="treatmentDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاريخ العلاج</label>
                                <input type="date" id="treatmentDate" name="treatmentDate" value={formData.treatmentDate} onChange={handleChange} required className={inputStyle} />
                            </div>
                            <div>
                                <label htmlFor="number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رقم العلاج</label>
                                <input type="number" id="number" name="number" value={formData.number} onChange={handleChange} className={inputStyle} placeholder="مثال: 25"/>
                            </div>
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
                    {treatment.number && (
                        <div className="pt-3">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">رقم العلاج</p>
                            <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">{treatment.number}</p>
                        </div>
                    )}
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
// AddTreatmentToSessionModal Component
// ===================================================================
interface AddTreatmentToSessionModalProps {
    session: Session;
    onSave: (keepOpen?: boolean) => Promise<void>;
    onClose: () => void;
    user: User;
    initialNumber?: number;
}

const AddTreatmentToSessionModal: React.FC<AddTreatmentToSessionModalProps> = ({ session, onSave, onClose, user, initialNumber }) => {
    const [allTreatments, setAllTreatments] = useState<Treatment[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTreatmentId, setSelectedTreatmentId] = useState('');
    const [sessionPrice, setSessionPrice] = useState('');
    const [sessionNotes, setSessionNotes] = useState('');
    const [treatmentDate, setTreatmentDate] = useState(new Date().toISOString().split('T')[0]);
    const [additionalCosts, setAdditionalCosts] = useState('');
    const [treatmentNumber, setTreatmentNumber] = useState(initialNumber ? initialNumber.toString() : '');
    const [isSaving, setIsSaving] = useState(false); // For "save and close"
    const [isSavingAndAdding, setIsSavingAndAdding] = useState(false); // For "save and add"
    const inputStyle = "w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black dark:text-white";

    useEffect(() => {
        const fetchTreatments = async () => {
            setLoading(true);
            const availableTreatments = await api.treatmentSettings.getAll();
            setAllTreatments(availableTreatments);
            setLoading(false);
        };
        fetchTreatments();
    }, []);
    
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
        // Keep treatmentNumber if in standard mode, maybe reset it? 
        // If coming from interactive chart, usually we add one per tooth, so maybe keep it.
        // But for standard behavior, let's keep it as is or reset if needed.
        if (!initialNumber) setTreatmentNumber(''); 
        document.getElementById('treatment')?.focus();
    }, [initialNumber]);

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
                number: treatmentNumber ? parseInt(treatmentNumber, 10) : undefined,
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
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="treatmentDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاريخ العلاج</label>
                                        <input type="date" id="treatmentDate" value={treatmentDate} onChange={e => setTreatmentDate(e.target.value)} required className={inputStyle} />
                                    </div>
                                    <div>
                                        <label htmlFor="treatmentNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رقم العلاج</label>
                                        <input type="number" id="treatmentNumber" value={treatmentNumber} onChange={e => setTreatmentNumber(e.target.value)} className={inputStyle} placeholder="مثال: 25"/>
                                    </div>
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
// ToothTreatmentsModal Component (New)
// ===================================================================
interface ToothTreatmentsModalProps {
    toothNumber: number;
    treatments: SessionTreatment[];
    onClose: () => void;
    onAddTreatment: () => void;
    onDeleteTreatment: (treatment: SessionTreatment) => void;
    onEditTreatment: (treatment: SessionTreatment) => void;
    onToggleComplete: (treatment: SessionTreatment) => void;
}

const ToothTreatmentsModal: React.FC<ToothTreatmentsModalProps> = ({ 
    toothNumber, 
    treatments, 
    onClose, 
    onAddTreatment,
    onDeleteTreatment,
    onEditTreatment,
    onToggleComplete 
}) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-sm" role="dialog" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">السن رقم {toothNumber}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" /></button>
                </div>
                <div className="p-4 max-h-[60vh] overflow-y-auto">
                    {treatments.length > 0 ? (
                        <ul className="space-y-3">
                            {treatments.map(t => (
                                <li key={t.instanceId} className="bg-gray-50 dark:bg-slate-700/50 p-3 rounded-md border border-gray-100 dark:border-gray-600">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`font-semibold ${t.completed ? 'text-green-600 dark:text-green-400' : 'text-orange-500'}`}>
                                            {t.name}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {new Date(t.treatmentDate || '').toLocaleDateString()}
                                        </span>
                                    </div>
                                    {t.sessionNotes && <p className="text-sm text-gray-600 dark:text-gray-300">{t.sessionNotes}</p>}
                                    
                                    {/* Action Buttons Row */}
                                    <div className="flex justify-end items-center gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                        <button 
                                            onClick={() => onToggleComplete(t)}
                                            className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors"
                                            title={t.completed ? "تمييز كغير مكتمل" : "تمييز كمكتمل"}
                                        >
                                            {t.completed ? <CheckIcon className="h-4 w-4 text-green-500" /> : <div className="h-4 w-4 rounded-full border border-gray-400"></div>}
                                        </button>
                                        <button 
                                            onClick={() => onEditTreatment(t)}
                                            className="p-1.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors"
                                            title="تعديل"
                                        >
                                            <PencilIcon className="h-4 w-4" />
                                        </button>
                                        <button 
                                            onClick={() => onDeleteTreatment(t)}
                                            className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                                            title="حذف"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-4">لا توجد علاجات مسجلة لهذا السن في هذه الجلسة.</p>
                    )}
                </div>
                <div className="flex justify-center p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-slate-700/50 rounded-b-lg">
                    <button 
                        onClick={onAddTreatment}
                        className="w-full flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700 transition-colors"
                    >
                        <PlusIcon className="h-5 w-5" />
                        إضافة علاج
                    </button>
                </div>
            </div>
        </div>
    );
};


// ===================================================================
// SessionTreatmentsPage Component
// ===================================================================
interface SessionTreatmentsPageProps {
    patient: Patient;
    session: Session;
    onBack: () => void;
    user: User;
    refreshTrigger: number;
}

const SessionTreatmentsPage: React.FC<SessionTreatmentsPageProps> = ({ patient, session: initialSession, onBack, user, refreshTrigger }) => {
    const [session, setSession] = useState<Session>(initialSession);
    const [loading, setLoading] = useState(false);
    
    // View Mode State
    const [viewMode, setViewMode] = useState<'list' | 'chart'>('list');
    
    const [isAddingTreatment, setIsAddingTreatment] = useState(false);
    const [treatmentToDelete, setTreatmentToDelete] = useState<SessionTreatment | null>(null);
    const [editingTreatment, setEditingTreatment] = useState<SessionTreatment | null>(null);
    const [viewingTreatment, setViewingTreatment] = useState<SessionTreatment | null>(null);
    const [updatingTreatmentId, setUpdatingTreatmentId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Interactive Chart States
    const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
    const [prefilledToothNumber, setPrefilledToothNumber] = useState<number | undefined>(undefined);

    const { data: centerData } = useQuery({
        queryKey: ['center', user?.center_id],
        queryFn: () => api.centers.getOne(),
        enabled: !!user?.center_id,
    });

    const fetchSessionDetails = useCallback(async () => {
        setLoading(true);
        try {
            const updatedSession = await api.sessions.getById(initialSession.id);
            if (updatedSession) {
                setSession(updatedSession);
            }
        } catch (error) {
            console.error("Failed to fetch session details:", error);
            alert("فشل في تحديث بيانات الجلسة.");
        } finally {
            setLoading(false);
        }
    }, [initialSession.id]);

    useEffect(() => {
        // Set initial session from props, then fetch latest
        setSession(initialSession);
        fetchSessionDetails();
    }, [initialSession, refreshTrigger, fetchSessionDetails]);

    const handleUpdateAndRefetch = useCallback(async () => {
        await fetchSessionDetails();
        await api.patients.updateCompletionStatus(patient.id, user.id);
    }, [fetchSessionDetails, patient.id, user.id]);

    const handleSaveTreatment = async (keepModalOpen?: boolean) => {
        if (!keepModalOpen) {
            setIsAddingTreatment(false);
            setPrefilledToothNumber(undefined); // Reset prefilled number
        }
        await handleUpdateAndRefetch();
    };
    
    const handleUpdateTreatment = async () => {
        setEditingTreatment(null);
        await handleUpdateAndRefetch();
    }

    const confirmDeleteTreatment = async () => {
        if (treatmentToDelete) {
            setIsDeleting(true);
            try {
                await api.sessionTreatments.delete(treatmentToDelete.instanceId);
                setTreatmentToDelete(null);
                await handleUpdateAndRefetch();
            } finally {
                setIsDeleting(false);
            }
        }
    };
    
    const handleToggleTreatmentComplete = async (treatment: SessionTreatment) => {
        setUpdatingTreatmentId(treatment.instanceId);
        try {
            await api.sessionTreatments.update(treatment.instanceId, { completed: !treatment.completed });
            await handleUpdateAndRefetch();
        } catch (error) {
            console.error("Failed to update treatment status:", error);
            alert('فشل في تحديث حالة العلاج.');
        } finally {
            setUpdatingTreatmentId(null);
        }
    };
    
    // Interactive Chart Handlers
    const handleToothClick = (toothNumber: number) => {
        setSelectedTooth(toothNumber);
    };

    const handleAddTreatmentFromChart = () => {
        if (selectedTooth) {
            setPrefilledToothNumber(selectedTooth);
            setSelectedTooth(null); // Close the detail modal
            setIsAddingTreatment(true); // Open the add form
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary" aria-label="العودة للجلسات">
                        <ArrowBackIcon className="h-5 w-5" />
                    </button>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">للمريض: {patient.name} - بتاريخ {new Date(session.date).toLocaleDateString()}</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {/* Toggle View Button */}
                    {centerData?.type === 'أسنان' && (
                        <button 
                            onClick={() => setViewMode(prev => prev === 'list' ? 'chart' : 'list')}
                            className={`flex items-center px-4 py-2 rounded-lg shadow transition-colors font-medium ${viewMode === 'chart' ? 'bg-primary text-white hover:bg-primary-700' : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-600 border border-gray-200 dark:border-gray-600'}`}
                        >
                            {viewMode === 'list' ? <PhotographIcon className="h-5 w-5 ml-2" /> : <ClipboardListIcon className="h-5 w-5 ml-2" />}
                            {viewMode === 'list' ? 'عرض مجسم للأسنان' : 'عرض القائمة'}
                        </button>
                    )}

                    <button onClick={() => { setPrefilledToothNumber(undefined); setIsAddingTreatment(true); }} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition-colors">
                        <PlusIcon className="h-5 w-5 ml-2" />
                        إضافة علاج
                    </button>
                </div>
            </div>

            {loading ? <CenteredLoadingSpinner /> : (
                <>
                    {viewMode === 'chart' ? (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 text-center">المخطط التفاعلي للأسنان (FDI)</h3>
                                <div className="flex justify-center gap-4 mb-4 text-xs sm:text-sm">
                                    <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-100 border border-green-500"></span><span>مكتمل</span></div>
                                    <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-100 border border-orange-500"></span><span>قيد الانتظار</span></div>
                                    <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-white border border-gray-400"></span><span>غير معالج</span></div>
                                </div>
                                <DentalChart treatments={session.treatments} onToothClick={handleToothClick} />
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
                            {session.treatments.length > 0 ? (
                                session.treatments.map(t => (
                                    <div key={t.instanceId} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start gap-3 mb-2">
                                                <div className="flex items-center gap-3">
                                                    <button 
                                                        onClick={() => handleToggleTreatmentComplete(t)} 
                                                        title={t.completed ? 'وضع علامة كغير مكتمل' : 'وضع علامة كمكتمل'}
                                                        disabled={updatingTreatmentId === t.instanceId}
                                                        className="w-6 h-6 flex items-center justify-center flex-shrink-0"
                                                    >
                                                        {updatingTreatmentId === t.instanceId ? (
                                                            <LoadingSpinner className="h-5 w-5" />
                                                        ) : t.completed ? (
                                                            <CheckIcon className="h-6 w-6 text-green-500" />
                                                        ) : (
                                                            <div className="h-6 w-6 rounded-full border-2 border-gray-400 dark:border-gray-500"></div>
                                                        )}
                                                    </button>
                                                    <p className={`font-bold text-lg ${t.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-100'}`}>
                                                        {t.name}
                                                    </p>
                                                </div>
                                                {t.number && (
                                                    <span className="text-sm font-semibold text-primary-700 dark:text-primary-300 bg-primary-100 dark:bg-primary-900/40 px-2 py-0.5 rounded-full flex-shrink-0">
                                                        {t.number}
                                                    </span>
                                                )}
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
                    )}
                </>
            )}

            {/* Tooth Details Modal for Interactive Chart */}
            {selectedTooth && (
                <ToothTreatmentsModal 
                    toothNumber={selectedTooth}
                    treatments={session.treatments.filter(t => t.number === selectedTooth)}
                    onClose={() => setSelectedTooth(null)}
                    onAddTreatment={handleAddTreatmentFromChart}
                    onDeleteTreatment={setTreatmentToDelete}
                    onEditTreatment={setEditingTreatment}
                    onToggleComplete={handleToggleTreatmentComplete}
                />
            )}

            {isAddingTreatment && <AddTreatmentToSessionModal session={session} onSave={handleSaveTreatment} onClose={() => setIsAddingTreatment(false)} user={user} initialNumber={prefilledToothNumber} />}
            {editingTreatment && <EditSessionTreatmentModal treatment={editingTreatment} onSave={handleUpdateTreatment} onClose={() => setEditingTreatment(null)} user={user} />}
            {treatmentToDelete && <ConfirmDeleteModal title="حذف العلاج" message={`هل أنت متأكد من حذف علاج "${treatmentToDelete.name}" من الجلسة؟`} onConfirm={confirmDeleteTreatment} onCancel={() => !isDeleting && setTreatmentToDelete(null)} isDeleting={isDeleting} />}
            {viewingTreatment && <ViewTreatmentDetailsModal treatment={viewingTreatment} onClose={() => setViewingTreatment(null)} user={user} />}
        </div>
    );
};

export default SessionTreatmentsPage;
