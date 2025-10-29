
import React, { useEffect, useState, useCallback } from 'react';
import { User, Patient, Session, SessionTreatment, Treatment, UserRole } from '../types';
import { api, updatePatientCompletionStatus } from '../services/api';
import { PlusIcon, PencilIcon, TrashIcon, XIcon, ClipboardListIcon, BeakerIcon, ArrowBackIcon, EyeIcon, CheckIcon } from '../components/Icons';
import LoadingSpinner, { CenteredLoadingSpinner } from '../components/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';

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
// PatientSessionsPage Component
// ===================================================================
interface PatientSessionsPageProps {
    patient: Patient;
    onBack: () => void;
    user: User;
    refreshTrigger: number;
}

const PatientSessionsPage: React.FC<PatientSessionsPageProps> = ({ patient, onBack, user, refreshTrigger }) => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [doctors, setDoctors] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddingSession, setIsAddingSession] = useState(false);
    const [editingSession, setEditingSession] = useState<Session | null>(null);
    const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
    const [addingTreatmentToSession, setAddingTreatmentToSession] = useState<Session | null>(null);
    const [treatmentToDelete, setTreatmentToDelete] = useState<SessionTreatment | null>(null);
    const [editingTreatment, setEditingTreatment] = useState<SessionTreatment | null>(null);
    const [viewingTreatment, setViewingTreatment] = useState<SessionTreatment | null>(null);
    const [viewingTreatmentsForSession, setViewingTreatmentsForSession] = useState<Session | null>(null);
    const [updatingTreatmentId, setUpdatingTreatmentId] = useState<string | null>(null);

    const getDoctorName = (doctorId: string) => doctors.find(d => d.id === doctorId)?.name || 'غير معروف';

    const fetchPageData = useCallback(async () => {
        setLoading(true);
        try {
            const [allSessions, allDoctors] = await Promise.all([
                api.sessions.getAll(),
                api.doctors.getAll()
            ]);
            const patientSessions = allSessions
                .filter(s => s.patientId === patient.id)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setSessions(patientSessions);
            setDoctors(allDoctors);
            updatePatientCompletionStatus(patient.id, user.id);
        } catch (error) {
            console.error("Failed to fetch sessions:", error);
            alert("فشل في تحميل الجلسات.");
        } finally {
            setLoading(false);
        }
    }, [patient.id, user.id]);

    useEffect(() => {
        fetchPageData();
    }, [fetchPageData, refreshTrigger]);

    const reevaluateSessionStatus = useCallback(async (sessionId: string) => {
        try {
            const session = await api.sessions.getById(sessionId);
            if (!session) {
                await fetchPageData();
                return;
            }
    
            const allTreatmentsComplete = session.treatments.length > 0 && session.treatments.every(t => t.completed);
            
            let finalSession = session;
            if (allTreatmentsComplete !== session.completed) {
                const updatedSession = await api.sessions.update(sessionId, { completed: allTreatmentsComplete });
                if (updatedSession) {
                    finalSession = updatedSession;
                }
            }
            
            setSessions(prev => prev.map(s => s.id === sessionId ? finalSession : s));
            if (viewingTreatmentsForSession?.id === sessionId) {
                setViewingTreatmentsForSession(finalSession);
            }
            updatePatientCompletionStatus(patient.id, user.id);
    
        } catch (error) {
            console.error(`Failed to re-evaluate session status for ${sessionId}`, error);
            await fetchPageData();
        }
    }, [fetchPageData, viewingTreatmentsForSession?.id, patient.id, user.id]);

    const handleCreateSession = async (newSessionData: Omit<Session, 'id' | 'treatments'>) => {
        await api.sessions.create({ ...newSessionData, treatments: [] });
        setIsAddingSession(false);
        await fetchPageData();
    };

    const handleUpdateSession = async (updatedSession: Session) => {
        const updates: Partial<Session> = {
            title: updatedSession.title,
            date: updatedSession.date,
            notes: updatedSession.notes,
        };
        await api.sessions.update(updatedSession.id, updates);
        setEditingSession(null);
        await fetchPageData();
    };

    const confirmDeleteSession = async () => {
        if (sessionToDelete) {
            await api.sessions.delete(sessionToDelete.id);
            setSessionToDelete(null);
            await fetchPageData();
        }
    };

    const handleSaveTreatment = async (keepModalOpen?: boolean) => {
        const sessionId = addingTreatmentToSession?.id;
        if (!keepModalOpen) {
            setAddingTreatmentToSession(null);
        }
        if (sessionId) {
            await reevaluateSessionStatus(sessionId);
        } else {
            await fetchPageData();
        }
    };

    const handleUpdateTreatment = async () => {
        const sessionId = editingTreatment?.sessionId;
        setEditingTreatment(null);
        if (sessionId) {
            await reevaluateSessionStatus(sessionId);
        } else {
            await fetchPageData();
        }
    }

    const confirmDeleteTreatment = async () => {
        if (treatmentToDelete) {
            const sessionId = treatmentToDelete.sessionId;
            await api.sessionTreatments.delete(treatmentToDelete.instanceId);
            setTreatmentToDelete(null);
            await reevaluateSessionStatus(sessionId);
        }
    };

    const handleToggleTreatmentComplete = async (treatment: SessionTreatment) => {
        setUpdatingTreatmentId(treatment.instanceId);
        try {
            await api.sessionTreatments.update(treatment.instanceId, { completed: !treatment.completed });
            updatePatientCompletionStatus(patient.id, user.id);
            
            // After successful update, manually update the local state to reflect the change
            setViewingTreatmentsForSession(currentSession => {
                if (!currentSession || currentSession.id !== treatment.sessionId) return currentSession;

                const updatedTreatments = currentSession.treatments.map(t =>
                    t.instanceId === treatment.instanceId ? { ...t, completed: !t.completed } : t
                );

                const allTreatmentsComplete = updatedTreatments.length > 0 && updatedTreatments.every(t => t.completed);

                const finalUpdatedSession = {
                    ...currentSession,
                    treatments: updatedTreatments,
                    completed: allTreatmentsComplete,
                };

                // Update session on backend if its completion status changed
                if (currentSession.completed !== allTreatmentsComplete) {
                    api.sessions.update(currentSession.id, { completed: allTreatmentsComplete });
                }

                // Also update the main list of sessions
                setSessions(prevSessions => prevSessions.map(s => (s.id === finalUpdatedSession.id ? finalUpdatedSession : s)));
                
                return finalUpdatedSession;
            });

        } catch (error) {
            console.error("Failed to update treatment status:", error);
            alert('فشل في تحديث حالة العلاج.');
            // On error, refetch all data to ensure consistency
            fetchPageData();
        } finally {
            setUpdatingTreatmentId(null);
        }
    };

    return (
        <div>
            {viewingTreatmentsForSession ? (
                // TREATMENTS VIEW (as cards)
                <div>
                    <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setViewingTreatmentsForSession(null)} className="p-2 font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary" aria-label="العودة للجلسات">
                                <ArrowBackIcon className="h-5 w-5" />
                            </button>
                            <div>
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
                                            <button 
                                                onClick={() => handleToggleTreatmentComplete(t)} 
                                                title={t.completed ? 'وضع علامة كغير مكتمل' : 'وضع علامة كمكتمل'}
                                                disabled={updatingTreatmentId === t.instanceId}
                                                className="w-6 h-6 flex items-center justify-center"
                                            >
                                                {updatingTreatmentId === t.instanceId ? (
                                                    <LoadingSpinner className="h-5 w-5" />
                                                ) : t.completed ? (
                                                    <CheckIcon className="h-6 w-6 text-green-500" />
                                                ) : (
                                                    <div className="h-6 w-6 rounded-full border-2 border-gray-400 dark:border-gray-500"></div>
                                                )}
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
                            <button onClick={onBack} className="p-2 font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary" aria-label="العودة للمرضى">
                                <ArrowBackIcon className="h-5 w-5" />
                            </button>
                            <div>
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
                                return (
                                <div key={session.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{session.title || 'جلسة بدون عنوان'}</h2>
                                            <div title={session.completed ? 'مكتملة' : 'غير مكتملة'}>
                                                {session.completed
                                                    ? <CheckIcon className="h-6 w-6 text-green-500" />
                                                    : <div className="h-6 w-6 rounded-full border-2 border-gray-400 dark:border-gray-500"></div>
                                                }
                                            </div>
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

export default PatientSessionsPage;
