import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Patient, Session, Payment } from '../types';
import { api } from '../services/api';
import { CenteredLoadingSpinner } from '../components/LoadingSpinner';
import { CurrencyDollarIcon, BeakerIcon, ListBulletIcon } from '../components/Icons';

const isDateInRange = (dateStr: string, startDate?: string, endDate?: string) => {
    if (!startDate && !endDate) return true;
    const date = new Date(dateStr);
    if (startDate && date < new Date(startDate)) return false;
    if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include the whole end day
        if (date > end) return false;
    }
    return true;
};

const StatCard: React.FC<{ title: string; value: string; icon: React.ElementType; color: string; }> = ({ title, value, icon: Icon, color }) => (
    <div className="p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-xl shadow-md flex items-center space-x-4 rtl:space-x-reverse">
        <div className="flex-shrink-0">
            <div className={`p-3 bg-${color}-100 dark:bg-${color}-900/40 rounded-full`}>
                <Icon className={`h-6 w-6 text-${color}-600 dark:text-${color}-300`} />
            </div>
        </div>
        <div>
            <div className="text-lg sm:text-xl font-medium text-black dark:text-white">{value}</div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        </div>
    </div>
);


const StatisticsPage: React.FC<{ refreshTrigger: number }> = ({ refreshTrigger }) => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    const fetchData = useCallback(async () => {
        setLoading(true);
        setFetchError(null);
        try {
            // FIX: api.payments.getAll requires arguments and returns a paginated object.
            const [patsResponse, sess, paysResponse] = await Promise.all([
                // FIX: api.patients.getAll requires arguments.
                api.patients.getAll({ page: 1, per_page: 9999 }),
                api.sessions.getAll(),
                api.payments.getAll({ page: 1, per_page: 9999 }),
            ]);
            // FIX: The API returns a pagination object. We need the 'patients' array from it.
            setPatients(patsResponse.patients);
            setSessions(sess);
            // FIX: The array of payments is in the 'payments' property of the response.
            setPayments(paysResponse.payments);
        } catch (error) {
            if (error instanceof Error && error.message.includes('Failed to fetch')) {
                setFetchError('فشل جلب البيانات الرجاء التأكد من اتصالك بالانترنت واعادة تحميل البيانات');
            } else {
                setFetchError('حدث خطأ غير متوقع.');
                console.error("Failed to load statistics data:", error);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData, refreshTrigger]);

    const calculatedStats = useMemo(() => {
        let overallCosts = 0;
        let overallRevenue = 0;
        
        const patientStats = patients.map(patient => {
            const patientSessions = sessions.filter(s => s.patientId === patient.id);
            const patientPayments = payments.filter(p => p.patientId === patient.id);

            // FIX: The filter operation must happen inside the flatMap to have access to the session ('s')
            const filteredTreatments = patientSessions.flatMap(s => 
                s.treatments.filter(t => isDateInRange(t.treatmentDate || s.date, startDate, endDate))
            );
            
            const filteredPayments = patientPayments
                .filter(p => isDateInRange(p.date, startDate, endDate));

            const totalCosts = filteredTreatments.reduce((sum, t) => sum + t.sessionPrice + (t.additionalCosts || 0), 0);
            const totalPayments = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
            const balance = totalCosts - totalPayments;
            
            overallCosts += totalCosts;
            overallRevenue += totalPayments;

            return {
                patientId: patient.id,
                patientName: patient.name,
                totalCosts,
                totalPayments,
                balance,
            };
        });

        return {
            overallCosts,
            overallRevenue,
            overallBalance: overallCosts - overallRevenue,
            patientStats,
        };
    }, [patients, sessions, payments, startDate, endDate]);

    return (
        <div>
             <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-md flex flex-wrap items-center gap-4">
                <div className="flex-grow">
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">من تاريخ</label>
                    <input
                        type="date"
                        id="startDate"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="mt-1 w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black dark:text-white"
                    />
                </div>
                <div className="flex-grow">
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">إلى تاريخ</label>
                    <input
                        type="date"
                        id="endDate"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="mt-1 w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black dark:text-white"
                    />
                </div>
            </div>
            
            {loading ? <CenteredLoadingSpinner /> : fetchError ? (
                <div className="text-center py-16 text-red-500 dark:text-red-400 bg-white dark:bg-slate-800 rounded-xl shadow-md"><p>{fetchError}</p></div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
                        <StatCard title="إجمالي تكاليف العلاج" value={`SYP ${calculatedStats.overallCosts.toFixed(2)}`} icon={BeakerIcon} color="red" />
                        <StatCard title="إجمالي الإيرادات" value={`SYP ${calculatedStats.overallRevenue.toFixed(2)}`} icon={CurrencyDollarIcon} color="green" />
                        <StatCard title="المتبقي" value={`SYP ${calculatedStats.overallBalance.toFixed(2)}`} icon={ListBulletIcon} color={calculatedStats.overallBalance > 0 ? 'yellow' : 'blue'} />
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">ملخص المرضى</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {calculatedStats.patientStats.map(stat => (
                                <div key={stat.patientId} className="border bg-gray-50 dark:bg-gray-800 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                                    <h3 className="font-bold text-lg text-primary">{stat.patientName}</h3>
                                    <div className="mt-3 space-y-2 text-sm">
                                        <div className="flex justify-between items-center text-red-600 dark:text-red-400">
                                            <span>إجمالي التكاليف:</span>
                                            <span className="font-semibold">SYP {stat.totalCosts.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                                            <span>مجموع الدفعات:</span>
                                            <span className="font-semibold">SYP {stat.totalPayments.toFixed(2)}</span>
                                        </div>
                                        <div className={`flex justify-between items-center pt-2 border-t dark:border-gray-600 font-bold ${stat.balance > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                            <span>الرصيد المتبقي:</span>
                                            <span>SYP {stat.balance.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default StatisticsPage;