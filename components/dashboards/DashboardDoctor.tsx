
import React, { useEffect, useState, useCallback } from 'react';
import { User, Patient, Appointment } from '../../types';
import { api } from '../../services/api';
import { UserGroupIcon, CalendarIcon } from '../Icons';
import DoctorSchedulePage from '../../pages/DoctorSchedulePage';

interface DashboardDoctorProps {
    user: User;
    refreshTrigger: number;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType }> = ({ title, value, icon: Icon }) => (
    <div className="group relative w-full p-5 rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/60 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        {/* Right Glow Bar - Neon Effect */}
        <div className="absolute top-1/2 -translate-y-1/2 right-0 h-12 w-1 bg-gradient-to-b from-transparent via-primary-400 to-transparent rounded-l-full opacity-70 group-hover:opacity-100 group-hover:h-16 group-hover:w-1.5 transition-all duration-500 shadow-[0_0_15px_rgba(56,189,248,0.5)]"></div>

        <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
                {/* Icon Container */}
                <div className="flex-shrink-0 p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-900/50 text-primary-600 dark:text-primary-400 shadow-inner group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-7 w-7" />
                </div>
                
                <div className="text-right">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors duration-300">
                        {title}
                    </p>
                    <div className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mt-1 tracking-tight">
                        {value}
                    </div>
                </div>
            </div>

            {/* Left Dot Indicator */}
            <div className="w-2 h-2 rounded-full bg-primary-400/80 dark:bg-primary-500/80 shadow-[0_0_8px_rgba(56,189,248,0.6)]"></div>
        </div>

        {/* Background Gradient Highlight */}
        <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-primary-500/5 rounded-full blur-2xl group-hover:bg-primary-500/10 transition-colors duration-500"></div>
    </div>
);


const DashboardDoctor: React.FC<DashboardDoctorProps> = ({ user, refreshTrigger }) => {
    const [patientCount, setPatientCount] = useState(0);
    const [todaysAppointments, setTodaysAppointments] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [myPatientsResponse, allAppointments] = await Promise.all([
                    api.patients.getAll({ page: 1, per_page: 1, doctorId: user.id }),
                    api.appointments.getAll()
                ]);
                
                setPatientCount(myPatientsResponse.total);
                
                const today = new Date();
                const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                
                const hasPermission = user.permissions?.some(p => p.name === 'view_center_appointments');
                
                let todaysAppointmentsCount = 0;
                if (hasPermission) {
                    todaysAppointmentsCount = allAppointments.filter(a => a.date === todayString).length;
                } else {
                    todaysAppointmentsCount = allAppointments.filter(a => 
                        a.doctorId === user.id && a.date === todayString
                    ).length;
                }
                setTodaysAppointments(todaysAppointmentsCount);
            } catch (error) {
                console.error("Failed to fetch doctor dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user, refreshTrigger]);


    return (
        <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <StatCard title="مرضاي" value={loading ? '...' : patientCount.toLocaleString('en-US')} icon={UserGroupIcon} />
                <StatCard title="مواعيد اليوم" value={loading ? '...' : todaysAppointments.toLocaleString('en-US')} icon={CalendarIcon} />
            </div>
             
            <DoctorSchedulePage user={user} refreshTrigger={refreshTrigger} />
        </div>
    );
};

export default DashboardDoctor;
