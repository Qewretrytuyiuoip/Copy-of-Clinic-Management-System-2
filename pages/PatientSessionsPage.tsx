import React, { useEffect, useState, useCallback } from 'react';
import { User, Patient, Session, SessionTreatment, Treatment, UserRole } from '../types';
import { api } from '../services/api';
import { PlusIcon, PencilIcon, TrashIcon, XIcon, ClipboardListIcon, BeakerIcon, ArrowBackIcon, CheckIcon } from '../components/Icons';
import { CenteredLoadingSpinner } from '../components/LoadingSpinner';

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
// PatientSessionsPage Component
// ===================================================================
interface PatientSessionsPageProps {
    patient: Patient;
    onBack: () => void;
    user: User;
    refreshTrigger: number;
    onViewTreatments: (session: Session) => void;
}

const PatientSessionsPage: React.FC<PatientSessionsPageProps> = ({ patient, onBack, user, refreshTrigger, onViewTreatments }) => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [doctors, setDoctors] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddingSession, setIsAddingSession] = useState(false);
    const [editingSession, setEditingSession] = useState<Session | null>(null);
    const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

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
            api.patients.updateCompletionStatus(patient.id, user.id);
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

    const handleCreateSession = async (newSessionData: Omit<Session, 'id' | 'treatments'>) => {
        await api.sessions.create(newSessionData);
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
            setIsDeleting(true);
            try {
                await api.sessions.delete(sessionToDelete.id);
                setSessionToDelete(null);
                await fetchPageData();
            } finally {
                setIsDeleting(false);
            }
        }
    };

    return (
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
                                <button onClick={() => onViewTreatments(session)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white bg-teal-600 rounded-md hover:bg-teal-700"><BeakerIcon className="h-4 w-4" /> علاجات ({session.treatments.length})</button>
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
            
            {isAddingSession && <AddSessionModal onSave={handleCreateSession} onClose={() => setIsAddingSession(false)} patientId={patient.id} doctors={doctors} user={user} patient={patient} />}
            {editingSession && <EditSessionModal session={editingSession} onSave={handleUpdateSession} onClose={() => setEditingSession(null)} />}
            {sessionToDelete && <ConfirmDeleteModal title="حذف الجلسة" message="هل أنت متأكد من حذف هذه الجلسة وجميع علاجاتها؟" onConfirm={confirmDeleteSession} onCancel={() => !isDeleting && setSessionToDelete(null)} isDeleting={isDeleting} />}
        </div>
    );
};

export default PatientSessionsPage;