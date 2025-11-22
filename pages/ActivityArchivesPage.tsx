
import React, { useState, useEffect } from 'react';
import { ActivityLog, ActivityLogActionType } from '../types';
import { api } from '../services/api';
import { CenteredLoadingSpinner } from '../components/LoadingSpinner';
import { PlusIcon, PencilIcon, TrashIcon, UsersIcon, ArrowBackIcon } from '../components/Icons';

interface ActivityArchivesPageProps {
    onBack: () => void;
    refreshTrigger: number;
}

const LOGS_PER_PAGE = 10;

const Pagination: React.FC<{
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    return (
        <nav className="flex items-center justify-center" aria-label="Pagination">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 mx-1 leading-tight text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
                السابق
            </button>
            <div className="flex items-center mx-4">
                <span className="text-sm text-gray-700 dark:text-gray-400">
                    صفحة <span className="font-semibold text-gray-900 dark:text-white">{currentPage}</span> من <span className="font-semibold text-gray-900 dark:text-white">{totalPages}</span>
                </span>
            </div>
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 mx-1 leading-tight text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
                التالي
            </button>
        </nav>
    );
};


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
        if (match.startsWith('0') && !match.includes('.') && match.length > 1) return match;
        const num = Number(match);
        if (isNaN(num)) return match;
        return num.toLocaleString('en-US');
    });
};

const ActivityArchivesPage: React.FC<ActivityArchivesPageProps> = ({ onBack, refreshTrigger }) => {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [dateFilter, setDateFilter] = useState('');

    useEffect(() => {
        const fetchArchives = async () => {
            setLoading(true);
            setFetchError(null);
            try {
                const response = await api.activityArchives.getAll({ 
                    page: currentPage, 
                    per_page: LOGS_PER_PAGE, 
                    date: dateFilter || undefined
                });
                setLogs(response.logs);
                setTotalPages(response.last_page || 1);
                setTotalResults(response.total || 0);
            } catch (error) {
                if (error instanceof Error && error.message.includes('Failed to fetch')) {
                    setFetchError('فشل جلب البيانات. يرجى التأكد من اتصالك بالإنترنت.');
                } else {
                    setFetchError('حدث خطأ غير متوقع.');
                    console.error("Failed to fetch activity archives:", error);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchArchives();
    }, [currentPage, dateFilter, refreshTrigger]);

    const handleDateFilterChange = (newDate: string) => {
        setDateFilter(newDate);
        setCurrentPage(1); // Reset to first page when filter changes
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };
    
    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <button 
                    onClick={onBack} 
                    className="p-2 font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary" 
                    aria-label="العودة للوحة التحكم"
                >
                    <ArrowBackIcon className="h-5 w-5" />
                </button>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">أرشيف الأحداث</h1>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => handleDateFilterChange(e.target.value)}
                            className="px-3 py-2 bg-white dark:bg-gray-700 text-black dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        />
                    </div>
                </div>

                <div className="p-6 flex-grow">
                    {loading ? (
                        <div className="flex justify-center items-center py-20"><CenteredLoadingSpinner /></div>
                    ) : fetchError ? (
                        <div className="text-center py-20 text-red-500 dark:text-red-400"><p>{fetchError}</p></div>
                    ) : logs.length > 0 ? (
                        <div className="space-y-4">
                            {logs.map(log => (
                                <div key={log.id} className="flex items-start space-x-4 rtl:space-x-reverse p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                    <ActionIcon action={log.actionType} />
                                    <div className="flex-grow min-w-0">
                                        <p className="text-sm text-gray-800 dark:text-gray-200 break-words">{formatLogText(log.description)}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            بواسطة {log.userName} &bull; {new Date(log.timestamp).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                            <p>{dateFilter ? 'لا يوجد أرشيف لعرضه للتاريخ المحدد.' : 'لا يوجد سجلات في الأرشيف.'}</p>
                        </div>
                    )}
                </div>
                
                {!loading && totalPages > 1 && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex flex-col sm:flex-row justify-between items-center flex-wrap gap-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                عرض {logs.length > 0 ? ((currentPage - 1) * LOGS_PER_PAGE) + 1 : 0} - {((currentPage - 1) * LOGS_PER_PAGE) + logs.length} من أصل {totalResults} سجلات
                            </p>
                            <Pagination 
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityArchivesPage;
