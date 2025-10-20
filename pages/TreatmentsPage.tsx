

import React, { useEffect, useState, useCallback } from 'react';
import { Treatment } from '../types';
import { api } from '../services/api';
import { PlusIcon } from '../components/Icons';

const TreatmentsPage: React.FC = () => {
    const [treatments, setTreatments] = useState<Treatment[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTreatments = useCallback(async () => {
        setLoading(true);
        // FIX: The correct API object for treatment settings is `treatmentSettings`, not `treatments`.
        const data = await api.treatmentSettings.getAll();
        setTreatments(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchTreatments();
    }, [fetchTreatments]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">إدارة العلاجات</h1>
                <button className="flex items-center bg-primary text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700 transition-colors">
                    <PlusIcon className="h-5 w-5 ml-2" />
                    إضافة علاج
                </button>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md">
                 <div className="overflow-x-auto">
                    {loading ? <p>جاري تحميل العلاجات...</p> : (
                        <table className="w-full text-right">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="p-3 font-semibold">الاسم</th>
                                    <th className="p-3 font-semibold">السعر</th>
                                    <th className="p-3 font-semibold">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {treatments.map(treatment => (
                                    <tr key={treatment.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3">{treatment.name}</td>
                                        <td className="p-3">${treatment.price.toFixed(2)}</td>
                                        <td className="p-3 space-x-4">
                                            <button className="text-blue-600 hover:underline">تعديل</button>
                                            <button className="text-red-600 hover:underline">حذف</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TreatmentsPage;