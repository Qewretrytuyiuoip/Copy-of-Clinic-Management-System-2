import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { User, Patient, Session, SessionTreatment, Treatment, UserRole } from '../types';
import { api, getSessionsByPatient } from '../services/api';
import { PlusIcon, XIcon, ArrowBackIcon, CheckIcon, ListBulletIcon, DocumentTextIcon, UserCircleIcon, CalendarIcon, ChevronDownIcon, TrashIcon } from '../components/Icons';
import LoadingSpinner, { CenteredLoadingSpinner } from '../components/LoadingSpinner';

// This file contains components related to the patient's treatment plan.

// Interface for a session within the plan editor
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
    onAdd: (treatment: Treatment, notes: string) => void;
    user: User;
}

const AddTreatmentToPlanSession: React.FC<AddTreatmentToPlanSessionProps> = ({ session, allTreatments, onAdd, user }) => {
    const [selectedTreatmentId, setSelectedTreatmentId] = useState('');
    const [sessionNotes, setSessionNotes] = useState('');
    const inputStyle = "w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black dark:text-white";

    const availableTreatments = useMemo(() => {
        const sessionTreatmentNames = new Set(session.treatments.map(t => t.name));
        return allTreatments.filter(t => !sessionTreatmentNames.has(t.name));
    }, [allTreatments, session.treatments]);

    const handleAdd = () => {
        const treatment = allTreatments.find(t => t.id === selectedTreatmentId);
        if (treatment) {
            onAdd(treatment, sessionNotes);
            setSelectedTreatmentId('');
            setSessionNotes('');
        }
    };

    if (availableTreatments.length === 0) {
        return <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">تمت إضافة جميع العلاجات المتاحة لهذه الجلسة.</p>;
    }

    return (
        <div className="mt-2 flex items-center gap-2 flex-wrap">
            <select
                value={selectedTreatmentId}
                onChange={(e) => setSelectedTreatmentId(e.target.value)}
                className={inputStyle + " flex-grow"}
            >
                <option value="">-- إضافة علاج --</option>
                {availableTreatments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <input 
                type="text" 
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="ملاحظات..."
                className={inputStyle + " flex-grow"}
            />
            <button
                type="button"
                onClick={handleAdd}
                disabled={!selectedTreatmentId}
                className="p-2 bg-primary text-white rounded-md disabled:bg-gray-400"
                aria-label="Add Treatment"
            >
                <PlusIcon className="h-5 w-5" />
            </button>
        </div>
    );
};

interface PatientPlanPageProps {
    patient: Patient;
    user: User;
    onBack: () => void;
    doctors: User[];
    refreshTrigger: number;
}

const PatientPlanPage: React.FC<PatientPlanPageProps> = ({ patient, user, onBack, doctors, refreshTrigger }) => {
    const [planSessions, setPlanSessions] = useState<PlanSession[]>([]);
    const [allTreatments, setAllTreatments] = useState<Treatment[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [expandedSessions, setExpandedSessions] = useState<string[]>([]);

    const toggleSessionExpansion = (clientId: string) => {
        setExpandedSessions(prev =>
            prev.includes(clientId)
                ? prev.filter(id => id !== clientId)
                : [...prev, clientId]
        );
    };
    
    const getDoctorName = (doctorId: string) => doctors.find(d => d.id === doctorId)?.name || 'غير معروف';

    const fetchPlanData = useCallback(async () => {
        setLoading(true);
        try {
            const [sessionsData, treatmentsData] = await Promise.all([
                getSessionsByPatient(patient.id),
                api.treatmentSettings.getAll(true) // force refresh
            ]);

            const mappedSessions = sessionsData.map(s => ({
                id: s.id,
                clientId: s.id,
                title: s.title,
                doctorId: s.doctorId,
                date: new Date(s.date).toISOString().split('T')[0],
                notes: s.notes,
                treatments: s.treatments,
            })).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            setPlanSessions(mappedSessions);
            setAllTreatments(treatmentsData);
        } catch (err) {
            console.error(err);
            alert("فشل في تحميل بيانات الخطة.");
        } finally {
            setLoading(false);
        }
    }, [patient.id]);

    useEffect(() => {
        fetchPlanData();
    }, [fetchPlanData, refreshTrigger]);

    const handleAddSession = () => {
        const newSession: PlanSession = {
            clientId: `new-${Date.now()}`,
            title: `جلسة ${planSessions.length + 1}`,
            doctorId: patient.doctorIds.includes(user.id) ? user.id : patient.doctorIds[0] || '',
            date: new Date().toISOString().split('T')[0],
            notes: '',
            treatments: [],
        };
        setPlanSessions(prev => [...prev, newSession]);
        // Expand the new session automatically
        setExpandedSessions(prev => [...prev, newSession.clientId]);
    };

    const handleSessionChange = (clientId: string, field: keyof PlanSession, value: any) => {
        setPlanSessions(prev => prev.map(s => s.clientId === clientId ? { ...s, [field]: value } : s));
    };

    const handleRemoveSession = (clientId: string) => {
        if(window.confirm("هل أنت متأكد من حذف هذه الجلسة من الخطة؟")) {
            setPlanSessions(prev => prev.filter(s => s.clientId !== clientId));
        }
    };

    const handleAddTreatmentToSession = (clientId: string, treatment: Treatment, notes: string) => {
        setPlanSessions(prev => prev.map(s => {
            if (s.clientId === clientId) {
                const newTreatment: SessionTreatment = {
                    ...treatment,
                    instanceId: `new-${Date.now()}`,
                    sessionId: s.id || '', // will be empty for new sessions
                    sessionPrice: treatment.price,
                    sessionNotes: notes,
                    completed: false,
                };
                return { ...s, treatments: [...s.treatments, newTreatment] };
            }
            return s;
        }));
    };
    
    const handleRemoveTreatment = (clientId: string, treatmentInstanceId: string) => {
        setPlanSessions(prev => prev.map(s => {
            if (s.clientId === clientId) {
                return { ...s, treatments: s.treatments.filter(t => t.instanceId !== treatmentInstanceId) };
            }
            return s;
        }));
    };
    
    const handleSavePlan = async () => {
        setSaving(true);
        try {
            const existingSessions = await getSessionsByPatient(patient.id);

            // 1. Delete sessions that are no longer in the plan
            const sessionsToDelete = existingSessions.filter(es => !planSessions.some(ps => ps.id === es.id));
            await Promise.all(sessionsToDelete.map(s => api.sessions.delete(s.id)));

            // 2. Create/Update sessions
            for (const planSession of planSessions) {
                if (planSession.id) { // Existing session
                    await api.sessions.update(planSession.id, {
                        title: planSession.title,
                        date: planSession.date,
                        notes: planSession.notes,
                        doctorId: planSession.doctorId,
                    });
                    
                    const existingTreatments = existingSessions.find(s => s.id === planSession.id)?.treatments || [];
                    const treatmentsToDelete = existingTreatments.filter(et => !planSession.treatments.some(pt => pt.instanceId === et.instanceId));
                    await Promise.all(treatmentsToDelete.map(t => api.sessionTreatments.delete(t.instanceId)));

                    for (const treatment of planSession.treatments) {
                        if (treatment.instanceId.startsWith('new-')) { // New treatment in existing session
                            await api.sessionTreatments.create({
                                session_id: planSession.id,
                                treatment_name: treatment.name,
                                treatment_price: treatment.price,
                                treatment_notes: treatment.sessionNotes,
                                treatment_date: new Date().toISOString().split('T')[0],
                                completed: false,
                            });
                        }
                    }

                } else { // New session
                    const newSession = await api.sessions.create({
                        patientId: patient.id,
                        title: planSession.title,
                        date: planSession.date,
                        notes: planSession.notes,
                        doctorId: planSession.doctorId,
                    });
                    
                    for (const treatment of planSession.treatments) {
                         await api.sessionTreatments.create({
                            session_id: newSession.id,
                            treatment_name: treatment.name,
                            treatment_price: treatment.price,
                            treatment_notes: treatment.sessionNotes,
                            treatment_date: new Date().toISOString().split('T')[0],
                            completed: false,
                        });
                    }
                }
            }
            await api.patients.updateCompletionStatus(patient.id, user.id);
            alert("تم حفظ الخطة بنجاح!");
            onBack();
        } catch (err) {
            console.error(err);
            alert("فشل في حفظ الخطة.");
        } finally {
            setSaving(false);
        }
    };
    
    const patientDoctors = useMemo(() => {
        return doctors.filter(d => patient.doctorIds.includes(d.id));
    }, [patient, doctors]);
    
    const inputStyle = "w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black dark:text-white";

    if (loading) {
        return <CenteredLoadingSpinner />;
    }

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                 <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary" aria-label="العودة">
                        <ArrowBackIcon className="h-5 w-5" />
                    </button>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">{patient.name}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-4">
                    <button onClick={handleAddSession} className="hidden lg:flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors">
                        <PlusIcon className="h-5 w-5 ml-2" />
                        إضافة جلسة
                    </button>
                    <button onClick={handleSavePlan} disabled={saving} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700 transition-colors disabled:bg-primary-300">
                        {saving ? <LoadingSpinner className="h-5 w-5 ml-2" /> : <CheckIcon className="h-5 w-5 ml-2" />}
                        <span>{saving ? 'جاري الحفظ...' : 'حفظ الخطة'}</span>
                    </button>
                </div>
            </div>

            {/* Plan Editor */}
            <div className="space-y-6">
                {planSessions.length > 0 ? planSessions.map((session, index) => {
                    const isExpanded = expandedSessions.includes(session.clientId);
                    return (
                        <div key={session.clientId} className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden transition-shadow hover:shadow-lg">
                            <div 
                                className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50"
                                onClick={() => toggleSessionExpansion(session.clientId)}
                            >
                                <div className="flex items-center gap-4">
                                    <ListBulletIcon className="h-6 w-6 text-primary" />
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">الجلسة {index + 1}: {session.title}</h2>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                                            <span className="flex items-center gap-1"><UserCircleIcon className="h-4 w-4" /> {getDoctorName(session.doctorId)}</span>
                                            <span className="flex items-center gap-1"><CalendarIcon className="h-4 w-4" /> {new Date(session.date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleRemoveSession(session.clientId); }} 
                                        className="p-2 rounded-full text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40" 
                                        title="حذف الجلسة"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                    <ChevronDownIcon className={`h-6 w-6 text-gray-400 transition-transform duration-300 ${isExpanded ? 'transform rotate-180' : ''}`} />
                                </div>
                            </div>
                            
                            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[1500px]' : 'max-h-0'}`}>
                                <div className="p-6 border-t dark:border-gray-700 bg-gray-50/50 dark:bg-slate-800/50">
                                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">عنوان الجلسة</label>
                                            <input type="text" value={session.title} onChange={(e) => handleSessionChange(session.clientId, 'title', e.target.value)} className={inputStyle} />
                                        </div>
                                         <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الطبيب</label>
                                            <select value={session.doctorId} onChange={(e) => handleSessionChange(session.clientId, 'doctorId', e.target.value)} className={inputStyle}>
                                                {patientDoctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                            </select>
                                        </div>
                                         <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاريخ الجلسة</label>
                                            <input type="date" value={session.date} onChange={(e) => handleSessionChange(session.clientId, 'date', e.target.value)} className={inputStyle} />
                                        </div>
                                        <div className="lg:col-span-3">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ملاحظات الجلسة</label>
                                            <textarea value={session.notes} onChange={(e) => handleSessionChange(session.clientId, 'notes', e.target.value)} rows={2} className={inputStyle}></textarea>
                                        </div>
                                    </div>

                                    <div className="mt-4 border-t pt-4 dark:border-gray-700">
                                         <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">العلاجات المخطط لها</h3>
                                         {session.treatments.length > 0 ? (
                                            <ul className="space-y-2">
                                                {session.treatments.map(t => (
                                                    <li key={t.instanceId} className="flex justify-between items-center p-2 bg-white dark:bg-slate-700 rounded-md shadow-sm">
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-gray-200">{t.name}</p>
                                                            {t.sessionNotes && <p className="text-sm text-gray-500 dark:text-gray-400">{t.sessionNotes}</p>}
                                                        </div>
                                                        <button onClick={() => handleRemoveTreatment(session.clientId, t.instanceId)} className="p-1 text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40">
                                                            <XIcon className="h-4 w-4" />
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                         ) : <p className="text-sm text-gray-500 dark:text-gray-400">لم يتم إضافة علاجات.</p>}
                                        <AddTreatmentToPlanSession session={session} allTreatments={allTreatments} onAdd={(t, n) => handleAddTreatmentToSession(session.clientId, t, n)} user={user} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="text-center py-16 text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800 rounded-xl shadow-md">
                        <ListBulletIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">لم يتم إنشاء خطة بعد</h3>
                        <p className="mt-1 text-sm">ابدأ بإضافة أول جلسة إلى خطة علاج المريض.</p>
                    </div>
                )}
            </div>

            <button 
                onClick={handleAddSession} 
                className="lg:hidden fixed bottom-20 left-4 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-20"
                aria-label="إضافة جلسة"
            >
                <PlusIcon className="h-6 w-6" />
            </button>
        </div>
    );
};
// FIX: Added default export to resolve the import error in App.tsx.
export default PatientPlanPage;