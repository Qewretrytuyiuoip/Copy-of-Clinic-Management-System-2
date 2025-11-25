
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { User, Appointment, ActivityLog, ActivityLogActionType } from '../../types';
import { api } from '../../services/api';
import { UserGroupIcon, CalendarIcon, UsersIcon, PlusIcon, PencilIcon, TrashIcon, SearchIcon, DocumentTextIcon, XIcon, CurrencyDollarIcon, ChevronLeftIcon } from '../Icons';
import { CenteredLoadingSpinner } from '../LoadingSpinner';

interface DashboardAdminProps {
    user: User;
    refreshTrigger: number;
    setCurrentPage: (page: string) => void;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType; onClick?: () => void; hint?: string }> = ({ title, value, icon: Icon, onClick, hint }) => {
    const Component = onClick ? 'button' : 'div';
    const props = onClick ? { onClick, type: 'button' as const } : {};

    return (
        <Component
            {...props}
            className={`group relative w-full p-3 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/60 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${onClick ? 'cursor-pointer text-right' : ''}`}
        >
            {/* Right Glow Bar - Neon Effect */}
            <div className="absolute top-1/2 -translate-y-1/2 right-0 h-12 w-1 bg-gradient-to-b from-transparent via-primary-400 to-transparent rounded-l-full opacity-70 group-hover:opacity-100 group-hover:h-16 group-hover:w-1.5 transition-all duration-500 shadow-[0_0_15px_rgba(56,189,248,0.5)]"></div>

            <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4">
                    {/* Icon Container */}
                    <div className="flex-shrink-0 p-2 sm:p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-900/50 text-primary-600 dark:text-primary-400 shadow-inner group-hover:scale-110 transition-transform duration-300">
                        <Icon className="h-5 w-5 sm:h-7 sm:w-7" />
                    </div>
                    
                    <div className="text-right min-w-0">
                        <p className="text-[10px] sm:text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors duration-300 line-clamp-2">
                            {title}
                        </p>
                        <div className="text-lg sm:text-3xl font-bold text-gray-800 dark:text-white mt-1 tracking-tight truncate">
                            {value}
                        </div>
                    </div>
                </div>

                {/* Left Dot Indicator - Hidden on mobile to save space */}
                <div className="hidden sm:block w-2 h-2 rounded-full bg-primary-400/80 dark:bg-primary-500/80 shadow-[0_0_8px_rgba(56,189,248,0.6)]"></div>
            </div>

            {/* Hint Text */}
            {hint && (
                <div className="relative z-10 mt-2 sm:mt-3 flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-[9px] sm:text-[10px] font-medium text-primary-600 dark:text-primary-400">{hint}</span>
                    <ChevronLeftIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary-600 dark:text-primary-400" />
                </div>
            )}

            {/* Background Gradient Highlight */}
            <div className="absolute -bottom-4 -left-4 w-16 h-16 sm:w-24 sm:h-24 bg-primary-500/5 rounded-full blur-2xl group-hover:bg-primary-500/10 transition-colors duration-500"></div>
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

const formatLogText = (text: string) => {
    if (!text) return '';
    return text.replace(/\b\d+(\.\d+)?\b/g, (match) => {
        // Check if it's likely a phone number (starts with 0, no decimals, length > 4)
        // or just preserving leading zeros for codes
        if (match.startsWith('0') && !match.includes('.') && match.length > 1) return match;
        
        const num = Number(match);
        if (isNaN(num)) return match;
        
        return num.toLocaleString('en-US');
    });
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
            <div className="grid grid-cols-2 gap-3 sm:gap-6">
                <StatCard 
                    title="الأطباء المداومون اليوم" 
                    value={stats.doctors.toLocaleString('en-US')} 
                    icon={UsersIcon} 
                    onClick={() => setIsModalOpen(true)} 
                    hint="يمكنك الضغط هنا"
                />
                <StatCard 
                    title="المرضى الغير مكتملين" 
                    value={stats.patients.toLocaleString('en-US')} 
                    icon={UserGroupIcon} 
                />
                <StatCard 
                    title="مواعيد اليوم" 
                    value={stats.appointments.toLocaleString('en-US')} 
                    icon={CalendarIcon} 
                />
                <StatCard 
                    title="أرشيف الأحداث" 
                    value="عرض السجل" 
                    icon={DocumentTextIcon} 
                    onClick={() => setCurrentPage('activity-archives')} 
                    hint="يمكنك الضغط هنا"
                />
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
                                        <p className="text-sm text-gray-800 dark:text-gray-200">{formatLogText(log.description)}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            بواسطة {log.userName} &bull; {new Date(log.timestamp).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
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
