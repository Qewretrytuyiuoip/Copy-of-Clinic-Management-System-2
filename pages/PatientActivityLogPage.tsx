
import React, { useState, useCallback, useEffect } from 'react';
import { Patient, ActivityLog, ActivityLogActionType } from '../types';
import { api } from '../services/api';
import { CenteredLoadingSpinner } from '../components/LoadingSpinner';
import { PlusIcon, PencilIcon, TrashIcon, ArrowBackIcon, DocumentTextIcon } from '../components/Icons';

interface PatientActivityLogPageProps {
    patient: Patient;
    onBack: () => void;
    refreshTrigger: number;
}

const PatientActivityLogPage: React.FC<PatientActivityLogPageProps> = ({ patient, onBack, refreshTrigger }) => {
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
    }, [fetchLogs, refreshTrigger]);

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
                <button onClick={onBack} className="p-2 font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary" aria-label="العودة">
                    <ArrowBackIcon className="h-5 w-5" />
                </button>
                <div>
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

export default PatientActivityLogPage;
