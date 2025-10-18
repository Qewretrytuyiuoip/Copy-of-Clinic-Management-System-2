
import React, { useEffect, useState, useCallback } from 'react';
import { Treatment } from '../types';
import { api } from '../services/api';
import { PlusIcon, PencilIcon, TrashIcon, XIcon, SearchIcon } from '../components/Icons';
import { CenteredLoadingSpinner } from '../components/LoadingSpinner';

// ===================================================================
// ConfirmDeleteModal Component
// ===================================================================
interface ConfirmDeleteModalProps {
    onConfirm: () => void;
    onCancel: () => void;
    title: string;
    message: string;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ onConfirm, onCancel, title, message }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 transition-opacity" onClick={onCancel}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm transform transition-all" role="dialog" onClick={e => e.stopPropagation()}>
            <div className="p-6">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                        <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mt-4">{title}</h3>
                    <p className="text-sm text-gray-500 mt-2 px-4">{message}</p>
                </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-center gap-4">
                <button type="button" onClick={onConfirm} className="w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                    نعم، قم بالحذف
                </button>
                <button type="button" onClick={onCancel} className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                    إلغاء
                </button>
            </div>
        </div>
    </div>
);

// ===================================================================
// TreatmentFormModal (for Add and Edit)
// ===================================================================
interface TreatmentFormModalProps {
    treatment?: Treatment;
    onSave: (data: Omit<Treatment, 'id'> | Treatment) => Promise<void>;
    onClose: () => void;
}

const TreatmentFormModal: React.FC<TreatmentFormModalProps> = ({ treatment, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: treatment?.name || '',
        price: treatment?.price.toString() || '',
        notes: treatment?.notes || '',
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const dataToSave = {
            name: formData.name,
            price: parseFloat(formData.price) || 0,
            notes: formData.notes,
        };
        if (treatment) {
            await onSave({ ...treatment, ...dataToSave });
        } else {
            await onSave(dataToSave);
        }
        setIsSaving(false);
    };
    
    const isEditMode = !!treatment;
    const inputStyle = "w-full px-3 py-2 bg-white border border-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md" role="dialog" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800">{isEditMode ? 'تعديل العلاج' : 'إضافة علاج جديد'}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">اسم العلاج</label>
                            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className={inputStyle} />
                        </div>
                        <div>
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">السعر</label>
                            <input type="number" step="0.01" id="price" name="price" value={formData.price} onChange={handleChange} required className={inputStyle} placeholder="0.00" />
                        </div>
                        <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                            <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} className={inputStyle} placeholder="أضف ملاحظات عامة حول العلاج..."></textarea>
                        </div>
                    </div>
                    <div className="flex justify-end items-center p-4 bg-gray-50 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">إلغاء</button>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 bg-primary border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-700 disabled:bg-primary-300 mr-2">{isSaving ? 'جاري الحفظ...' : 'حفظ'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// ===================================================================
// Main TreatmentsSettingsPage Component
// ===================================================================
const TreatmentsSettingsPage: React.FC = () => {
    const [treatments, setTreatments] = useState<Treatment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
    const [deletingTreatment, setDeletingTreatment] = useState<Treatment | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchTreatments = useCallback(async () => {
        setLoading(true);
        const data = await api.treatments.getAll();
        setTreatments(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchTreatments();
    }, [fetchTreatments]);

    const handleCreate = async (data: Omit<Treatment, 'id'>) => {
        await api.treatments.create(data);
        setIsAdding(false);
        await fetchTreatments();
    };
    
    const handleUpdate = async (data: Treatment) => {
        await api.treatments.update(data.id, data);
        setEditingTreatment(null);
        await fetchTreatments();
    };

    const confirmDelete = async () => {
        if (deletingTreatment) {
            await api.treatments.delete(deletingTreatment.id);
            setDeletingTreatment(null);
            await fetchTreatments();
        }
    };
    
    const filteredTreatments = treatments.filter(treatment =>
        treatment.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">إعدادات العلاج</h1>
                 <div className="relative w-full max-w-sm">
                   <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                       <SearchIcon className="w-5 h-5 text-gray-400" />
                   </div>
                   <input
                       type="text"
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       placeholder="ابحث عن علاج..."
                       className="w-full pl-3 pr-10 py-2 bg-white border border-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black"
                   />
                </div>
                <button onClick={() => setIsAdding(true)} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700 transition-colors">
                    <PlusIcon className="h-5 w-5 ml-2" />
                    إضافة علاج
                </button>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md min-h-[200px]">
                {loading ? <CenteredLoadingSpinner /> : (
                     filteredTreatments.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredTreatments.map(treatment => (
                                <div key={treatment.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col justify-between transition-shadow hover:shadow-lg">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800">{treatment.name}</h3>
                                        <p className="text-green-600 font-semibold text-lg mt-1">${treatment.price.toFixed(2)}</p>
                                        {treatment.notes && <p className="text-sm text-gray-500 mt-2 border-t pt-2">{treatment.notes}</p>}
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-end space-x-2">
                                        <button onClick={() => setEditingTreatment(treatment)} className="flex items-center text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-100 text-sm">
                                            <PencilIcon className="h-4 w-4" />
                                            <span className="mr-1">تعديل</span>
                                        </button>
                                        <button onClick={() => setDeletingTreatment(treatment)} className="flex items-center text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100 text-sm">
                                            <TrashIcon className="h-4 w-4" />
                                            <span className="mr-1">حذف</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <p className="text-center text-gray-500 py-8">لم يتم العثور على علاجات. قم بإضافة علاج جديد.</p>
                    )
                )}
            </div>
            {isAdding && <TreatmentFormModal onClose={() => setIsAdding(false)} onSave={handleCreate} />}
            {editingTreatment && <TreatmentFormModal treatment={editingTreatment} onClose={() => setEditingTreatment(null)} onSave={(data) => handleUpdate(data as Treatment)} />}
            {deletingTreatment && (
                <ConfirmDeleteModal
                    title="حذف العلاج"
                    message={`هل أنت متأكد من رغبتك في حذف ${deletingTreatment.name}؟ لا يمكن التراجع عن هذا الإجراء.`}
                    onConfirm={confirmDelete}
                    onCancel={() => setDeletingTreatment(null)}
                />
            )}
        </div>
    );
};

export default TreatmentsSettingsPage;