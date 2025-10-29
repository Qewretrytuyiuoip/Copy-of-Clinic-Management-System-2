
import React, { useState, useCallback, useEffect } from 'react';
import { Patient, Payment, Session } from '../types';
import { api } from '../services/api';
import { CenteredLoadingSpinner } from '../components/LoadingSpinner';
import { PlusIcon, PencilIcon, TrashIcon, XIcon, ArrowBackIcon, BeakerIcon, CurrencyDollarIcon, ListBulletIcon } from '../components/Icons';


// ===================================================================
// ConfirmDeleteModal Component
// ===================================================================
interface ConfirmDeleteModalProps {
    onConfirm: () => void;
    onCancel: () => void;
    title: string;
    message: string;
    isDeleting?: boolean;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ onConfirm, onCancel, title, message, isDeleting }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 transition-opacity" onClick={onCancel}>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm transform transition-all" role="dialog" onClick={e => e.stopPropagation()}>
            <div className="p-6">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30">
                        <TrashIcon className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-4">{title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 px-4">{message}</p>
                </div>
            </div>
            <div className="bg-gray-50 dark:bg-slate-700/50 px-6 py-4 rounded-b-2xl flex justify-center gap-4">
                <button type="button" onClick={onConfirm} disabled={isDeleting} className="w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-400 disabled:cursor-not-allowed">
                    {isDeleting ? 'جاري الحذف...' : 'نعم، قم بالحذف'}
                </button>
                <button type="button" onClick={onCancel} disabled={isDeleting} className="w-full rounded-md border border-gray-300 dark:border-gray-500 shadow-sm px-4 py-2 bg-white dark:bg-gray-600 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed">
                    إلغاء
                </button>
            </div>
        </div>
    </div>
);

// ===================================================================
// AddPaymentModalForPatient Component
// ===================================================================
interface AddPaymentModalForPatientProps {
    onSave: (newPayment: Omit<Payment, 'id'>) => Promise<void>;
    onClose: () => void;
    patient: Patient;
}

