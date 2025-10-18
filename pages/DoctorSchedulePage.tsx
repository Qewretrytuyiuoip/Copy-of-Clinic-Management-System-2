import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { User, Appointment, Patient } from '../types';
import { api } from '../services/api';
import { CenteredLoadingSpinner } from '../components/LoadingSpinner';
import { SearchIcon, CalendarIcon, ClockIcon } from '../components/Icons';

interface DoctorSchedulePageProps {
    user: User;
}

type DateFilter = 'all' | 'today' | 'week' | 'month';

const DoctorSchedulePage: React.FC<DoctorSchedulePageProps> = ({ user }) => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState<DateFilter>('all');

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [allAppointments, allPatients] = await Promise.all([
            api.appointments.getAll(),
            api.patients.getAll(),
        ]);
        
        const myAppointments = allAppointments.filter(app => app.doctorId === user.id);
        setAppointments(myAppointments);
        setPatients(allPatients); // Keep all patients for name lookup
        setLoading(false);
    }, [user.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const getPatientName = (id: string) => patients.find(p => p.id === id)?.name || 'غير معروف';

    const filteredAppointments = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday as start of week

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        return appointments
            .filter(app => {
                const appDate = new Date(app.date);
                appDate.setHours(0, 0, 0, 0); // Ignore time for date comparison

                switch (dateFilter) {
                    case 'today':
                        return appDate.getTime() === today.getTime();
                    case 'week':
                        return appDate >= startOfWeek && appDate <= endOfWeek;
                    case 'month':
                        return appDate.getFullYear() === today.getFullYear() && appDate.getMonth() === today.getMonth();
                    case 'all':
                    default:
                        return true;
                }
            })
            .filter(app => getPatientName(app.patientId).toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.time.localeCompare(b.time));
    }, [appointments, patients, searchTerm, dateFilter]);
    
    const FilterButton: React.FC<{ filter: DateFilter; text: string; }> = ({ filter, text }) => {
        const isActive = dateFilter === filter;
        return (
            <button
                onClick={() => setDateFilter(filter)}
                className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                    isActive
                        ? 'bg-primary text-white shadow'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border'
                }`}
            >
                {text}
            </button>
        );
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">جدولي</h1>
                 <div className="relative w-full max-w-sm">
                   <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                       <SearchIcon className="w-5 h-5 text-gray-400" />
                   </div>
                   <input
                       type="text"
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       placeholder="ابحث عن مريض..."
                       className="w-full pl-3 pr-10 py-2 bg-white border border-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black"
                   />
                </div>
            </div>
            
            <div className="mb-6 flex flex-wrap gap-2">
                <FilterButton filter="all" text="الكل" />
                <FilterButton filter="today" text="اليوم" />
                <FilterButton filter="week" text="هذا الأسبوع" />
                <FilterButton filter="month" text="هذا الشهر" />
            </div>

            <div className="min-h-[200px]">
                {loading ? <CenteredLoadingSpinner /> : (
                    filteredAppointments.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredAppointments.map(app => (
                                <div key={app.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col shadow-md transition-shadow hover:shadow-lg">
                                    <div className="flex-grow">
                                        <h3 className="text-xl font-bold text-primary">{getPatientName(app.patientId)}</h3>
                                        <div className="mt-3 space-y-2 text-gray-700">
                                            <p className="flex items-center"><CalendarIcon className="h-5 w-5 ml-2 text-gray-500" /> {new Date(app.date).toLocaleDateString()}</p>
                                            <p className="flex items-center"><ClockIcon className="h-5 w-5 ml-2 text-gray-500" /> {app.time}</p>
                                        </div>
                                        {app.notes && <p className="mt-4 text-sm text-gray-600 bg-gray-100 p-3 rounded-md border">ملاحظات: {app.notes}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-16 bg-white rounded-xl shadow-md">
                            <h3 className="text-xl font-semibold">لا توجد مواعيد</h3>
                            <p className="mt-2">لم يتم العثور على مواعيد تطابق الفلترة الحالية.</p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default DoctorSchedulePage;