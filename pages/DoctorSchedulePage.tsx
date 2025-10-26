import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { User, Appointment, Patient } from '../types';
import { api } from '../services/api';
import { CenteredLoadingSpinner } from '../components/LoadingSpinner';
import { SearchIcon, CalendarIcon, ClockIcon } from '../components/Icons';

interface DoctorSchedulePageProps {
    user: User;
    refreshTrigger: number;
}

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

type DateFilter = 'all' | 'today' | 'week' | 'month' | 'finished';

const DoctorSchedulePage: React.FC<DoctorSchedulePageProps> = ({ user, refreshTrigger }) => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState<DateFilter>('today');

    const fetchData = useCallback(async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const [allAppointments, allPatientsResponse] = await Promise.all([
                api.appointments.getAll(),
                // FIX: api.patients.getAll requires arguments.
                api.patients.getAll({ page: 1, per_page: 9999 }),
            ]);
            
            const myAppointments = allAppointments.filter(app => app.doctorId === user.id);
            setAppointments(myAppointments);
            // FIX: The API returns a pagination object. We need the 'patients' array from it.
            setPatients(allPatientsResponse.patients); // Keep all patients for name lookup
        } catch (error) {
            if (error instanceof Error && error.message.includes('Failed to fetch')) {
                setFetchError('فشل جلب البيانات الرجاء التأكد من اتصالك بالانترنت واعادة تحميل البيانات');
            } else {
                setFetchError('حدث خطأ غير متوقع.');
                console.error("Failed to fetch schedule data:", error);
            }
        } finally {
            setLoading(false);
        }
    }, [user.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData, refreshTrigger]);

    const getPatientName = (id: string) => patients.find(p => p.id === id)?.name || 'غير معروف';

    const indicatorCounts = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday as start of week

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);

        let weekIndicatorCount = 0;
        let monthIndicatorCount = 0;

        appointments.forEach(app => {
            const appDate = new Date(app.date);
            appDate.setMinutes(appDate.getMinutes() + appDate.getTimezoneOffset());
            appDate.setHours(0, 0, 0, 0);

            // Upcoming this week (from tomorrow onwards)
            if (appDate > today && appDate <= endOfWeek) {
                weekIndicatorCount++;
            }
            // Upcoming this month, but after this week
            if (appDate > endOfWeek && appDate <= endOfMonth) {
                monthIndicatorCount++;
            }
        });
        
        return { weekIndicatorCount, monthIndicatorCount };
    }, [appointments]);

    const filteredAppointments = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday as start of week

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);

        return appointments
            .filter(app => {
                const appDate = new Date(app.date);
                appDate.setMinutes(appDate.getMinutes() + appDate.getTimezoneOffset());
                appDate.setHours(0, 0, 0, 0);

                switch (dateFilter) {
                    case 'today':
                        return appDate.getTime() === today.getTime();
                    case 'week':
                        return appDate > today && appDate <= endOfWeek;
                    case 'month':
                        return appDate > today && appDate <= endOfMonth;
                    case 'finished':
                        return appDate.getTime() < today.getTime();
                    case 'all':
                    default:
                        return true;
                }
            })
            .filter(app => getPatientName(app.patientId).toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.time.localeCompare(b.time));
    }, [appointments, patients, searchTerm, dateFilter]);
    
    const FilterButton: React.FC<{ filter: DateFilter; text: string; indicator?: number }> = ({ filter, text, indicator }) => {
        const isActive = dateFilter === filter;
        return (
             <button
                onClick={() => setDateFilter(filter)}
                className={`relative px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                    isActive
                        ? 'bg-primary text-white shadow'
                        : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-600 border border-gray-200 dark:border-gray-600'
                }`}
            >
                {text}
                {indicator && indicator > 0 && (
                    <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-700"></span>
                )}
            </button>
        );
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">جدولي</h1>
                 <div className="relative w-full max-w-sm">
                   <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                       <SearchIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                   </div>
                   <input
                       type="text"
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       placeholder="ابحث عن مريض..."
                       className="w-full pl-3 pr-10 py-2 bg-white dark:bg-gray-700 text-black dark:text-white border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                   />
                </div>
            </div>
            
            <div className="mb-6 flex flex-wrap gap-2">
                <FilterButton filter="today" text="اليوم" />
                <FilterButton filter="week" text="هذا الأسبوع" indicator={indicatorCounts.weekIndicatorCount} />
                <FilterButton filter="month" text="هذا الشهر" indicator={indicatorCounts.monthIndicatorCount} />
                <FilterButton filter="finished" text="مواعيد منتهية" />
                <FilterButton filter="all" text="الكل" />
            </div>

            <div className="min-h-[200px]">
                {loading ? <CenteredLoadingSpinner /> : fetchError ? (
                     <div className="text-center py-16 text-red-500 dark:text-red-400 bg-white dark:bg-slate-800 rounded-xl shadow-md"><p>{fetchError}</p></div>
                ) : (
                    filteredAppointments.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredAppointments.map(app => (
                                <div key={app.id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col shadow-md transition-shadow hover:shadow-lg">
                                    <div className="flex-grow">
                                        <h3 className="text-xl font-bold text-primary">{getPatientName(app.patientId)}</h3>
                                        <div className="mt-3 space-y-2 text-gray-700 dark:text-gray-300">
                                            <p className="flex items-center"><CalendarIcon className="h-5 w-5 ml-2 text-gray-500 dark:text-gray-400" /> {new Date(app.date).toLocaleDateString()}</p>
                                            <p className="flex items-center"><ClockIcon className="h-5 w-5 ml-2 text-gray-500 dark:text-gray-400" /> {formatTo12Hour(app.time)}</p>
                                        </div>
                                        {app.notes && <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 p-3 rounded-md border dark:border-gray-600">ملاحظات: {app.notes}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-16 bg-white dark:bg-slate-800 rounded-xl shadow-md">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">لا توجد مواعيد</h3>
                            <p className="mt-2">لم يتم العثور على مواعيد تطابق الفلترة الحالية.</p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default DoctorSchedulePage;