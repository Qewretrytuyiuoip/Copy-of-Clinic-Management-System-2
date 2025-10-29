



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
                
                const myTodaysAppointmentsCount = allAppointments.filter(a => 
                    a.doctorId === user.id && a.date === todayString
                ).length;
                setTodaysAppointments(myTodaysAppointmentsCount);
            } catch (error) {
                console.error("Failed to fetch doctor dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user.id, refreshTrigger]);


    return (
        <div>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-8">
                <StatCard title="مرضاي" value={loading ? '...' : patientCount} icon={UserGroupIcon} />
                <StatCard title="مواعيد اليوم" value={loading ? '...' : todaysAppointments} icon={CalendarIcon} />
            </div>
             
            <DoctorSchedulePage user={user} refreshTrigger={refreshTrigger} />
        </div>
    );
};

export default DashboardDoctor;