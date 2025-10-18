import React, { useEffect, useState, useCallback } from 'react';
import { User, DoctorAvailability, DaySchedule } from '../types';
import { api } from '../services/api';
import { DAY_NAMES } from '../constants';
import { CenteredLoadingSpinner } from '../components/LoadingSpinner';

interface DoctorSettingsPageProps {
    user: User;
}

const DoctorSettingsPage: React.FC<DoctorSettingsPageProps> = ({ user }) => {
    const [schedule, setSchedule] = useState<DaySchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState('');

    const createFullSchedule = useCallback((data?: DoctorAvailability | null): DaySchedule[] => {
        const baseSchedule: DaySchedule[] = DAY_NAMES.map((_, index) => ({
            day: index,
            isWorkDay: false,
            startTime: '09:00',
            endTime: '17:00',
        }));

        if (data?.schedule) {
            data.schedule.forEach(daySetting => {
                const index = baseSchedule.findIndex(d => d.day === daySetting.day);
                if (index !== -1) {
                    baseSchedule[index] = { ...daySetting };
                }
            });
        }
        return baseSchedule;
    }, []);

    const fetchAvailability = useCallback(async () => {
        setLoading(true);
        const data = await api.availability.get(user.id);
        setSchedule(createFullSchedule(data));
        setLoading(false);
    }, [user.id, createFullSchedule]);

    useEffect(() => {
        fetchAvailability();
    }, [fetchAvailability]);

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
            await api.availability.set(user.id, schedule);
            setFeedback('تم تحديث التواجد بنجاح!');
            setTimeout(() => setFeedback(''), 3000);
        } catch (error) {
            setFeedback('فشل تحديث التواجد.');
        } finally {
            setSaving(false);
        }
    };

    const inputStyle = "mt-1 block w-full px-3 py-2 bg-white border border-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm text-black";

    return (
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">تواجدي</h1>
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-md max-w-3xl mx-auto min-h-[400px]">
                {loading ? <CenteredLoadingSpinner /> : (
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            {schedule.map((daySchedule, index) => (
                                <div key={index} className="p-4 border border-gray-200 rounded-lg transition-all duration-300 has-[:checked]:bg-primary-50 has-[:checked]:border-primary">
                                    <div className="flex justify-between items-center">
                                        <label className="flex items-center space-x-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={daySchedule.isWorkDay}
                                                onChange={() => handleDayToggle(index)}
                                                className="h-5 w-5 rounded text-primary focus:ring-primary-500 border-gray-300"
                                            />
                                            <span className="font-semibold text-lg text-gray-800">{DAY_NAMES[index]}</span>
                                        </label>
                                    </div>
                                    {daySchedule.isWorkDay && (
                                        <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor={`startTime-${index}`} className="block text-sm font-medium text-gray-700">وقت البدء</label>
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
                                                <label htmlFor={`endTime-${index}`} className="block text-sm font-medium text-gray-700">وقت الانتهاء</label>
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
                        {feedback && <p className={`mt-4 text-center text-sm ${feedback.includes('فشل') ? 'text-red-600' : 'text-green-600'}`}>{feedback}</p>}
                    </form>
                )}
            </div>
        </div>
    );
};

export default DoctorSettingsPage;