import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { User, Appointment, Patient } from '../../types';
import { api } from '../../services/api';
import { CalendarIcon, UserGroupIcon } from '../Icons';
import { CenteredLoadingSpinner } from '../LoadingSpinner';

interface DashboardSecretaryProps {
    user: User;
    refreshTrigger: number;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType }> = ({ title, value, icon: Icon }) => (
     <div className="p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-xl shadow-md flex items-center space-x-4">
        <div className="flex-shrink-0">
            <div className="p-3 bg-primary-100 dark:bg-primary-900/40 rounded-full">
                <Icon className="h-6 w-6 text-primary dark:text-primary-300" />
            </div>
        </div>
        <div>
            <div className="text-lg sm:text-xl font-medium text-black dark:text-white">{value}</div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        </div>
    </div>
);

const formatTo12Hour = (time24: string): string => {
    if (!time24 || !time24.includes(':')) {
        return time24;
    }
    try {
        const [hours, minutes] = time24.split(':').map(Number);
        const ampm = hours >= 12 ? 'مساءً' : 'صباحًا';
        const hours12 = hours % 12 || 12;
        const paddedHours = hours12.toString().padStart(2, '0');
        const paddedMinutes = minutes.toString().padStart(2, '0');
        return `${paddedHours}:${paddedMinutes} ${ampm}`;
    } catch (e) {
        console.error("Failed to format time:", time24, e);
        return time24;
    }
};

const DashboardSecretary: React.FC<DashboardSecretaryProps> = ({ user, refreshTrigger }) => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [doctors, setDoctors] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const [apps, pats, docs] = await Promise.all([
                api.appointments.getAll(),
                api.patients.getAll(),
                api.doctors.getAll(),
            ]);
            setAppointments(apps);
            setPatients(pats);
            setDoctors(docs);
        } catch (error) {
            if (error instanceof Error && error.message.includes('Failed to fetch')) {
                setFetchError('فشل جلب البيانات الرجاء التأكد من اتصالك بالانترنت واعادة تحميل البيانات');
            } else {
                setFetchError('حدث خطأ غير متوقع.');
                console.error("Failed to fetch secretary dashboard data:", error);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData, refreshTrigger]);

    const getPatientName = (id: string) => patients.find(p => p.id === id)?.name || 'غير معروف';
    const getDoctorName = (id: string) => doctors.find(d => d.id === id)?.name || 'غير معروف';

    const todaysAppointments = useMemo(() => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-11
        const dd = String(today.getDate()).padStart(2, '0');
        const todayString = `${yyyy}-${mm}-${dd}`;
        return appointments.filter(app => app.date === todayString);
    }, [appointments]);
    
    if (fetchError) {
        return <div className="text-center py-16 text-red-500 dark:text-red-400 bg-white dark:bg-slate-800 rounded-xl shadow-md"><p>{fetchError}</p></div>;
    }

    return (
        <div>
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
                <StatCard title="مواعيد اليوم" value={loading ? '...' : todaysAppointments.length} icon={CalendarIcon} />
                <StatCard title="إجمالي المرضى" value={loading ? '...' : patients.length} icon={UserGroupIcon} />
            </div>
            <div className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">جدول العيادة الكامل لهذا اليوم</h2>
                {loading ? (
                    <CenteredLoadingSpinner />
                ) : todaysAppointments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-gray-900 dark:text-gray-200">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-700">
                                    <th className="p-3">الوقت</th>
                                    <th className="p-3">المريض</th>
                                    <th className="p-3">الطبيب</th>
                                    <th className="p-3">ملاحظات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {todaysAppointments.sort((a,b) => a.time.localeCompare(b.time)).map(app => (
                                    <tr key={app.id} className="border-b dark:border-gray-700">
                                        <td className="p-3 font-medium">{formatTo12Hour(app.time)}</td>
                                        <td className="p-3">{getPatientName(app.patientId)}</td>
                                        <td className="p-3">{getDoctorName(app.doctorId)}</td>
                                        <td className="p-3 text-gray-600 dark:text-gray-400">{app.notes}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="dark:text-gray-300 text-center py-8">لا توجد مواعيد مجدولة لهذا اليوم.</p>
                )}
            </div>
        </div>
    );
};

export default DashboardSecretary;