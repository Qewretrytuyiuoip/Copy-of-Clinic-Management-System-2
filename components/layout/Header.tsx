

import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { User } from '../../types';
import { LogoutIcon, MenuIcon, ResetIcon } from '../Icons';
import { ROLE_NAMES } from '../../constants';
import ThemeToggleButton from '../ThemeToggleButton';

interface HeaderProps {
    user: User;
    setSidebarOpen: (open: boolean) => void;
    onRefresh: () => void;
}

// ===================================================================
// ConfirmLogoutModal Component
// ===================================================================
interface ConfirmLogoutModalProps {
    onConfirm: () => void;
    onCancel: () => void;
    isLoggingOut: boolean;
}

const ConfirmLogoutModal: React.FC<ConfirmLogoutModalProps> = ({ onConfirm, onCancel, isLoggingOut }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 transition-opacity" onClick={onCancel}>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm transform transition-all" role="dialog" onClick={e => e.stopPropagation()}>
            <div className="p-6">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                        <LogoutIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-4">تأكيد تسجيل الخروج</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 px-4">هل أنت متأكد أنك تريد تسجيل الخروج؟</p>
                </div>
            </div>
            <div className="bg-gray-50 dark:bg-slate-700/50 px-6 py-4 rounded-b-2xl flex justify-center gap-4">
                <button type="button" onClick={onConfirm} disabled={isLoggingOut} className="w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-400 disabled:cursor-not-allowed">
                    {isLoggingOut ? 'جاري تسجيل الخروج...' : 'نعم، تسجيل الخروج'}
                </button>
                <button type="button" onClick={onCancel} disabled={isLoggingOut} className="w-full rounded-md border border-gray-300 dark:border-gray-500 shadow-sm px-4 py-2 bg-white dark:bg-gray-600 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed">
                    إلغاء
                </button>
            </div>
        </div>
    </div>
);


const Header: React.FC<HeaderProps> = ({ user, setSidebarOpen, onRefresh }) => {
    const { logout } = useAuth();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        await logout();
    };

    return (
        <>
            <header className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-b dark:border-gray-700">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="text-gray-500 dark:text-gray-400 focus:outline-none lg:hidden"
                >
                    <MenuIcon className="h-6 w-6" />
                </button>
                <div className="flex items-center">
                    {/* Placeholder for search or title */}
                </div>
                <div className="flex items-center">
                    <ThemeToggleButton />
                    <button
                        onClick={onRefresh}
                        className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-primary"
                        aria-label="إعادة تحميل البيانات"
                    >
                        <ResetIcon className="h-6 w-6" />
                    </button>
                    <div className="text-left ml-4">
                        <p className="font-semibold text-gray-800 dark:text-gray-100">{user.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{ROLE_NAMES[user.role]}</p>
                    </div>
                    <button
                        onClick={() => setIsLogoutModalOpen(true)}
                        className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-primary"
                        aria-label="تسجيل الخروج"
                    >
                        <LogoutIcon className="h-6 w-6" />
                    </button>
                </div>
            </header>
            {isLogoutModalOpen && (
                <ConfirmLogoutModal
                    onConfirm={handleLogout}
                    onCancel={() => !isLoggingOut && setIsLogoutModalOpen(false)}
                    isLoggingOut={isLoggingOut}
                />
            )}
        </>
    );
};

export default Header;