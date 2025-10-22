import React, { useEffect, useState, useCallback } from 'react';
import { User, UserRole, Patient, Session, SessionTreatment, Treatment } from '../types';
import { api } from '../services/api';
import { PlusIcon, PencilIcon, TrashIcon, XIcon, ClipboardListIcon, BeakerIcon, ArrowBackIcon, EyeIcon, CheckIcon, UserGroupIcon } from '../components/Icons';
import { CenteredLoadingSpinner } from '../components/LoadingSpinner';
import LoadingSpinner from '../components/LoadingSpinner';


// ===================================================================
// Re-usable Modals and Sub-Pages (Copied from PatientsPage for encapsulation)
// ===================================================================

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
const PatientSessionsPage: React.FC<{ patient: Patient; onBack: () => void; doctors: User[] }> = ({ patient, onBack, doctors }) => {
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
    
    const getDoctorName = (doctorId: string) => doctors.find(d => d.id === doctorId)?.name || 'طبيب غير معروف';


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
                            <div>
                                <p className="font-bold text-lg text-gray-800 dark:text-gray-100">{new Date(s.date).toLocaleDateString()}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">الطبيب: {getDoctorName(s.doctorId)}</p>
                                <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm h-12 overflow-hidden">{s.notes || 'لا توجد ملاحظات.'}</p>
                            </div>
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
            {isAddingSession && <AddSessionModal onClose={() => setIsAddingSession(false)} onSave={handleCreateSession} patientId={patient.id} doctorId={patient.doctorIds[0]} />}
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
// DoctorPatientsView Component
// ===================================================================
const DoctorPatientsView: React.FC<{ doctor: User; onBack: () => void; }> = ({ doctor, onBack }) => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewingSessionsFor, setViewingSessionsFor] = useState<Patient | null>(null);

    const fetchPatients = useCallback(async () => {
        setLoading(true);
        const allPatients = await api.patients.getAll();
        setPatients(allPatients.filter(p => p.doctorIds.includes(doctor.id)));
        setLoading(false);
    }, [doctor.id]);

    useEffect(() => {
        fetchPatients();
    }, [fetchPatients]);

    if (viewingSessionsFor) {
        return <PatientSessionsPage patient={viewingSessionsFor} onBack={() => setViewingSessionsFor(null)} doctors={[doctor]} />;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                        <ArrowBackIcon className="h-5 w-5" />
                        <span>العودة للأطباء</span>
                    </button>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">مرضى الدكتور: {doctor.name}</h1>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md min-h-[200px]">
                {loading ? <CenteredLoadingSpinner /> : (
                    patients.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {patients.map(patient => (
                                <div key={patient.id} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col justify-between hover:shadow-lg">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{patient.name}</h3>
                                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">{patient.code}</span>
                                        </div>
                                        <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                            <p><span className="font-semibold">العمر:</span> {patient.age}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t dark:border-gray-600 flex items-center justify-end">
                                        <button onClick={() => setViewingSessionsFor(patient)} className="flex items-center text-teal-600 dark:text-teal-400 hover:text-teal-800 p-1 rounded hover:bg-teal-100 dark:hover:bg-teal-900/40 text-sm">
                                            <ClipboardListIcon className="h-4 w-4" />
                                            <span className="mr-1">الجلسات</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                            لا يوجد مرضى مسجلون لهذا الطبيب.
                        </p>
                    )
                )}
            </div>
        </div>
    );
};



// ===================================================================
// AddDoctorModal Component
// ===================================================================
interface AddDoctorModalProps {
    onSave: (newUser: Omit<User, 'id' | 'role'>) => Promise<void>;
    onClose: () => void;
}

const AddDoctorModal: React.FC<AddDoctorModalProps> = ({ onSave, onClose }) => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', specialty: '' });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.password) {
            alert('كلمة المرور مطلوبة للطبيب الجديد.');
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
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">إضافة طبيب جديد</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="nameAdd" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاسم</label>
                            <input type="text" id="nameAdd" name="name" value={formData.name} onChange={handleChange} required className={inputStyle} />
                        </div>
                         <div>
                            <label htmlFor="specialtyAdd" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">التخصص</label>
                            <input type="text" id="specialtyAdd" name="specialty" value={formData.specialty} onChange={handleChange} required className={inputStyle} />
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
// EditDoctorModal Component
// ===================================================================
interface EditDoctorModalProps {
    doctor: User;
    onSave: (updatedDoctor: User) => Promise<void>;
    onClose: () => void;
}

const EditDoctorModal: React.FC<EditDoctorModalProps> = ({ doctor, onSave, onClose }) => {
    const [formData, setFormData] = useState({ name: doctor.name, email: doctor.email, password: '', specialty: doctor.specialty || '' });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const updates: Partial<User> = { name: formData.name, email: formData.email, specialty: formData.specialty };
        if (formData.password) {
            updates.password = formData.password;
        }
        await onSave({ ...doctor, ...updates });
        setIsSaving(false);
    };
    
    const inputStyle = "w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black dark:text-white";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md" role="dialog" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">تعديل بيانات الطبيب</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div><label htmlFor="nameEdit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاسم</label><input type="text" id="nameEdit" name="name" value={formData.name} onChange={handleChange} required className={inputStyle} /></div>
                        <div><label htmlFor="specialtyEdit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">التخصص</label><input type="text" id="specialtyEdit" name="specialty" value={formData.specialty} onChange={handleChange} required className={inputStyle} /></div>
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

const DoctorsPage: React.FC = () => {
    const [doctors, setDoctors] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddingDoctor, setIsAddingDoctor] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState<User | null>(null);
    const [deletingDoctor, setDeletingDoctor] = useState<User | null>(null);
    const [viewingDoctorPatients, setViewingDoctorPatients] = useState<User | null>(null);


    const fetchDoctors = useCallback(async () => {
        setLoading(true);
        const allUsers = await api.doctors.getAll();
        setDoctors(allUsers);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchDoctors();
    }, [fetchDoctors]);

    const handleCreateDoctor = async (newDoctorData: Omit<User, 'id' | 'role'>) => {
        await api.doctors.create({ ...newDoctorData, role: UserRole.Doctor });
        setIsAddingDoctor(false);
        await fetchDoctors();
    };
    
    const handleUpdateDoctor = async (updatedDoctor: User) => {
        await api.doctors.update(updatedDoctor.id, updatedDoctor);
        setEditingDoctor(null);
        await fetchDoctors();
    };

    const confirmDeleteDoctor = async () => {
        if (deletingDoctor) {
            await api.doctors.delete(deletingDoctor.id);
            setDeletingDoctor(null);
            await fetchDoctors();
        }
    };
    
    if (viewingDoctorPatients) {
        return <DoctorPatientsView doctor={viewingDoctorPatients} onBack={() => setViewingDoctorPatients(null)} />;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">إدارة الأطباء</h1>
                <button onClick={() => setIsAddingDoctor(true)} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700 transition-colors">
                    <PlusIcon className="h-5 w-5 ml-2" />
                    إضافة طبيب
                </button>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md min-h-[200px]">
                {loading ? <CenteredLoadingSpinner /> : (
                     doctors.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {doctors.map(doc => (
                                <div key={doc.id} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col justify-between transition-shadow hover:shadow-lg">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{doc.name}</h3>
                                        <p className="text-primary dark:text-primary-300 font-semibold mt-1">{doc.specialty}</p>
                                        <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm">{doc.email}</p>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
                                         <button onClick={() => setViewingDoctorPatients(doc)} className="flex items-center text-green-600 dark:text-green-400 hover:text-green-800 p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/40 text-sm">
                                            <UserGroupIcon className="h-4 w-4" />
                                            <span className="mr-1">المرضى</span>
                                        </button>
                                        <button onClick={() => setEditingDoctor(doc)} className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 text-sm">
                                            <PencilIcon className="h-4 w-4" />
                                            <span className="mr-1">تعديل</span>
                                        </button>
                                        <button onClick={() => setDeletingDoctor(doc)} className="flex items-center text-red-600 dark:text-red-400 hover:text-red-800 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/40 text-sm">
                                            <TrashIcon className="h-4 w-4" />
                                            <span className="mr-1">حذف</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <p className="text-center text-gray-500 dark:text-gray-400 py-8">لم يتم العثور على أطباء.</p>
                    )
                )}
            </div>
            {isAddingDoctor && <AddDoctorModal onClose={() => setIsAddingDoctor(false)} onSave={handleCreateDoctor} />}
            {editingDoctor && <EditDoctorModal doctor={editingDoctor} onClose={() => setEditingDoctor(null)} onSave={handleUpdateDoctor} />}
            {deletingDoctor && (
                <ConfirmDeleteModal
                    title="حذف طبيب"
                    message={`هل أنت متأكد من رغبتك في حذف ${deletingDoctor.name}؟ لا يمكن التراجع عن هذا الإجراء.`}
                    onConfirm={confirmDeleteDoctor}
                    onCancel={() => setDeletingDoctor(null)}
                />
            )}
        </div>
    );
};

export default DoctorsPage;