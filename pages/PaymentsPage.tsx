import React, { useEffect, useState, useCallback } from 'react';
import { User, Payment, Patient } from '../types';
import { api, ApiError } from '../services/api';
import { PlusIcon, PencilIcon, TrashIcon, XIcon, SearchIcon } from '../components/Icons';
import { CenteredLoadingSpinner } from '../components/LoadingSpinner';

interface PaymentsPageProps {
    user: User;
    refreshTrigger: number;
}

// ===================================================================
// Pagination Component
// ===================================================================
const Pagination: React.FC<{
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    return (
        <nav className="flex items-center justify-center mt-8" aria-label="Pagination">
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
    const [patientSearch, setPatientSearch] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    const filteredPatients = patientSearch
        ? patients.filter(p => p.name.toLowerCase().includes(patientSearch.toLowerCase()) || p.code.includes(patientSearch))
        : patients;

    const handlePatientSelect = (patient: Patient) => {
        setFormData(prev => ({ ...prev, patientId: patient.id }));
        setPatientSearch(patient.name);
        setIsDropdownOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);


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
        try {
            await onSave({
                patientId: formData.patientId,
                amount: parseFloat(formData.amount),
                date: formData.date
            });
        } catch (error) {
            // onSave will throw, so we catch it here, alert, and allow user to retry.
            alert(`فشل الحفظ: ${error instanceof Error ? error.message : "خطأ غير معروف"}`);
        } finally {
            setIsSaving(false);
        }
    };

    const inputStyle = "w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black dark:text-white";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md" role="dialog" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">إضافة دفعة جديدة</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div ref={dropdownRef} className="relative">
                            <label htmlFor="patientSearch" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المريض</label>
                            <div className="relative">
                                <SearchIcon className="absolute top-1/2 right-3 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    id="patientSearch"
                                    type="text"
                                    value={patientSearch}
                                    onChange={(e) => {
                                        setPatientSearch(e.target.value);
                                        setFormData(prev => ({...prev, patientId: ''})); // Clear patientId if user is typing
                                        setIsDropdownOpen(true);
                                    }}
                                    onFocus={() => setIsDropdownOpen(true)}
                                    placeholder="ابحث عن مريض بالاسم أو الكود..."
                                    required={!formData.patientId}
                                    autoComplete="off"
                                    className={inputStyle + " pr-10"}
                                />
                            </div>
                            
                            {isDropdownOpen && (
                                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                    {filteredPatients.length > 0 ? (
                                        filteredPatients.map(p => (
                                            <div
                                                key={p.id}
                                                onClick={() => handlePatientSelect(p)}
                                                className="px-4 py-2 cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-900/40 text-gray-900 dark:text-gray-200"
                                            >
                                                {p.name}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="px-4 py-2 text-gray-500">لا يوجد مرضى مطابقون</div>
                                    )}
                                </div>
                            )}
                        </div>
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
        try {
            await onSave({
                ...payment,
                ...formData,
                amount: parseFloat(formData.amount),
            });
        } catch(error) {
            alert(`فشل التعديل: ${error instanceof Error ? error.message : "خطأ غير معروف"}`);
        } finally {
            setIsSaving(false);
        }
    };

    const inputStyle = "w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black dark:text-white";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md" role="dialog" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">تعديل الدفعة</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المريض</label>
                            <select id="patientId" name="patientId" value={formData.patientId} onChange={handleChange} required className={`${inputStyle} bg-gray-100 dark:bg-gray-600`} disabled>
                                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
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


const PaymentsPage: React.FC<PaymentsPageProps> = ({ user, refreshTrigger }) => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isAddingPayment, setIsAddingPayment] = useState(false);
    const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);

    const PAYMENTS_PER_PAGE = 8;

    const refreshData = useCallback(async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const patientsPromise = api.patients.getAll({ page: 1, per_page: 9999 });
            const paymentsPromise = api.payments.getAll({ page: currentPage, per_page: PAYMENTS_PER_PAGE, search: searchTerm });

            const [patsResponse, paysResponse] = await Promise.all([patientsPromise, paymentsPromise]);

            setPatients(patsResponse.patients);
            setPayments(paysResponse.payments);
            setTotalResults(paysResponse.total);
            setTotalPages(paysResponse.last_page);

        } catch (error) {
            if (error instanceof Error && error.message.includes('Failed to fetch')) {
                setFetchError('فشل جلب البيانات الرجاء التأكد من اتصالك بالانترنت واعادة تحميل البيانات');
            } else {
                setFetchError('حدث خطأ غير متوقع.');
                console.error("Failed to fetch data:", error);
            }
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchTerm]);

    useEffect(() => {
        const timer = setTimeout(() => {
            refreshData();
        }, 300); // Debounce search
        return () => clearTimeout(timer);
    }, [refreshData, refreshTrigger]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };
    
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleCreatePayment = async (newPaymentData: Omit<Payment, 'id'>) => {
        await api.payments.create(newPaymentData);
        setIsAddingPayment(false);
        await refreshData();
    };

    const handleUpdatePayment = async (updatedPayment: Payment) => {
        await api.payments.update(updatedPayment.id, updatedPayment);
        setEditingPayment(null);
        await refreshData();
    };

    const confirmDeletePayment = async () => {
        if (paymentToDelete) {
            setIsDeleting(true);
            try {
                await api.payments.delete(paymentToDelete.id);
                setPaymentToDelete(null);
                if (payments.length === 1 && currentPage > 1) {
                    setCurrentPage(prev => prev - 1);
                } else {
                    await refreshData();
                }
            } catch (error) {
                console.error("Failed to delete payment:", error);
                alert(`فشل حذف الدفعة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const getPatientName = (id: string) => patients.find(p => p.id === id)?.name || 'مريض غير معروف';

    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div className="relative w-full max-w-sm">
                   <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                       <SearchIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                   </div>
                   <input
                       type="text"
                       value={searchTerm}
                       onChange={handleSearchChange}
                       placeholder="ابحث عن طريق اسم المريض..."
                       className="w-full pl-3 pr-10 py-2 bg-white dark:bg-gray-700 text-black dark:text-white border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                   />
                </div>
                <button onClick={() => setIsAddingPayment(true)} className="hidden lg:flex items-center bg-primary text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700 transition-colors">
                    <PlusIcon className="h-5 w-5 ml-2" />
                    إضافة دفعة
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md min-h-[400px]">
                {loading ? <CenteredLoadingSpinner /> : fetchError ? (
                     <div className="text-center py-16 text-red-500 dark:text-red-400"><p>{fetchError}</p></div>
                ) : (
                    payments.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {payments.map(pay => (
                                    <div key={pay.id} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col justify-between transition-shadow hover:shadow-lg">
                                        <div>
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{getPatientName(pay.patientId)}</h3>
                                                <p className="text-xl font-bold text-green-600 dark:text-green-400">SYP {pay.amount.toFixed(2)}</p>
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{new Date(pay.date).toLocaleDateString()}</p>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 flex items-center justify-end space-x-2">
                                            <button onClick={() => setEditingPayment(pay)} className="p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400" title="تعديل">
                                                <PencilIcon className="h-5 w-5" />
                                            </button>
                                            <button onClick={() => setPaymentToDelete(pay)} className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400" title="حذف">
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 flex justify-between items-center flex-wrap gap-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    عرض {payments.length} من أصل {totalResults} مدفوعات
                                </p>
                                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                            </div>
                        </>
                    ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-8">لم يتم العثور على مدفوعات.</p>
                    )
                )}
            </div>
            
            <button 
                onClick={() => setIsAddingPayment(true)} 
                className="lg:hidden fixed bottom-20 right-4 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary-700 transition-colors z-20"
                aria-label="إضافة دفعة"
            >
                <PlusIcon className="h-6 w-6" />
            </button>
            
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
                    message={`هل أنت متأكد من حذف دفعة بقيمة SYP ${paymentToDelete.amount.toFixed(2)} للمريض ${getPatientName(paymentToDelete.patientId)}؟`}
                    onConfirm={confirmDeletePayment}
                    onCancel={() => !isDeleting && setPaymentToDelete(null)}
                    isDeleting={isDeleting}
                />
            )}
        </div>
    );
};

export default PaymentsPage;