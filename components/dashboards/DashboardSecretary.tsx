
import React, { useEffect, useState } from 'react';
import { User, Appointment, Patient } from '../../types';
import { api } from '../../services/api';
import { CalendarIcon, UserGroupIcon } from '../Icons';

interface DashboardSecretaryProps {
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

const DashboardSecretary: React.FC<DashboardSecretaryProps> = ({ user }) => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const [apps, pats] = await Promise.all([
                api.appointments.getAll(),
                api.patients.getAll()
            ]);
            setAppointments(apps);
            setPatients(pats);
        };
        fetchData();
    }, []);

    const getPatientName = (id: string) => patients.find(p => p.id === id)?.name || 'غير معروف';

    return (
        <div>
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
                <StatCard title="مواعيد اليوم" value={appointments.length} icon={CalendarIcon} />
                <StatCard title="إجمالي المرضى" value={patients.length} icon={UserGroupIcon} />
            </div>
            <div className="mt-8 bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold mb-4">جدول العيادة الكامل لهذا اليوم</h2>
                 {appointments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="p-3">الوقت</th>
                                    <th className="p-3">المريض</th>
                                    <th className="p-3">معرف الطبيب</th>
                                    <th className="p-3">ملاحظات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appointments.sort((a,b) => a.time.localeCompare(b.time)).map(app => (
                                    <tr key={app.id} className="border-b">
                                        <td className="p-3 font-medium">{app.time}</td>
                                        <td className="p-3">{getPatientName(app.patientId)}</td>
                                        <td className="p-3">{app.doctorId}</td>
                                        <td className="p-3 text-gray-600">{app.notes}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p>لا توجد مواعيد مجدولة لهذا اليوم.</p>
                )}
            </div>
        </div>
    );
};

export default DashboardSecretary;