


import React, { useEffect, useState, useCallback, useRef } from 'react';
import { User, Appointment, Payment, ActivityLog, ActivityLogActionType } from '../../types';
import { api } from '../../services/api';
import { CurrencyDollarIcon, UserGroupIcon, CalendarIcon, UsersIcon, PlusIcon, PencilIcon, TrashIcon, SearchIcon } from '../Icons';
import { CenteredLoadingSpinner } from '../LoadingSpinner';

interface DashboardAdminProps {
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

const ActionIcon: React.FC<{ action: ActivityLogActionType }> = ({ action }) => {
    const iconProps = { className: "h-5 w-5" };
    switch (action) {
        case ActivityLogActionType.Create:
            return <div className="bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-full p-2"><PlusIcon {...iconProps} /></div>;
        case ActivityLogActionType.Update:
            return <div className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full p-2"><PencilIcon {...iconProps} /></div>;
        case ActivityLogActionType.Delete:
            return <div className="bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full p-2"><TrashIcon {...iconProps} /></div>;
        default:
            return <div className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full p-2"><UsersIcon {...iconProps} /></div>;
    }
};

const LOGS_PER_PAGE = 5;

const DashboardAdmin: React.FC<DashboardAdminProps> = ({ user, refreshTrigger }) => {
    const [stats, setStats] = useState({ doctors: 0, patients: 0, appointments: 0, revenue: 0 });
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const isInitialMount = useRef(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setFetchError(null);
        try {
            // FIX: api.payments.getAll requires pagination arguments.
            const [doctors, fetchedPatients, appointments, paymentsResponse] = await Promise.all([
                api.doctors.getAll(),
                // FIX: api.patients.getAll requires arguments. Fetching 1 to get total count.
                api.patients.getAll({ page: 1, per_page: 1 }),
                api.appointments.getAll(),
                api.payments.getAll({ page: 1, per_page: 9999 }),
            ]);
            
            // FIX: The API returns a paginated object, use 'payments' property for the array.
            const totalRevenue = paymentsResponse.payments.reduce((sum, p) => sum + p.amount, 0);

            const today = new Date();
            const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            const todaysAppointmentsCount = appointments.filter(a => a.date === todayString).length;

            setStats({
                doctors: doctors.length,
                // FIX: The API returns a pagination object, use 'total' for patient count.
                patients: fetchedPatients.total,
                appointments: todaysAppointmentsCount,
                revenue: totalRevenue
            });

            // Fetch first page of logs
            const logData = await api.activityLogs.getAll({ page: 1, per_page: LOGS_PER_PAGE, search: '', date: '' });
            setLogs(logData.logs);
            setHasMore(logData.hasMore);
            setCurrentPage(1);
            setSearchTerm('');
            setDateFilter('');

        } catch (error) {
            if (error instanceof Error && error.message.includes('Failed to fetch')) {
                setFetchError('فشل جلب البيانات الرجاء التأكد من اتصالك بالانترنت واعادة تحميل البيانات');
            } else {
                setFetchError('حدث خطأ غير متوقع.');
                console.error("Failed to fetch admin dashboard data:", error);
            }
        } finally {
            setLoading(false);
            isInitialMount.current = false;
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData, refreshTrigger]);

     useEffect(() => {
        if (isInitialMount.current) return;

        const handler = setTimeout(async () => {
            setLoading(true);
            try {
                const { logs: newLogs, hasMore: newHasMore } = await api.activityLogs.getAll({ page: 1, per_page: LOGS_PER_PAGE, search: searchTerm, date: dateFilter });
                setLogs(newLogs);
                setHasMore(newHasMore);
                setCurrentPage(1);
            } catch (err) {
                 setFetchError('فشل في جلب سجل النشاط.');
            } finally {
                setLoading(false);
            }
        }, 500); // Debounce search

        return () => clearTimeout(handler);
    }, [searchTerm, dateFilter]);

    const handleShowMore = async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        try {
            const nextPage = currentPage + 1;
            const { logs: newLogs, hasMore: newHasMore } = await api.activityLogs.getAll({ page: nextPage, per_page: LOGS_PER_PAGE, search: searchTerm, date: dateFilter });
            setLogs(prev => [...prev, ...newLogs]);
            setHasMore(newHasMore);
            setCurrentPage(nextPage);
        } catch(err) {
            setFetchError('فشل في تحميل المزيد من السجلات.');
        } finally {
            setLoadingMore(false);
        }
    };

    if (loading && logs.length === 0) return <CenteredLoadingSpinner />;
    if (fetchError && logs.length === 0) {
        return <div className="text-center py-16 text-red-500 dark:text-red-400 bg-white dark:bg-slate-800 rounded-xl shadow-md"><p>{fetchError}</p></div>;
    }

    return (
        <div>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
                <StatCard title="إجمالي الأطباء" value={stats.doctors} icon={UsersIcon} />
                <StatCard title="إجمالي المرضى" value={stats.patients} icon={UserGroupIcon} />
                <StatCard title="مواعيد اليوم" value={stats.appointments} icon={CalendarIcon} />
                <StatCard title="إجمالي الإيرادات" value={`$${stats.revenue.toLocaleString()}`} icon={CurrencyDollarIcon} />
            </div>
            <div className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">النشاط الأخير</h2>
                 <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="relative flex-grow">
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <SearchIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="ابحث بالوصف، اسم المريض أو المستخدم..."
                            className="w-full pl-3 pr-10 py-2 bg-white dark:bg-gray-700 text-black dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="px-3 py-2 bg-white dark:bg-gray-700 text-black dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                </div>
                
                {loading && logs.length === 0 ? <CenteredLoadingSpinner /> : logs.length > 0 ? (
                    <div className="space-y-4">
                        {logs.map(log => (
                            <div key={log.id} className="flex items-start space-x-4 rtl:space-x-reverse p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                <ActionIcon action={log.actionType} />
                                <div className="flex-grow">
                                    <p className="text-sm text-gray-800 dark:text-gray-200">{log.description}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        بواسطة {log.userName} &bull; {new Date(log.timestamp).toLocaleString('ar-SA', { dateStyle: 'medium', timeStyle: 'short' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                        <p>لا يوجد نشاط يطابق بحثك.</p>
                    </div>
                )}
                {fetchError && <p className="text-center text-sm text-red-500 mt-4">{fetchError}</p>}

                {hasMore && (
                    <div className="mt-6 text-center">
                        <button
                            onClick={handleShowMore}
                            disabled={loadingMore}
                            className="px-6 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 transition-colors disabled:bg-primary-300 disabled:cursor-not-allowed"
                        >
                            {loadingMore ? 'جاري التحميل...' : 'عرض المزيد'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardAdmin;