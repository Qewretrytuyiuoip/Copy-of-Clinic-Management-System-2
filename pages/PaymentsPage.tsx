import React, { useEffect, useState, useCallback } from 'react';
import { User, Payment, Patient } from '../types';
import { api } from '../services/api';
import { PlusIcon, PencilIcon, TrashIcon, XIcon, SearchIcon } from '../components/Icons';
import { CenteredLoadingSpinner } from '../components/LoadingSpinner';

interface PaymentsPageProps {
    user: User;
}

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
// AddPaymentModal Component
// ===================================================================
interface AddPaymentModalProps {
    onSave: (newPayment: Omit<Payment, 'id'>) => Promise<void>;
    onClose: () => void;
    patients: Patient[];
}

const AddPaymentModal: React.FC<AddPaymentModalProps> = ({ onSave, onClose, patients }) => {
    const [formData, setFormData] = useState({ patientId: '', amount: '', date: new Date().toISOString().split('T')[0] });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.patientId || !formData.amount) {
            alert('يرجى ملء جميع الحقول المطلوبة.');
            return;
        }
        setIsSaving(true);
        await onSave({
            patientId: formData.patientId,
            amount: parseFloat(formData.amount),
            date: formData.date
        });
        setIsSaving(false);
    };

    const inputStyle = "w-full px-3 py-2 bg-white border border-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md" role="dialog" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800">إضافة دفعة جديدة</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 mb-1">المريض</label>
                            <select id="patientId" name="patientId" value={formData.patientId} onChange={handleChange} required className={inputStyle}>
                                <option value="">اختر مريض...</option>
                                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">المبلغ</label>
                            <input type="number" step="0.01" id="amount" name="amount" value={formData.amount} onChange={handleChange} required className={inputStyle} placeholder="0.00" />
                        </div>
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
                            <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required className={inputStyle} />
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
// EditPaymentModal Component
// ===================================================================
interface EditPaymentModalProps {
    payment: Payment;
    onSave: (updatedPayment: Payment) => Promise<void>;
    onClose: () => void;
    patients: Patient[];
}

const EditPaymentModal: React.FC<EditPaymentModalProps> = ({ payment, onSave, onClose, patients }) => {
    const [formData, setFormData] = useState({
        patientId: payment.patientId,
        amount: payment.amount.toString(),
        date: payment.date,
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave({
            ...payment,
            ...formData,
            amount: parseFloat(formData.amount),
        });
        setIsSaving(false);
    };

    const inputStyle = "w-full px-3 py-2 bg-white border border-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md" role="dialog" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800">تعديل الدفعة</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 mb-1">المريض</label>
                            <select id="patientId" name="patientId" value={formData.patientId} onChange={handleChange} required className={`${inputStyle} bg-gray-100`} disabled>
                                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">المبلغ</label>
                            <input type="number" step="0.01" id="amount" name="amount" value={formData.amount} onChange={handleChange} required className={inputStyle} placeholder="0.00" />
                        </div>
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
                            <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required className={inputStyle} />
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


const PaymentsPage: React.FC<PaymentsPageProps> = ({ user }) => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
    const [isAddingPayment, setIsAddingPayment] = useState(false);
    const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [pays, pats] = await Promise.all([
                api.payments.getAll(),
                api.patients.getAll()
            ]);
            setPayments(pays);
            setPatients(pats);
        } catch (error) {
            console.error("Failed to fetch data:", error);
            alert('فشل في تحميل البيانات.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreatePayment = async (newPaymentData: Omit<Payment, 'id'>) => {
        try {
            await api.payments.create(newPaymentData);
            setIsAddingPayment(false);
            await fetchData();
        } catch (error) {
            console.error("Failed to create payment:", error);
            alert(`فشل إضافة الدفعة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
        }
    };

    const handleUpdatePayment = async (updatedPayment: Payment) => {
        try {
            await api.payments.update(updatedPayment.id, updatedPayment);
            setEditingPayment(null);
            await fetchData();
        } catch (error) {
            console.error("Failed to update payment:", error);
            alert(`فشل تعديل الدفعة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
        }
    };

    const confirmDeletePayment = async () => {
        if (paymentToDelete) {
            try {
                await api.payments.delete(paymentToDelete.id);
            } catch (error) {
                console.error("Failed to delete payment:", error);
                alert(`فشل حذف الدفعة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
            } finally {
                setPaymentToDelete(null);
                await fetchData();
            }
        }
    };

    const getPatientName = (id: string) => patients.find(p => p.id === id)?.name || 'مريض غير معروف';

    const filteredPayments = payments.filter(pay =>
        getPatientName(pay.patientId).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">مدفوعات المرضى</h1>
                <div className="relative w-full max-w-sm">
                   <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                       <SearchIcon className="w-5 h-5 text-gray-400" />
                   </div>
                   <input
                       type="text"
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       placeholder="ابحث عن طريق اسم المريض..."
                       className="w-full pl-3 pr-10 py-2 bg-white border border-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black"
                   />
                </div>
                <button onClick={() => setIsAddingPayment(true)} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700 transition-colors">
                    <PlusIcon className="h-5 w-5 ml-2" />
                    إضافة دفعة
                </button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md min-h-[200px]">
                {loading ? <CenteredLoadingSpinner /> : (
                    filteredPayments.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredPayments.map(pay => (
                                <div key={pay.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col justify-between transition-shadow hover:shadow-lg">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-lg font-bold text-gray-800">{getPatientName(pay.patientId)}</h3>
                                            <p className="text-xl font-bold text-green-600">${pay.amount.toFixed(2)}</p>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">{new Date(pay.date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-end space-x-2">
                                        <button onClick={() => setEditingPayment(pay)} className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-100" title="تعديل">
                                            <PencilIcon className="h-5 w-5" />
                                        </button>
                                        <button onClick={() => setPaymentToDelete(pay)} className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100" title="حذف">
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-8">لم يتم العثور على مدفوعات.</p>
                    )
                )}
            </div>
            {isAddingPayment && <AddPaymentModal patients={patients} onSave={handleCreatePayment} onClose={() => setIsAddingPayment(false)} />}
            {editingPayment && (
                <EditPaymentModal 
                    payment={editingPayment}
                    patients={patients}
                    onSave={handleUpdatePayment}
                    onClose={() => setEditingPayment(null)}
                />
            )}
            {paymentToDelete && (
                <ConfirmDeleteModal
                    title="حذف الدفعة"
                    message={`هل أنت متأكد من حذف دفعة بقيمة $${paymentToDelete.amount.toFixed(2)} للمريض ${getPatientName(paymentToDelete.patientId)}؟`}
                    onConfirm={confirmDeletePayment}
                    onCancel={() => setPaymentToDelete(null)}
                />
            )}
        </div>
    );
};

export default PaymentsPage;