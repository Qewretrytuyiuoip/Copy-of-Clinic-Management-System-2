import React, { useEffect, useState, useCallback } from 'react';
import { User, Appointment, Patient } from '../../types';
import { api } from '../../services/api';
import { CalendarIcon, UserGroupIcon } from '../Icons';
import AppointmentsPage from '../../pages/AppointmentsPage';

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


const DashboardSecretary: React.FC<DashboardSecretaryProps> = ({ user, refreshTrigger }) => {
    const [stats, setStats] = useState({ appointments: 0, patients: 0 });
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const [apps, patsResponse] = await Promise.all([
                api.appointments.getAll(),
                api.patients.getAll({ page: 1, per_page: 1 }), // Only need total count
            ]);
            
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            const todayString = `${yyyy}-${mm}-${dd}`;
            const todaysAppointmentsCount = apps.filter(app => app.date === todayString).length;

            setStats({
                appointments: todaysAppointmentsCount,
                patients: patsResponse.total,
            });

        } catch (error) {
            console.error("Failed to fetch secretary dashboard stats:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats, refreshTrigger]);


    return (
        <div>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-8">
                <StatCard title="مواعيد اليوم" value={loading ? '...' : stats.appointments} icon={CalendarIcon} />
                <StatCard title="إجمالي المرضى" value={loading ? '...' : stats.patients} icon={UserGroupIcon} />
            </div>
            
            <AppointmentsPage user={user} refreshTrigger={refreshTrigger} />
        </div>
    );
};

export default DashboardSecretary;
