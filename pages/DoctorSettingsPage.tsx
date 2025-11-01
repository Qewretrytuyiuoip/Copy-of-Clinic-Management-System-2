import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { User, DaySchedule } from '../types';
import { api } from '../services/api';
import { DAY_NAMES } from '../constants';
import { CenteredLoadingSpinner } from '../components/LoadingSpinner';

interface DoctorSettingsPageProps {
    user: User;
    refreshTrigger: number;
}

const DoctorSettingsPage: React.FC<DoctorSettingsPageProps> = ({ user, refreshTrigger }) => {
    const [schedule, setSchedule] = useState<DaySchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [fetchError, setFetchError] = useState<string | null>(null);

    const fetchAvailability = useCallback(async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const data = await api.doctorSchedules.getForDoctor(user.id);
    
            const fullSchedule = DAY_NAMES.map((_, index) => {
                const dayData = data.find(d => d.day === index);
                // FIX: Add doctorId to the fallback object to match the updated DaySchedule type.
                return dayData || {
                    day: index,
                    isWorkDay: false,
                    startTime: '09:00',
                    endTime: '17:00',
                    doctorId: user.id,
                };
            });
    
            setSchedule(fullSchedule);
        } catch (error) {
            if (error instanceof Error && error.message.includes('Failed to fetch')) {
                setFetchError('فشل جلب البيانات الرجاء التأكد من اتصالك بالانترنت واعادة تحميل البيانات');
            } else {
                setFetchError('حدث خطأ غير متوقع.');
                console.error("Could not fetch schedule", error);
            }
        } finally {
            setLoading(false);
        }
    }, [user.id]);

    useEffect(() => {
        fetchAvailability();
    }, [fetchAvailability, refreshTrigger]);

    const handleDayToggle = (dayIndex: number) => {
        setSchedule(prev => prev.map((day, index) =>
            index === dayIndex ? { ...day, isWorkDay: !day.isWorkDay } : day
        ));
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>, dayIndex: number) => {
        const { name, value } = e.target;
        setSchedule(prev => prev.map((day, index) =>
            index === dayIndex ? { ...day, [name]: value } : day
        ));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setFeedback('');
        try {
            await api.doctorSchedules.setForDoctor(user.id, schedule);
            setFeedback('تم تحديث التواجد بنجاح!');
            // Refetch to get new IDs for any created schedules
            await fetchAvailability();
            setTimeout(() => setFeedback(''), 3000);
        } catch (error) {
            console.error("Failed to save schedule:", error);
            setFeedback(`فشل تحديث التواجد: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
        } finally {
            setSaving(false);
        }
    };

    const inputStyle = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm text-black dark:text-white";

    return (
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">تواجدي</h1>
            <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl shadow-md max-w-3xl mx-auto min-h-[400px]">
                {loading ? <CenteredLoadingSpinner /> : fetchError ? (
                    <div className="text-center py-16 text-red-500 dark:text-red-400"><p>{fetchError}</p></div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            {schedule.map((daySchedule, index) => (
                                <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg transition-all duration-300 has-[:checked]:bg-primary-50 has-[:checked]:border-primary-300 dark:has-[:checked]:bg-primary-900/20 dark:has-[:checked]:border-primary-700">
                                    <div className="flex justify-between items-center">
                                        <label className="flex items-center space-x-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={daySchedule.isWorkDay}
                                                onChange={() => handleDayToggle(index)}
                                                className="h-5 w-5 rounded text-primary focus:ring-primary-500 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 dark:focus:ring-offset-gray-800"
                                            />
                                            <span className="font-semibold text-lg text-gray-800 dark:text-gray-100">{DAY_NAMES[index]}</span>
                                        </label>
                                    </div>
                                    {daySchedule.isWorkDay && (
                                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor={`startTime-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">وقت البدء</label>
                                                <input
                                                    type="time"
                                                    id={`startTime-${index}`}
                                                    name="startTime"
                                                    value={daySchedule.startTime}
                                                    onChange={(e) => handleTimeChange(e, index)}
                                                    className={inputStyle}
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor={`endTime-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">وقت الانتهاء</label>
                                                <input
                                                    type="time"
                                                    id={`endTime-${index}`}
                                                    name="endTime"
                                                    value={daySchedule.endTime}
                                                    onChange={(e) => handleTimeChange(e, index)}
                                                    className={inputStyle}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-8">
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-primary text-white px-4 py-3 rounded-lg shadow-md hover:bg-primary-700 transition-colors disabled:bg-primary-300 font-semibold text-lg"
                            >
                                {saving ? 'جاري الحفظ...' : 'حفظ التواجد'}
                            </button>
                        </div>
                        {feedback && <p className={`mt-4 text-center text-sm ${feedback.includes('فشل') ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{feedback}</p>}
                    </form>
                )}
            </div>
        </div>
    );
};

export default DoctorSettingsPage;