const AddPaymentModalForPatient: React.FC<AddPaymentModalForPatientProps> = ({ onSave, onClose, patient }) => {
    const [formData, setFormData] = useState({ amount: '', date: new Date().toISOString().split('T')[0] });
    const [isSaving, setIsSaving] = useState(false);
    const inputStyle = "w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black dark:text-white";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.amount) {
            alert('يرجى إدخال المبلغ.');
            return;
        }
        setIsSaving(true);
        await onSave({
            patientId: patient.id,
            amount: parseFloat(formData.amount),
            date: formData.date
        });
        setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md" role="dialog" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">إضافة دفعة لـ {patient.name}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المبلغ</label>
                            <input type="number" step="0.01" id="amount" name="amount" value={formData.amount} onChange={handleChange} required className={inputStyle} placeholder="0.00" />
                        </div>
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">التاريخ</label>
                            <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required className={inputStyle} />
                        </div>
                    </div>
                    <div className="flex justify-end items-center p-4 bg-gray-50 dark:bg-slate-700/50 border-t dark:border-gray-700">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500">إلغاء</button>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 bg-primary border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-700 disabled:bg-primary-300 mr-2">{isSaving ? 'جاري الحفظ...' : 'حفظ'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ===================================================================
// EditPaymentModalForPatient Component
// ===================================================================
interface EditPaymentModalForPatientProps {
    payment: Payment;
    onSave: (updatedPayment: Payment) => Promise<void>;
    onClose: () => void;
    patientName: string;
}

const EditPaymentModalForPatient: React.FC<EditPaymentModalForPatientProps> = ({ payment, onSave, onClose, patientName }) => {
    const [formData, setFormData] = useState({ amount: payment.amount.toString(), date: payment.date });
    const [isSaving, setIsSaving] = useState(false);
    const inputStyle = "w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black dark:text-white";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave({ ...payment, amount: parseFloat(formData.amount), date: formData.date });
        setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md" role="dialog" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">تعديل دفعة لـ {patientName}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المبلغ</label>
                            <input type="number" step="0.01" id="amount" name="amount" value={formData.amount} onChange={handleChange} required className={inputStyle} />
                        </div>
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">التاريخ</label>
                            <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required className={inputStyle} />
                        </div>
                    </div>
                    <div className="flex justify-end items-center p-4 bg-gray-50 dark:bg-slate-700/50 border-t dark:border-gray-700">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500">إلغاء</button>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 bg-primary border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-700 disabled:bg-primary-300 mr-2">{isSaving ? 'جاري الحفظ...' : 'حفظ'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// ===================================================================
// PatientFinancialPage Component
// ===================================================================
interface PatientFinancialPageProps {
    patient: Patient;
    onBack: () => void;
    refreshTrigger: number;
}

const PatientFinancialPage: React.FC<PatientFinancialPageProps> = ({ patient, onBack, refreshTrigger }) => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [stats, setStats] = useState({ totalPayments: 0, totalCost: 0, balance: 0 });
    const [loading, setLoading] = useState(true);
    const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isAddingPayment, setIsAddingPayment] = useState(false);
    const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [allPaymentsResponse, allSessions] = await Promise.all([
                api.payments.getAll({ page: 1, per_page: 9999 }),
                api.sessions.getAll()
            ]);

            const allPayments = allPaymentsResponse.payments;
            const patientPayments = allPayments.filter(p => p.patientId === patient.id);
            const patientSessions = allSessions.filter(s => s.patientId === patient.id);
            setPayments(patientPayments.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

            const totalPayments = patientPayments.reduce((sum, p) => sum + p.amount, 0);
            
            const totalCost = patientSessions.reduce((sessionSum, s) => {
                const treatmentsCost = s.treatments.reduce((treatmentSum, t) => {
                    return treatmentSum + t.sessionPrice + (t.additionalCosts || 0);
                }, 0);
                return sessionSum + treatmentsCost;
            }, 0);

            setStats({
                totalPayments,
                totalCost,
                balance: totalCost - totalPayments
            });

        } catch (error) {
            console.error("Failed to fetch payment data:", error);
            alert("فشل في تحميل البيانات المالية للمريض.");
        } finally {
            setLoading(false);
        }
    }, [patient.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData, refreshTrigger]);

    const handleCreatePayment = async (newPayment: Omit<Payment, 'id'>) => {
        await api.payments.create(newPayment);
        setIsAddingPayment(false);
        await fetchData();
    };

    const handleUpdatePayment = async (updatedPayment: Payment) => {
        await api.payments.update(updatedPayment.id, updatedPayment);
        setEditingPayment(null);
        await fetchData();
    };

    const confirmDeletePayment = async () => {
        if (paymentToDelete) {
            setIsDeleting(true);
            try {
                await api.payments.delete(paymentToDelete.id);
                setPaymentToDelete(null);
                await fetchData();
            } catch (error) {
                console.error("Failed to delete payment:", error);
                alert(`فشل حذف الدفعة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
            } finally {
                setIsDeleting(false);
            }
        }
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
    
    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="p-2 font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary" aria-label="العودة">
                    <ArrowBackIcon className="h-5 w-5" />
                </button>
                <div>
                    <p className="text-gray-500 dark:text-gray-400">{patient.name}</p>
                </div>
            </div>
            
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
                <StatCard title="إجمالي تكاليف العلاج" value={`SYP ${stats.totalCost.toFixed(2)}`} icon={BeakerIcon} color="red" />
                <StatCard title="إجمالي الإيرادات" value={`SYP ${stats.totalPayments.toFixed(2)}`} icon={CurrencyDollarIcon} color="green" />
                <StatCard title="المتبقي" value={`SYP ${stats.balance.toFixed(2)}`} icon={ListBulletIcon} color={stats.balance > 0 ? 'yellow' : 'blue'} />
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">سجل الدفعات</h2>
                    <button onClick={() => setIsAddingPayment(true)} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700 transition-colors">
                        <PlusIcon className="h-5 w-5 ml-2" />
                        إضافة دفعة
                    </button>
                </div>

                {loading ? <CenteredLoadingSpinner /> : payments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm text-gray-800 dark:text-gray-200">
                            <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-100 dark:bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3">التاريخ</th>
                                    <th scope="col" className="px-6 py-3">المبلغ</th>
                                    <th scope="col" className="px-6 py-3">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map(pay => (
                                    <tr key={pay.id} className="bg-white dark:bg-slate-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                        <td className="px-6 py-4 font-medium">{new Date(pay.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 font-bold text-green-600 dark:text-green-400">SYP {pay.amount.toFixed(2)}</td>
                                        <td className="px-6 py-4 flex justify-end items-center gap-2">
                                            <button onClick={() => setEditingPayment(pay)} className="p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400" title="تعديل"><PencilIcon className="h-5 w-5" /></button>
                                            <button onClick={() => setPaymentToDelete(pay)} className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400" title="حذف"><TrashIcon className="h-5 w-5" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">لا توجد دفعات مسجلة لهذا المريض.</p>
                )}
            </div>

            {isAddingPayment && <AddPaymentModalForPatient patient={patient} onSave={handleCreatePayment} onClose={() => setIsAddingPayment(false)} />}
            {editingPayment && <EditPaymentModalForPatient payment={editingPayment} onSave={handleUpdatePayment} onClose={() => setEditingPayment(null)} patientName={patient.name} />}
            {paymentToDelete && (
                 <ConfirmDeleteModal
                    title="حذف الدفعة"
                    message={`هل أنت متأكد من حذف دفعة بقيمة SYP ${paymentToDelete.amount.toFixed(2)}؟`}
                    onConfirm={confirmDeletePayment}
                    onCancel={() => !isDeleting && setPaymentToDelete(null)}
                    isDeleting={isDeleting}
                />
            )}
        </div>
    );
};

export default PatientFinancialPage;