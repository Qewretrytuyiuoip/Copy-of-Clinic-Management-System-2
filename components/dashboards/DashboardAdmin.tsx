import React, { useEffect, useState, useCallback, useRef } from 'react';
import { User, Appointment, ActivityLog, ActivityLogActionType } from '../../types';
import { api } from '../../services/api';
import { UserGroupIcon, CalendarIcon, UsersIcon, PlusIcon, PencilIcon, TrashIcon, SearchIcon, DocumentTextIcon, XIcon, CurrencyDollarIcon } from '../Icons';
import { CenteredLoadingSpinner } from '../LoadingSpinner';

interface DashboardAdminProps {
    user: User;
    refreshTrigger: number;
    setCurrentPage: (page: string) => void;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType; onClick?: () => void }> = ({ title, value, icon: Icon, onClick }) => {
    const Component = onClick ? 'button' : 'div';
    const props = onClick ? { onClick, type: 'button' as const } : {};

    return (
        <Component
            {...props}
            className={`p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-xl shadow-md flex items-center space-x-4 rtl:space-x-reverse text-right w-full ${onClick ? 'hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors' : ''}`}
        >
            <div className="flex-shrink-0">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/40 rounded-full">
                    <Icon className="h-6 w-6 text-primary dark:text-primary-300" />
                </div>
            </div>
            <div>
                <div className="text-lg sm:text-xl font-medium text-black dark:text-white">{value}</div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            </div>
        </Component>
    );
};

const OnDutyDoctorsModal: React.FC<{ doctors: User[]; onClose: () => void }> = ({ doctors, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md" role="dialog" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">الأطباء المداومون اليوم</h2>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" /></button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
                {doctors.length > 0 ? (
                    <ul className="space-y-3">
                        {doctors.map(doctor => (
                            <li key={doctor.id} className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg flex items-center justify-between">
                                <span className="font-semibold text-gray-800 dark:text-gray-100">{doctor.name}</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">{doctor.specialty}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400">لا يوجد أطباء مداومون اليوم.</p>
                )}
            </div>
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

const LOGS_PER_PAGE = 10;

const DashboardAdmin: React.FC<DashboardAdminProps> = ({ user, refreshTrigger, setCurrentPage }) => {
    const [stats, setStats] = useState({ doctors: 0, patients: 0, appointments: 0 });
    const [onDutyDoctors, setOnDutyDoctors] = useState<User[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [currentPage, setCurrentPageNum] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const isInitialMount = useRef(true);
    
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setFetchError(null);
            try {
                const [doctors, allPatientsResponse, appointments, allSchedules] = await Promise.all([
                    api.doctors.getAll(),
                    api.patients.getAll({ page: 1, per_page: 9999 }),
                    api.appointments.getAll(),
                    api.doctorSchedules.getAll(),
                ]);

                const today = new Date();
                const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                const todaysAppointmentsCount = appointments.filter(a => a.date === todayString).length;

                const todayDayOfWeek = today.getDay();
                const onDutyDoctorIds = new Set(
                    allSchedules
                        .filter(schedule => schedule.day === todayDayOfWeek && schedule.isWorkDay)
                        .map(schedule => schedule.doctorId)
                );
                const onDuty = doctors.filter(doctor => onDutyDoctorIds.has(doctor.id));
                setOnDutyDoctors(onDuty);
                
                const incompletePatientsCount = allPatientsResponse.patients.filter(p => !p.completed).length;

                setStats({
                    doctors: onDuty.length,
                    patients: incompletePatientsCount,
                    appointments: todaysAppointmentsCount,
                });

                const logData = await api.activityLogs.getAll({ page: 1, per_page: LOGS_PER_PAGE, search: '' });
                setLogs(logData.logs);
                setHasMore(logData.hasMore);
                setCurrentPageNum(1);
                setSearchTerm('');

            } catch (error) {
                if (error instanceof Error && (error.message.includes('Failed to fetch') || error.message.includes('Offline'))) {
                    setFetchError('فشل جلب البيانات. يرجى التأكد من اتصالك بالإنترنت والمحاولة مرة أخرى.');
                } else {
                    setFetchError('حدث خطأ غير متوقع أثناء تحميل بيانات لوحة التحكم.');
                    console.error("Failed to fetch admin dashboard data:", error);
                }
            } finally {
                setLoading(false);
                isInitialMount.current = false;
            }
        };
        fetchData();
    }, [refreshTrigger]);

     useEffect(() => {
        if (isInitialMount.current) return;

        const handler = setTimeout(async () => {
            setLoading(true);
            try {
                const { logs: newLogs, hasMore: newHasMore } = await api.activityLogs.getAll({ page: 1, per_page: LOGS_PER_PAGE, search: searchTerm });
                setLogs(newLogs);
                setHasMore(newHasMore);
                setCurrentPageNum(1);
            } catch (err) {
                 setFetchError('فشل في جلب سجل النشاط.');
            } finally {
                setLoading(false);
            }
        }, 500);

        return () => clearTimeout(handler);
    }, [searchTerm]);


    const handleShowMore = async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        try {
            const nextPage = currentPage + 1;
            const { logs: newLogs, hasMore: newHasMore } = await api.activityLogs.getAll({ page: nextPage, per_page: LOGS_PER_PAGE, search: searchTerm });
            setLogs(prev => [...prev, ...newLogs]);
            setHasMore(newHasMore);
            setCurrentPageNum(nextPage);
        } catch(err) {
            setFetchError('فشل في تحميل المزيد من السجلات.');
        } finally {
            setLoadingMore(false);
        }
    };

    if (loading && logs.length === 0 && isInitialMount.current) return <CenteredLoadingSpinner />;
    
    return (
        <div>
            {isModalOpen && <OnDutyDoctorsModal doctors={onDutyDoctors} onClose={() => setIsModalOpen(false)} />}
             {fetchError && logs.length === 0 && <p className="text-center text-lg text-red-500 mb-4">{fetchError}</p>}
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
                <StatCard title="الأطباء المداومون اليوم" value={stats.doctors} icon={UsersIcon} onClick={() => setIsModalOpen(true)} />
                <StatCard title="المرضى الغير مكتملين" value={stats.patients} icon={UserGroupIcon} />
                <StatCard title="مواعيد اليوم" value={stats.appointments} icon={CalendarIcon} />
                <StatCard title="أرشيف الأحداث" value="عرض السجل" icon={DocumentTextIcon} onClick={() => setCurrentPage('activity-archives')} />
            </div>
            <div className="mt-8 bg-white dark:bg-slate-800 rounded-xl shadow-md">
                 <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">النشاط الأخير</h2>
                </div>
                <div className="p-6">
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
                    {fetchError && logs.length > 0 && <p className="text-center text-sm text-red-500 mt-4">{fetchError}</p>}

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
        </div>
    );
};

export default DashboardAdmin;