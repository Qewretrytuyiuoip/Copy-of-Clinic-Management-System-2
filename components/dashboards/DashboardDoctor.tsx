
import React, { useEffect, useState, useCallback } from 'react';
import { User, Patient, Appointment } from '../../types';
import { api } from '../../services/api';
import { UserGroupIcon, CalendarIcon } from '../Icons';
import { CenteredLoadingSpinner } from '../LoadingSpinner';

interface DashboardDoctorProps {
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

// Helper function to format time
const formatTo12Hour = (time24: string): string => {
    if (!time24 || !time24.includes(':')) {
        return time24; // Return original if format is unexpected
    }
    try {
        const [hours, minutes] = time24.split(':').map(Number);
        const ampm = hours >= 12 ? 'مساءً' : 'صباحًا';
        const hours12 = hours % 12 || 12; // Convert hour to 12-hour format
        const paddedHours = hours12.toString().padStart(2, '0');
        const paddedMinutes = minutes.toString().padStart(2, '0');
        return `${paddedHours}:${paddedMinutes} ${ampm}`;
    } catch (e) {
        console.error("Failed to format time:", time24, e);
        return time24;
    }
};


const DashboardDoctor: React.FC<DashboardDoctorProps> = ({ user, refreshTrigger }) => {
    const [patientCount, setPatientCount] = useState(0);
    const [todaysAppointments, setTodaysAppointments] = useState<Appointment[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setFetchError(null);
        try {
            // FIX: api.patients.getAll requires arguments.
            const [allPatientsResponse, allAppointments] = await Promise.all([
                api.patients.getAll({ page: 1, per_page: 9999 }),
                api.appointments.getAll()
            ]);
            
            // FIX: The API returns a pagination object. We need the 'patients' array from it.
            const allPatients = allPatientsResponse.patients;
            setPatients(allPatients); // Store all patients for name lookup

            const myPatients = allPatients.filter(p => p.doctorIds.includes(user.id));
            setPatientCount(myPatients.length);
            
            const today = new Date();
            const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            
            const myTodaysAppointments = allAppointments.filter(a => 
                a.doctorId === user.id && a.date === todayString
            );
            setTodaysAppointments(myTodaysAppointments.sort((a,b) => a.time.localeCompare(b.time)));
        } catch (error) {
            if (error instanceof Error && error.message.includes('Failed to fetch')) {
                setFetchError('فشل جلب البيانات الرجاء التأكد من اتصالك بالانترنت واعادة تحميل البيانات');
            } else {
                setFetchError('حدث خطأ غير متوقع.');
                console.error("Failed to fetch doctor dashboard data:", error);
            }
        } finally {
            setLoading(false);
        }
    }, [user.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData, refreshTrigger]);

    const getPatientName = (patientId: string) => {
        return patients.find(p => p.id === patientId)?.name || 'مريض غير معروف';
    };

    if (fetchError) {
        return <div className="text-center py-16 text-red-500 dark:text-red-400 bg-white dark:bg-slate-800 rounded-xl shadow-md"><p>{fetchError}</p></div>;
    }

    return (
        <div>
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
                <StatCard title="مرضاي" value={loading ? '...' : patientCount} icon={UserGroupIcon} />
                <StatCard title="مواعيد اليوم" value={loading ? '...' : todaysAppointments.length} icon={CalendarIcon} />
            </div>
             <div className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">جدول اليوم</h2>
                {loading ? (
                    <CenteredLoadingSpinner />
                ) : todaysAppointments.length > 0 ? (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {todaysAppointments.map(app => (
                            <li key={app.id} className="py-3 flex justify-between items-center">
                                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                                    <div className="font-mono text-lg font-semibold text-primary dark:text-primary-300 w-28 text-center">{formatTo12Hour(app.time)}</div>
                                    <div className="text-gray-900 dark:text-gray-100 font-medium">{getPatientName(app.patientId)}</div>
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" title={app.notes}>
                                    {app.notes}
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="dark:text-gray-300 text-center py-8">لا توجد مواعيد مجدولة لهذا اليوم.</p>
                )}
            </div>
        </div>
    );
};

export default DashboardDoctor;