
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Patient, UserRole, Session, Gender } from '../types';
import { api } from '../services/api';
import { PlusIcon, PencilIcon, TrashIcon, XIcon, BeakerIcon, EyeIcon, CurrencyDollarIcon, SearchIcon, PhotographIcon, ListBulletIcon, DocumentTextIcon, CheckIcon, ChevronDownIcon } from '../components/Icons';
import LoadingSpinner, { CenteredLoadingSpinner } from '../components/LoadingSpinner';
import { useAppSettings } from '../hooks/useAppSettings';


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
// AddPatientModal Component
// ===================================================================
interface AddPatientModalProps {
    onSave: (newPatient: Omit<Patient, 'id' | 'code'>) => Promise<void>;
    onClose: () => void;
    doctors: User[];
    user: User;
}

const AddPatientModal: React.FC<AddPatientModalProps> = ({ onSave, onClose, doctors, user }) => {
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        phone: '',
        notes: '',
        gender: Gender.Male,
        isSmoker: false,
        isPregnant: false,
        drugAllergy: '',
        chronicDiseases: '',
        doctorIds: user.role === UserRole.Doctor ? [user.id] : [],
        discount: 0,
    });
    const [isSaving, setIsSaving] = useState(false);
    const inputStyle = "w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black dark:text-white";

    const isAdmin = user.role === UserRole.Admin;
    const canEditDoctors = user.role === UserRole.Admin || user.role === UserRole.Secretary || (user.role === UserRole.Doctor && user.is_diagnosis_doctor);
    const isSecretary = user.role === UserRole.Secretary;

    const diagnosisDoctors = useMemo(() => {
        return doctors.filter(doc => doc.is_diagnosis_doctor);
    }, [doctors]);

    const doctorsForSelection = useMemo(() => {
        if (isSecretary) {
            return diagnosisDoctors;
        }
        return doctors;
    }, [doctors, isSecretary, diagnosisDoctors]);


    const handleDoctorIdsChange = (doctorId: string) => {
        setFormData(prev => {
            const currentDoctorIds = prev.doctorIds;
            const newDoctorIds = currentDoctorIds.includes(doctorId)
                ? currentDoctorIds.filter(id => id !== doctorId)
                : [...currentDoctorIds, doctorId];
            return { ...prev, doctorIds: newDoctorIds };
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
             if (name === 'gender' && value === Gender.Male) {
                setFormData(prev => ({ ...prev, isPregnant: false }));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSecretary && diagnosisDoctors.length === 0) {
            alert('لا يوجد طبيب تشخيص. يرجى الطلب من المدير اضافة طبيب تشخيص.');
            return;
        }
        if (formData.doctorIds.length === 0) {
            alert('يرجى اختيار طبيب واحد على الأقل.');
            return;
        }
        setIsSaving(true);
        const newPatientData = {
            ...formData,
            age: parseInt(formData.age, 10) || 0,
            isPregnant: formData.gender === Gender.Female ? formData.isPregnant : false,
            createdAt: new Date().toISOString(),
            discount: isAdmin ? Number(formData.discount) : undefined,
        };
        try {
            await onSave(newPatientData);
            // On success, the parent component will close the modal.
        } catch (error) {
            // FIX: Argument of type 'unknown' is not assignable to parameter of type 'string'.
            // Check if error is an instance of Error before using its message property.
            const message = error instanceof Error ? error.message : 'خطأ غير معروف';
            alert(`فشل الحفظ: ${message}`);
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg" role="dialog" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">إضافة مريض جديد</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 max-h-[70vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div><label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاسم</label><input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className={inputStyle} /></div>
                         <div><label htmlFor="age" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العمر</label><input type="number" id="age" name="age" value={formData.age} onChange={handleChange} required className={inputStyle} /></div>
                         <div><label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الهاتف</label><input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required className={inputStyle} /></div>
                         {isAdmin && (
                            <div>
                                <label htmlFor="discount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">مبلغ الخصم</label>
                                <input type="number" id="discount" name="discount" value={formData.discount} onChange={handleChange} min="0" className={inputStyle} />
                            </div>
                         )}
                         <div>
                            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الجنس</label>
                            <select id="gender" name="gender" value={formData.gender} onChange={handleChange} className={inputStyle}>
                                <option value={Gender.Male}>ذكر</option>
                                <option value={Gender.Female}>أنثى</option>
                            </select>
                        </div>
                        {canEditDoctors && (
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الأطباء المسؤولون</label>
                                {isSecretary && diagnosisDoctors.length === 0 ? (
                                    <div className="mt-2 p-3 border border-red-400 dark:border-red-600 rounded-md bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-center">
                                        لا يوجد طبيب تشخيص. يرجى الطلب من المدير اضافة طبيب تشخيص.
                                    </div>
                                ) : (
                                    <div className="mt-2 p-3 border border-gray-800 dark:border-gray-600 rounded-md h-32 overflow-y-auto space-y-2 bg-white dark:bg-gray-700">
                                        {doctorsForSelection.map(doctor => (
                                            <label key={doctor.id} className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.doctorIds.includes(doctor.id)}
                                                    onChange={() => handleDoctorIdsChange(doctor.id)}
                                                    className="h-4 w-4 text-primary rounded border-gray-300 dark:border-gray-500 focus:ring-primary"
                                                />
                                                <div>
                                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{doctor.name}</span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 block">{doctor.specialty || 'لا يوجد تخصص'}</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        {!isSecretary && (
                            <>
                                <div className="md:col-span-2"><label htmlFor="drugAllergy" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الحساسية الدوائية</label><textarea id="drugAllergy" name="drugAllergy" value={formData.drugAllergy} onChange={handleChange} rows={2} className={inputStyle}></textarea></div>
                                <div className="md:col-span-2"><label htmlFor="chronicDiseases" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الأمراض المزمنة</label><textarea id="chronicDiseases" name="chronicDiseases" value={formData.chronicDiseases} onChange={handleChange} rows={2} className={inputStyle}></textarea></div>
                                <div className="md:col-span-2"><label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ملاحظات عامة</label><textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={2} className={inputStyle}></textarea></div>
                            </>
                        )}
                        <div className="md:col-span-2 flex items-center space-x-4 pt-2">
                           <label className="flex items-center cursor-pointer">
                                <input type="checkbox" name="isSmoker" checked={formData.isSmoker} onChange={handleChange} className="h-4 w-4 text-primary rounded border-gray-300 dark:border-gray-500 focus:ring-primary" />
                                <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">مدخن</span>
                            </label>
                            {formData.gender === Gender.Female && (
                                <label className="flex items-center cursor-pointer">
                                    <input type="checkbox" name="isPregnant" checked={formData.isPregnant} onChange={handleChange} className="h-4 w-4 text-primary rounded border-gray-300 dark:border-gray-500 focus:ring-primary" />
                                    <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">حامل</span>
                                </label>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end items-center p-4 bg-gray-50 dark:bg-slate-700/50 border-t dark:border-gray-700 rounded-b-lg gap-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500">إلغاء</button>
                        <button type="submit" disabled={isSaving || (isSecretary && diagnosisDoctors.length === 0)} className="px-4 py-2 bg-primary border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-700 disabled:bg-primary-300">{isSaving ? 'جاري الحفظ...' : 'حفظ'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ===================================================================
// EditPatientModal Component
// ===================================================================
interface EditPatientModalProps {
    patient: Patient;
    onSave: (updatedPatient: Patient) => Promise<void>;
    onClose: () => void;
    doctors: User[];
    user: User;
}

const EditPatientModal: React.FC<EditPatientModalProps> = ({ patient, onSave, onClose, doctors, user }) => {
    const [formData, setFormData] = useState({
        name: patient.name,
        age: patient.age.toString(),
        phone: patient.phone,
        notes: patient.notes,
        gender: patient.gender || Gender.Male,
        isSmoker: patient.isSmoker || false,
        isPregnant: patient.isPregnant || false,
        drugAllergy: patient.drugAllergy || '',
        chronicDiseases: patient.chronicDiseases || '',
        doctorIds: patient.doctorIds || [],
        discount: patient.discount || 0,
    });
    const [isSaving, setIsSaving] = useState(false);
    const inputStyle = "w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black dark:text-white";
    
    const isAdmin = user.role === UserRole.Admin;
    const isSecretary = user.role === UserRole.Secretary;
    const canEditDoctors = user.role === UserRole.Admin || user.role === UserRole.Secretary || (user.role === UserRole.Doctor && user.is_diagnosis_doctor);


    const handleDoctorIdsChange = (doctorId: string) => {
        setFormData(prev => {
            const currentDoctorIds = prev.doctorIds;
            const newDoctorIds = currentDoctorIds.includes(doctorId)
                ? currentDoctorIds.filter(id => id !== doctorId)
                : [...currentDoctorIds, doctorId];
            return { ...prev, doctorIds: newDoctorIds };
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
             if (name === 'gender' && value === Gender.Male) {
                setFormData(prev => ({ ...prev, isPregnant: false }));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const updatedPatientData = {
            ...patient,
            name: formData.name,
            age: parseInt(formData.age, 10) || 0,
            phone: formData.phone,
            notes: formData.notes,
            gender: formData.gender,
            isSmoker: formData.isSmoker,
            isPregnant: formData.gender === Gender.Female ? formData.isPregnant : false,
            drugAllergy: formData.drugAllergy,
            chronicDiseases: formData.chronicDiseases,
            doctorIds: formData.doctorIds,
            discount: isAdmin ? Number(formData.discount) : patient.discount,
        };
        try {
            await onSave(updatedPatientData);
        } catch (error) {
            // FIX: Argument of type 'unknown' is not assignable to parameter of type 'string'.
            // Check if error is an instance of Error before using its message property.
            const message = error instanceof Error ? error.message : 'خطأ غير معروف';
            alert(`فشل الحفظ: ${message}`);
            setIsSaving(false); // Only call on error
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg" role="dialog" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">تعديل بيانات المريض</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 max-h-[70vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                         {!isSecretary && (
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">كود المريض</label>
                                <p className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-400">{patient.code}</p>
                            </div>
                         )}
                         <div><label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاسم</label><input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className={inputStyle} /></div>
                         <div><label htmlFor="age" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العمر</label><input type="number" id="age" name="age" value={formData.age} onChange={handleChange} required className={inputStyle} /></div>
                         <div><label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الهاتف</label><input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required className={inputStyle} /></div>
                         {isAdmin && (
                            <div>
                                <label htmlFor="discountEdit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">مبلغ الخصم</label>
                                <input type="number" id="discountEdit" name="discount" value={formData.discount} onChange={handleChange} min="0" className={inputStyle} />
                            </div>
                         )}
                         <div>
                            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الجنس</label>
                            <select id="gender" name="gender" value={formData.gender} onChange={handleChange} className={inputStyle}>
                                <option value={Gender.Male}>ذكر</option>
                                <option value={Gender.Female}>أنثى</option>
                            </select>
                        </div>
                        {canEditDoctors && !isSecretary && (
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الأطباء المسؤولون</label>
                                <div className="mt-2 p-3 border border-gray-800 dark:border-gray-600 rounded-md h-32 overflow-y-auto space-y-2 bg-white dark:bg-gray-700">
                                    {doctors.map(doctor => (
                                        <label key={doctor.id} className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                                            <input
                                                type="checkbox"
                                                checked={formData.doctorIds.includes(doctor.id)}
                                                onChange={() => handleDoctorIdsChange(doctor.id)}
                                                className="h-4 w-4 text-primary rounded border-gray-300 dark:border-gray-500 focus:ring-primary"
                                            />
                                            <div>
                                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{doctor.name}</span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 block">{doctor.specialty || 'لا يوجد تخصص'}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                        {!isSecretary && (
                            <>
                                <div className="md:col-span-2"><label htmlFor="drugAllergyEdit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الحساسية الدوائية</label><textarea id="drugAllergyEdit" name="drugAllergy" value={formData.drugAllergy} onChange={handleChange} rows={2} className={inputStyle}></textarea></div>
                                <div className="md:col-span-2"><label htmlFor="chronicDiseasesEdit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الأمراض المزمنة</label><textarea id="chronicDiseasesEdit" name="chronicDiseases" value={formData.chronicDiseases} onChange={handleChange} rows={2} className={inputStyle}></textarea></div>
                                <div className="md:col-span-2"><label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ملاحظات عامة</label><textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={2} className={inputStyle}></textarea></div>
                            </>
                        )}
                        <div className="md:col-span-2 flex items-center space-x-4 pt-2">
                           <label className="flex items-center cursor-pointer">
                                <input type="checkbox" name="isSmoker" checked={formData.isSmoker} onChange={handleChange} className="h-4 w-4 text-primary rounded border-gray-300 dark:border-gray-500 focus:ring-primary" />
                                <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">مدخن</span>
                            </label>
                            {formData.gender === Gender.Female && (
                                <label className="flex items-center cursor-pointer">
                                    <input type="checkbox" name="isPregnant" checked={formData.isPregnant} onChange={handleChange} className="h-4 w-4 text-primary rounded border-gray-300 dark:border-gray-500 focus:ring-primary" />
                                    <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">حامل</span>
                                </label>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end items-center p-4 bg-gray-50 dark:bg-slate-700/50 border-t dark:border-gray-700 rounded-b-lg gap-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500">إلغاء</button>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 bg-primary border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-700 disabled:bg-primary-300">{isSaving ? 'جاري الحفظ...' : 'حفظ'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

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
// PrintOptionsModal Component (NEW)
// ===================================================================
interface PrintOptionsModalProps {
    patientName: string;
    onConfirm: (includeFinancial: boolean) => void;
    onCancel: () => void;
    user: User;
}

const PrintOptionsModal: React.FC<PrintOptionsModalProps> = ({ patientName, onConfirm, onCancel, user }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 transition-opacity" onClick={onCancel}>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md transform transition-all" role="dialog" onClick={e => e.stopPropagation()}>
            <div className="p-6">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/30">
                        <DocumentTextIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-4">طباعة تقرير لـ {patientName}</h3>
                    {user.role !== UserRole.Doctor && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 px-4">هل ترغب في تضمين الملخص المالي في التقرير؟</p>
                    )}
                </div>
            </div>
            <div className="bg-gray-50 dark:bg-slate-700/50 px-6 py-4 rounded-b-2xl flex flex-col sm:flex-row justify-center gap-3">
                {user.role !== UserRole.Doctor ? (
                    <>
                        <button type="button" onClick={() => onConfirm(true)} className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                            نعم، تضمين الملخص
                        </button>
                        <button type="button" onClick={() => onConfirm(false)} className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-500 shadow-sm px-4 py-2 bg-white dark:bg-gray-600 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400">
                            لا، بدون ملخص
                        </button>
                    </>
                ) : (
                     <button type="button" onClick={() => onConfirm(false)} className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                        طباعة التقرير
                    </button>
                )}
                <button type="button" onClick={onCancel} className="mt-2 sm:mt-0 w-full sm:w-auto inline-flex justify-center rounded-md px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white focus:outline-none">
                    إلغاء
                </button>
            </div>
        </div>
    </div>
);


// ===================================================================
// Main PatientsPage Component
// ===================================================================
interface PatientsPageProps {
    user: User;
    onViewSessions: (patient: Patient) => void;
    onViewPlan: (patient: Patient) => void;
    onViewDetails: (patient: Patient) => void;
    onViewFinancial: (patient: Patient) => void;
    onViewPhotos: (patient: Patient) => void;
    refreshTrigger: number;
}
const PatientsPage: React.FC<PatientsPageProps> = ({ 
    user, 
    onViewSessions, 
    onViewPlan,
    onViewDetails,
    onViewFinancial,
    onViewPhotos,
    refreshTrigger
}) => {
    const [isAddingPatient, setIsAddingPatient] = useState(false);
    const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
    const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
    const isDoctor = user.role === UserRole.Doctor;
    const isSecretary = user.role === UserRole.Secretary;
    const [statusFilter, setStatusFilter] = useState(isDoctor ? 'incomplete' : 'all');
    const [page, setPage] = useState(1);
    const [isPrinting, setIsPrinting] = useState<string | null>(null);
    const [patientToPrint, setPatientToPrint] = useState<Patient | null>(null);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
    
    const [isManualRefreshing, setIsManualRefreshing] = useState(false);
    const prevRefreshTrigger = useRef(refreshTrigger);

    const hasPermission = (permissionName: string) => 
        user.role === UserRole.Admin || (user.permissions?.some(p => p.name === permissionName) ?? false);
    const canAddPatient = hasPermission('add_patient');
    const canEditPatient = hasPermission('edit_patient');
    const canDeletePatient = hasPermission('delete_patient');
    const canPrintReport = hasPermission('print_patient_report');

    const doctorHasFinancialPermission = useMemo(() => 
        isDoctor && (user.permissions?.some(p => p.name === 'financial_management') ?? false),
    [isDoctor, user.permissions]);

    // Financial button should show for Admin/SubManager OR a doctor with the specific permission
    const canViewFinancial = useMemo(() =>
        (!isDoctor && !isSecretary) || doctorHasFinancialPermission,
    [isDoctor, isSecretary, doctorHasFinancialPermission]);

    useEffect(() => {
        if (prevRefreshTrigger.current !== refreshTrigger) {
            setIsManualRefreshing(true);
            prevRefreshTrigger.current = refreshTrigger;
        }
    }, [refreshTrigger]);

    const { settings } = useAppSettings();
    const PATIENTS_PER_PAGE = 10;
    
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setPage(1);
        }, 300); // Debounce search
        return () => clearTimeout(handler);
    }, [searchTerm]);

    const { data: doctorsData, isLoading: isLoadingDoctors } = useQuery({
        queryKey: ['doctors'],
        queryFn: () => api.doctors.getAll(),
    });
    const doctors = doctorsData || [];
    
    const { data: patientsResult, isLoading: isLoadingPatients, isFetching: isFetchingPatients, refetch: refetchPatients } = useQuery({
        queryKey: ['patients', page, debouncedSearchTerm, selectedDoctorId, statusFilter, user.id, user.role, refreshTrigger],
        queryFn: async () => {
            const apiParams: { page: number; per_page: number; search?: string; doctorId?: string; completed?: '0' | '1'; payment_completed?: '0' | '1'; } = {
                page: page,
                per_page: PATIENTS_PER_PAGE,
                search: debouncedSearchTerm,
            };

            if (user.role === UserRole.Doctor) {
                apiParams.doctorId = user.id;
            } else if (selectedDoctorId) {
                apiParams.doctorId = selectedDoctorId;
            }

            switch (statusFilter) {
                case 'incomplete_unpaid':
                    apiParams.completed = '0';
                    apiParams.payment_completed = '0';
                    break;
                case 'complete_unpaid':
                    apiParams.completed = '1';
                    apiParams.payment_completed = '0';
                    break;
                case 'complete_paid':
                    apiParams.completed = '1';
                    apiParams.payment_completed = '1';
                    break;
                case 'complete':
                    apiParams.completed = '1';
                    break;
                case 'incomplete':
                    apiParams.completed = '0';
                    break;
                case 'all':
                    // No specific status filters
                    break;
            }
            return api.patients.getAll(apiParams);
        },
        refetchInterval: 60000,
    });

    useEffect(() => {
        if (!isFetchingPatients && isManualRefreshing) {
            setIsManualRefreshing(false);
        }
    }, [isFetchingPatients, isManualRefreshing]);
    
    const patients = patientsResult?.patients || [];
    const totalResults = patientsResult?.total || 0;
    const totalPages = patientsResult?.last_page || 1;
    const showLoadingSpinner = isLoadingPatients || isManualRefreshing;

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };


    const handlePrintReport = async (patient: Patient, includeFinancial: boolean) => {
        setPatientToPrint(null);
        setIsPrinting(patient.id);
    
        const [allSessions] = await Promise.all([
            api.sessions.getAll(),
        ]);

        const sessions = allSessions.filter(s => s.patientId === patient.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const getDoctorName = (doctorId: string) => doctors.find(d => d.id === doctorId)?.name || 'غير معروف';
    
        const patientDoctors = doctors.filter(d => patient.doctorIds.includes(d.id));
        const shouldShowFinancial = user.role !== UserRole.Doctor && includeFinancial;

        let financialHTML = '';
        const totalCost = sessions.reduce((sessionSum, s) => {
            const treatmentsCost = s.treatments.reduce((treatmentSum, t) => {
                return treatmentSum + t.sessionPrice + (t.additionalCosts || 0);
            }, 0);
            return sessionSum + treatmentsCost;
        }, 0);

        if (shouldShowFinancial) {
            const allPaymentsResponse = await api.payments.getAll({ page: 1, per_page: 9999 });
            const allPayments = allPaymentsResponse.payments;
            const payments = allPayments.filter(p => p.patientId === patient.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
            const balance = totalCost - totalPayments;
        
            financialHTML = `
                <section class="mt-8">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">الملخص المالي</h2>
                     ${payments.length > 0 ? `
                         <div class="mb-4 break-inside-avoid">
                            <h3 class="font-semibold mb-2">الدفعات المسجلة</h3>
                            <table class="w-full text-right text-sm">
                                <thead class="text-xs text-gray-700 uppercase bg-gray-100">
                                    <tr><th class="px-2 py-1">التاريخ</th><th class="px-2 py-1">المبلغ</th></tr>
                                </thead>
                                <tbody>
                                ${payments.map(p => `
                                    <tr class="border-b">
                                        <td class="px-2 py-1">${new Date(p.date).toLocaleDateString()}</td>
                                        <td class="px-2 py-1">SYP ${p.amount.toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                                </tbody>
                            </table>
                         </div>
                     ` : ''}
                    <div class="border-t border-gray-300 pt-4 space-y-2 text-md">
                         <div class="flex justify-between"><span class="font-medium text-gray-600">إجمالي التكاليف:</span><span class="font-bold">SYP ${totalCost.toFixed(2)}</span></div>
                         <div class="flex justify-between"><span class="font-medium text-gray-600">إجمالي المدفوعات:</span><span class="font-bold text-green-600">SYP ${totalPayments.toFixed(2)}</span></div>
                         <div class="flex justify-between text-lg"><span class="font-bold">الرصيد المتبقي:</span><span class="font-bold">SYP ${balance.toFixed(2)}</span></div>
                    </div>
                </section>
            `;
        }
        
        const patientDetailsHTML = `
            <div class="flex flex-wrap -mx-2 text-sm mb-2">
                <div class="px-2 mb-2">
                    <span class="font-medium text-gray-500">الاسم: </span>
                    <span class="text-gray-900 font-semibold">${patient.name}</span>
                </div>
                <div class="px-2 mb-2">
                    <span class="font-medium text-gray-500">الكود: </span>
                    <span class="text-gray-900 font-semibold">${patient.code}</span>
                </div>
                <div class="px-2 mb-2">
                    <span class="font-medium text-gray-500">العمر: </span>
                    <span class="text-gray-900 font-semibold">${patient.age}</span>
                </div>
                <div class="px-2 mb-2">
                    <span class="font-medium text-gray-500">الهاتف: </span>
                    <span class="text-gray-900 font-semibold">${patient.phone}</span>
                </div>
                <div class="px-2 mb-2">
                    <span class="font-medium text-gray-500">الجنس: </span>
                    <span class="text-gray-900 font-semibold">${patient.gender === 'female' ? 'أنثى' : 'ذكر'}</span>
                </div>
                ${patient.isSmoker ? `<div class="px-2 mb-2"><span class="font-medium text-gray-500">مدخن: </span><span class="text-gray-900 font-semibold">نعم</span></div>` : ''}
                ${patient.gender === 'female' && patient.isPregnant ? `<div class="px-2 mb-2"><span class="font-medium text-gray-500">حامل: </span><span class="text-gray-900 font-semibold">نعم</span></div>` : ''}
            </div>
            <dl class="text-sm">
                <div class="py-2 border-t border-gray-200 grid grid-cols-3 gap-4">
                    <dt class="font-medium text-gray-500">الأطباء</dt>
                    <dd class="text-gray-900 sm:mt-0 col-span-2">${patientDoctors.map(d => d.name).join(', ')}</dd>
                </div>
                <div class="py-2 border-t border-gray-200 grid grid-cols-3 gap-4">
                    <dt class="font-medium text-gray-500">الحساسية الدوائية</dt>
                    <dd class="text-gray-900 sm:mt-0 col-span-2">${patient.drugAllergy || 'لا يوجد'}</dd>
                </div>
                <div class="py-2 border-t border-gray-200 grid grid-cols-3 gap-4">
                    <dt class="font-medium text-gray-500">الأمراض المزمنة</dt>
                    <dd class="text-gray-900 sm:mt-0 col-span-2">${patient.chronicDiseases || 'لا يوجد'}</dd>
                </div>
                <div class="py-2 border-t border-gray-200 grid grid-cols-3 gap-4">
                    <dt class="font-medium text-gray-500">ملاحظات عامة</dt>
                    <dd class="text-gray-900 sm:mt-0 col-span-2">${patient.notes || 'لا يوجد'}</dd>
                </div>
            </dl>
        `;
    
        const sessionsHTML = sessions.length > 0 ? `
            <section class="mt-8">
                <h2 class="text-xl font-bold text-gray-800 mb-4">سجل الجلسات</h2>
                <div class="space-y-4">
                    ${sessions.map(session => `
                        <div class="border border-gray-200 rounded-lg p-4 break-inside-avoid">
                            <h3 class="font-semibold">${session.title || `جلسة بتاريخ ${new Date(session.date).toLocaleDateString()}`} - الطبيب: ${getDoctorName(session.doctorId)}</h3>
                            ${session.notes ? `<p class="text-sm text-gray-600 mt-1">ملاحظات الجلسة: ${session.notes}</p>` : ''}
                            ${session.treatments.length > 0 ? `
                                 <table class="w-full text-right text-sm mt-2">
                                    <thead class="text-xs text-gray-700 uppercase bg-gray-100">
                                        <tr>
                                            <th class="px-2 py-1">العلاج</th>
                                            <th class="px-2 py-1">التاريخ</th>
                                            ${shouldShowFinancial ? '<th class="px-2 py-1">السعر</th>' : ''}
                                            <th class="px-2 py-1">ملاحظات</th>
                                            <th class="px-2 py-1">مكتمل</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    ${session.treatments.map(t => `
                                        <tr class="border-b">
                                            <td class="px-2 py-1">${t.name}</td>
                                            <td class="px-2 py-1">${t.treatmentDate ? new Date(t.treatmentDate).toLocaleDateString() : '-'}</td>
                                            ${shouldShowFinancial ? `<td class="px-2 py-1">SYP ${(t.sessionPrice + (t.additionalCosts || 0)).toFixed(2)}</td>` : ''}
                                            <td class="px-2 py-1">${t.sessionNotes || '-'}</td>
                                            <td class="px-2 py-1">${t.completed ? 'نعم' : 'لا'}</td>
                                        </tr>
                                    `).join('')}
                                    </tbody>
                                 </table>
                            ` : '<p class="text-sm text-gray-500 mt-2">لا توجد علاجات لهذه الجلسة.</p>'}
                        </div>
                    `).join('')}
                </div>
            </section>
        ` : '';
        
        const absoluteLogoUrl = new URL(settings.appLogo, window.location.origin).href;
    
        const reportHTML = `
          <!DOCTYPE html>
          <html lang="ar" dir="rtl">
            <head>
              <meta charset="UTF-8" />
              <title>تقرير - ${patient.name}</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                @media print {
                  @page { size: A4; margin: 20mm; }
                  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
              </style>
            </head>
            <body class="bg-white font-sans">
              <div id="printable-report" class="p-6 md:p-8">
                <header class="flex justify-between items-start border-b border-gray-300 pb-4 mb-6">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-800">${settings.appName}</h1>
                        <p class="text-gray-500">تقرير المريض</p>
                    </div>
                     <img src="${absoluteLogoUrl}" alt="شعار التطبيق" class="h-16 w-16" />
                </header>
                <section>
                    <h2 class="text-xl font-bold text-gray-800 mb-2">معلومات المريض</h2>
                    ${patientDetailsHTML}
                </section>
                ${sessionsHTML}
                ${financialHTML}
                <footer class="text-center text-xs text-gray-400 mt-8 pt-4 border-t border-gray-300">
                    تاريخ الطباعة: ${new Date().toLocaleString()}
                </footer>
              </div>
            </body>
          </html>
        `;
    
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.open();
            printWindow.document.write(reportHTML);
            printWindow.document.close();
            printWindow.onload = () => {
                printWindow.focus();
                printWindow.print();
                // printWindow.close(); // Optional: close the window after printing
            };
        }
        
        setIsPrinting(null);
    };

    const handleCreatePatient = async (newPatientData: Omit<Patient, 'id' | 'code'>) => {
        await api.patients.create(newPatientData, user.id);
        setIsAddingPatient(false);
        setPage(1);
        refetchPatients();
    };

    const handleUpdatePatient = async (updatedPatient: Patient) => {
        await api.patients.update(updatedPatient.id, updatedPatient, user.id);
        setEditingPatient(null);
        refetchPatients();
    };

    const confirmDeletePatient = async () => {
        if (deletingPatient) {
            setIsDeleting(true);
            try {
                await api.patients.delete(deletingPatient.id, user.id);
                setDeletingPatient(null);
                refetchPatients();
            } catch (error) {
                alert(`فشل في حذف المريض: ${error instanceof Error ? error.message : "خطأ غير معروف"}`);
            } finally {
                setIsDeleting(false);
            }
        }
    };

    return (
        <div>
            <div className="flex justify-center items-center mb-6 flex-wrap gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="relative">
                       <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                           <SearchIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                       </div>
                       <input
                           type="text"
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                           placeholder="ابحث بالاسم، الكود، أو الهاتف..."
                           className="w-full sm:w-64 pl-3 pr-10 py-2 bg-white dark:bg-gray-700 text-black dark:text-white border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                       />
                    </div>
                     {user.role !== UserRole.Doctor && (
                         <div className="relative">
                            <select
                                value={selectedDoctorId}
                                onChange={(e) => {
                                    setSelectedDoctorId(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full sm:w-48 px-3 py-2 pl-10 bg-white dark:bg-gray-700 text-black dark:text-white border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none"
                                aria-label="Filter by doctor"
                            >
                                <option value="">كل الأطباء</option>
                                {doctors.map(doctor => (
                                    <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <ChevronDownIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </div>
                        </div>
                    )}
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPage(1);
                            }}
                            className="w-full sm:w-48 px-3 py-2 pl-10 bg-white dark:bg-gray-700 text-black dark:text-white border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none"
                            aria-label="تصفية حسب الحالة"
                        >
                            {isDoctor ? (
                                <>
                                    <option value="incomplete">غير مكتمل</option>
                                    <option value="complete">مكتمل</option>
                                </>
                            ) : (
                                <>
                                    <option value="all">كل الحالات</option>
                                    <option value="incomplete_unpaid">غير مكتمل وغير مسدد</option>
                                    <option value="complete_unpaid">مكتمل وغير مسدد</option>
                                    <option value="complete_paid">مكتمل ومسدد</option>
                                </>
                            )}
                        </select>
                         <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <ChevronDownIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </div>
                    </div>
                     {canAddPatient && (
                        <button onClick={() => setIsAddingPatient(true)} className="hidden lg:flex items-center bg-primary text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700 transition-colors">
                            <PlusIcon className="h-5 w-5 ml-2" />
                            إضافة مريض
                        </button>
                     )}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md min-h-[200px]">
                {showLoadingSpinner ? <CenteredLoadingSpinner /> : (
                     patients.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {patients.map(p => (
                                    <div key={p.id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 flex flex-col justify-between shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 dark:shadow-slate-900/50">
                                        <div>
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{p.name}</h3>
                                                <div className="flex items-center gap-2">
                                                    {p.completed && (
                                                        <div className="p-1 bg-green-100 dark:bg-green-900/40 rounded-full" title="جميع الجلسات مكتملة">
                                                            <CheckIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                        </div>
                                                    )}
                                                    {p.payment_completed === true && (
                                                        <div className="p-1 bg-blue-100 dark:bg-blue-900/40 rounded-full" title="مدفوع بالكامل">
                                                            <CurrencyDollarIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                    )}
                                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">{p.code}</span>
                                                </div>
                                            </div>
                                            <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                                <p><span className="font-semibold">العمر:</span> {p.age}</p>
                                                <p><span className="font-semibold">الهاتف:</span> {p.phone}</p>
                                                {p.discount && p.discount > 0 && (
                                                    <p className="font-semibold text-yellow-600 dark:text-yellow-400">
                                                        <span className="font-semibold">خصم:</span> {p.discount.toLocaleString()} SYP
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-center justify-start gap-2">
                                                    {canEditPatient && <button onClick={() => setEditingPatient(p)} className="p-2 rounded-full text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40" title="تعديل"><PencilIcon className="h-5 w-5" /></button>}
                                                    {canDeletePatient && (
                                                        <button onClick={() => setDeletingPatient(p)} className="p-2 rounded-full text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40" title="حذف"><TrashIcon className="h-5 w-5" /></button>
                                                    )}
                                                     {!isSecretary && (
                                                        <button onClick={() => onViewDetails(p)} className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600" title="تفاصيل"><EyeIcon className="h-5 w-5" /></button>
                                                    )}
                                                </div>
                                                <div className="flex items-center flex-wrap justify-start gap-2">
                                                    {!isSecretary && (
                                                        <button onClick={() => onViewSessions(p)} className="flex items-center gap-1 text-xs px-2 py-1 bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300 rounded-md hover:bg-teal-200 dark:hover:bg-teal-900/60"><BeakerIcon className="h-4 w-4" /><span>الجلسات</span></button>
                                                    )}
                                                    {canViewFinancial && (
                                                        <button onClick={() => onViewFinancial(p)} className="flex items-center gap-1 text-xs px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-900/60"><CurrencyDollarIcon className="h-4 w-4" /><span>المالية</span></button>
                                                    )}
                                                    <button onClick={() => onViewPhotos(p)} className="flex items-center gap-1 text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 rounded-md hover:bg-purple-200 dark:hover:bg-purple-900/60"><PhotographIcon className="h-4 w-4" /><span>الصور</span></button>
                                                    {!isSecretary && (
                                                        <button onClick={() => onViewPlan(p)} className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/60"><ListBulletIcon className="h-4 w-4" /><span>الخطة</span></button>
                                                    )}
                                                    {canPrintReport && (
                                                        <button onClick={() => setPatientToPrint(p)} className="flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 dark:bg-gray-900/40 text-gray-800 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-900/60">
                                                            {isPrinting === p.id ? <LoadingSpinner className="h-4 w-4" /> : <DocumentTextIcon className="h-4 w-4" />}<span>طباعة</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8 flex justify-between items-center flex-wrap gap-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    عرض {patients.length} من أصل {totalResults} مرضى
                                </p>
                                <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
                            </div>
                        </>
                    ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-16">لم يتم العثور على مرضى.</p>
                    )
                )}
            </div>
            
            {canAddPatient && (
                <button 
                    onClick={() => setIsAddingPatient(true)} 
                    className="lg:hidden fixed bottom-20 right-4 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary-700 transition-colors z-20"
                    aria-label="إضافة مريض"
                >
                    <PlusIcon className="h-6 w-6" />
                </button>
            )}

            {isAddingPatient && <AddPatientModal onSave={handleCreatePatient} onClose={() => setIsAddingPatient(false)} doctors={doctors} user={user} />}
            
            {editingPatient && (
                <EditPatientModal 
                    patient={editingPatient}
                    onSave={handleUpdatePatient}
                    onClose={() => setEditingPatient(null)}
                    doctors={doctors}
                    user={user}
                />
            )}
            {deletingPatient && (
                 <ConfirmDeleteModal
                    title="حذف المريض"
                    message={`هل أنت متأكد من رغبتك في حذف المريض ${deletingPatient.name}؟ لا يمكن التراجع عن هذا الإجراء.`}
                    onConfirm={confirmDeletePatient}
                    onCancel={() => !isDeleting && setDeletingPatient(null)}
                    isDeleting={isDeleting}
                />
            )}
             {patientToPrint && (
                <PrintOptionsModal
                    patientName={patientToPrint.name}
                    onConfirm={(includeFinancial) => handlePrintReport(patientToPrint, includeFinancial)}
                    onCancel={() => setPatientToPrint(null)}
                    user={user}
                />
            )}
        </div>
    );
};
export default PatientsPage;
