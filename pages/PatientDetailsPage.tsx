import React, { useMemo, useState, useEffect } from 'react';
// FIX: Imported UserRole to resolve 'Cannot find name' error.
import { Patient, User, Gender, UserRole } from '../types';
import { ArrowBackIcon } from '../components/Icons';
import { api } from '../services/api';
import { CenteredLoadingSpinner } from '../components/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';

interface PatientDetailsPageProps {
    patient: Patient;
    doctors: User[];
    onBack: () => void;
    refreshTrigger: number;
}

const DetailItem: React.FC<{ label: string; value?: string | number | null; children?: React.ReactNode }> = ({ label, value, children }) => (
    <div className="py-3 sm:py-4">
        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
        <dd className="mt-1 text-lg text-gray-900 dark:text-gray-100 sm:mt-0">{children || value || <span className="text-gray-400 dark:text-gray-500">لا يوجد</span>}</dd>
    </div>
);

const PatientDetailsPage: React.FC<PatientDetailsPageProps> = ({ patient: initialPatient, doctors, onBack, refreshTrigger }) => {
    const [patient, setPatient] = useState<Patient>(initialPatient);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const isAdmin = user && user.role === UserRole.Admin;

    useEffect(() => {
        const fetchPatientData = async () => {
            setLoading(true);
            const latestPatientData = await api.patients.getById(initialPatient.id);
            if (latestPatientData) {
                setPatient(latestPatientData);
            }
            setLoading(false);
        };
        fetchPatientData();
    }, [initialPatient.id, refreshTrigger]);

    const patientDoctors = useMemo(() => {
        if (!patient) return [];
        return doctors.filter(d => patient.doctorIds.includes(d.id));
    }, [patient, doctors]);

    if (loading) {
        return <CenteredLoadingSpinner />;
    }

    if (!patient) {
        return (
            <div>
                <button onClick={onBack} className="mb-4 flex items-center gap-2 text-primary hover:underline">
                    <ArrowBackIcon className="h-5 w-5" />
                    <span>العودة للمرضى</span>
                </button>
                <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold">لم يتم العثور على المريض.</h2>
                </div>
            </div>
        );
    }
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary" aria-label="العودة">
                        <ArrowBackIcon className="h-5 w-5" />
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
                        {isAdmin && (
                            <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <DetailItem label="مبلغ الخصم" value={`${(patient.discount || 0).toLocaleString()} SYP`} />
                            </div>
                        )}
                        <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"> <DetailItem label="ملاحظات عامة" value={patient.notes} /> </div>
                    </dl>
                </div>
            </div>
        </div>
    );
};

export default PatientDetailsPage;