
import React, { useEffect, useState } from 'react';
import { User, Patient, Appointment } from '../../types';
import { api } from '../../services/api';
import { UserGroupIcon, CalendarIcon } from '../Icons';

interface DashboardDoctorProps {
    user: User;
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


const DashboardDoctor: React.FC<DashboardDoctorProps> = ({ user }) => {
    const [patientCount, setPatientCount] = useState(0);
    const [appointments, setAppointments] = useState<Appointment[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const myPatients = await api.patients.getAll();
            setPatientCount(myPatients.filter(p => p.doctorId === user.id).length);
            const allAppointments = await api.appointments.getAll();
            setAppointments(allAppointments.filter(a => a.doctorId === user.id));
        };
        fetchData();
    }, [user.id]);

    return (
        <div>
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
                <StatCard title="مرضاي" value={patientCount} icon={UserGroupIcon} />
                <StatCard title="المواعيد القادمة" value={appointments.length} icon={CalendarIcon} />
            </div>
             <div className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">جدول اليوم</h2>
                {appointments.length > 0 ? (
                    <ul className="dark:text-gray-200">
                        {appointments.map(app => (
                            <li key={app.id} className="border-b dark:border-gray-700 py-2 flex justify-between">
                                <span>{app.time} - معرف المريض: {app.patientId}</span>
                                <span className="text-gray-600 dark:text-gray-400">{app.notes}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="dark:text-gray-300">لا توجد مواعيد مجدولة لهذا اليوم.</p>
                )}
            </div>
        </div>
    );
};

export default DashboardDoctor;