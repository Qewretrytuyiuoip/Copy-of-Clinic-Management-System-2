
import React, { useEffect, useState } from 'react';
import { User, Patient, Appointment } from '../../types';
import { api } from '../../services/api';
import { UserGroupIcon, CalendarIcon } from '../Icons';

interface DashboardDoctorProps {
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
             <div className="mt-8 bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold mb-4">جدول اليوم</h2>
                {appointments.length > 0 ? (
                    <ul>
                        {appointments.map(app => (
                            <li key={app.id} className="border-b py-2 flex justify-between">
                                <span>{app.time} - معرف المريض: {app.patientId}</span>
                                <span className="text-gray-600">{app.notes}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>لا توجد مواعيد مجدولة لهذا اليوم.</p>
                )}
            </div>
        </div>
    );
};

export default DashboardDoctor;