
import React, { useEffect, useState } from 'react';
import { User, Patient, Appointment, Payment } from '../../types';
import { api } from '../../services/api';
import { CurrencyDollarIcon, UserGroupIcon, CalendarIcon, UsersIcon } from '../Icons';

interface DashboardAdminProps {
    user: User;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType }> = ({ title, value, icon: Icon }) => (
    <div className="p-4 sm:p-6 bg-white rounded-xl shadow-md flex items-center space-x-4">
        <div className="flex-shrink-0">
            <div className="p-3 bg-primary-100 rounded-full">
                <Icon className="h-6 w-6 text-primary" />
            </div>
        </div>
        <div>
            <div className="text-lg sm:text-xl font-medium text-black">{value}</div>
            <p className="text-sm text-gray-500">{title}</p>
        </div>
    </div>
);

const DashboardAdmin: React.FC<DashboardAdminProps> = ({ user }) => {
    const [stats, setStats] = useState({ doctors: 0, patients: 0, appointments: 0, revenue: 0 });
    
    useEffect(() => {
        const fetchData = async () => {
            const [doctors, patients, appointments, payments] = await Promise.all([
                api.doctors.getAll(),
                api.patients.getAll(),
                api.appointments.getAll(),
                api.payments.getAll()
            ]);
            const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
            setStats({
                doctors: doctors.length,
                patients: patients.length,
                appointments: appointments.length,
                revenue: totalRevenue
            });
        };
        fetchData();
    }, []);

    return (
        <div>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
                <StatCard title="إجمالي الأطباء" value={stats.doctors} icon={UsersIcon} />
                <StatCard title="إجمالي المرضى" value={stats.patients} icon={UserGroupIcon} />
                <StatCard title="مواعيد اليوم" value={stats.appointments} icon={CalendarIcon} />
                <StatCard title="إجمالي الإيرادات" value={`$${stats.revenue.toLocaleString()}`} icon={CurrencyDollarIcon} />
            </div>
            <div className="mt-8 bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold mb-4">النشاط الأخير</h2>
                <p>سجل النشاط قادم قريبا...</p>
            </div>
        </div>
    );
};

export default DashboardAdmin;