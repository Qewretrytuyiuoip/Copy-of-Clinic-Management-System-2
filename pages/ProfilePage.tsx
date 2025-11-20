
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, DaySchedule, Treatment } from '../types';
import { useAuth } from '../hooks/useAuth';
import { ROLE_NAMES, DAY_NAMES } from '../constants';
import { LogoutIcon, PencilIcon, UserCircleIcon, XIcon, PlusIcon, TrashIcon, SearchIcon, ArrowDownOnSquareIcon } from '../components/Icons';
import { api, ApiError } from '../services/api';
import { CenteredLoadingSpinner } from '../components/LoadingSpinner';
import LoadingSpinner from '../components/LoadingSpinner';


// ===================================================================
// DoctorAvailabilitySettings Component
// ===================================================================
interface DoctorAvailabilitySettingsProps {
    user: User;
    refreshTrigger: number;
}

const DoctorAvailabilitySettings: React.FC<DoctorAvailabilitySettingsProps> = ({ user, refreshTrigger }) => {
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
                // FIX: Add doctorId to the fallback object to match the DaySchedule type, which requires it.
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
        <div className="mt-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text