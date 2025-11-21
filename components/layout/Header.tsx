import React from 'react';
import { User, UserRole } from '../../types';
import { MenuIcon, ResetIcon, WifiIcon, WifiOffIcon, ArrowBackIcon } from '../Icons';
import ThemeToggleButton from '../ThemeToggleButton';

interface HeaderProps {
    user: User;
    setSidebarOpen: (open: boolean) => void;
    onRefresh: () => void;
    pageName: string;
    currentPage: string;
    isOnline: boolean;
    setCurrentPage: (page: string) => void;
}

const BACK_ROUTES: Record<string, string> = {
    'sessions': 'patients',
    'plan': 'patients',
    'details': 'patients',
    'financial': 'patients',
    'photos': 'patients',
    'activity': 'patients',
    'activity-archives': 'dashboard',
};

const Header: React.FC<HeaderProps> = ({ user, setSidebarOpen, onRefresh, pageName, currentPage, isOnline, setCurrentPage }) => {
    // The "Treatments" settings for admins/submanagers are part of the "Profile" page.
    // The user requested to hide the refresh button on this page.
    // We keep it for other roles on the profile page (like Doctors for their schedule).
    const showRefreshButton = !(currentPage === 'profile' && (user.role === UserRole.Admin || user.role === UserRole.SubManager));

    const backRoute = BACK_ROUTES[currentPage];

    const handleBack = () => {
        if (backRoute) {
            setCurrentPage(backRoute);
        }
    };

    return (
        <>
            <header className="relative flex items-center justify-between p-4 bg-primary dark:bg-slate-800 border-b border-primary-600 dark:border-gray-700 transition-colors duration-300 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex items-center lg:hidden gap-2">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="text-white dark:text-gray-400 hover:bg-primary-600 dark:hover:bg-gray-700 p-1 rounded-full focus:outline-none"
                            aria-label="القائمة"
                        >
                            <MenuIcon className="h-6 w-6" />
                        </button>
                        {backRoute && (
                            <button
                                onClick={handleBack}
                                className="lg:hidden p-2 rounded-full text-white dark:text-gray-400 hover:bg-primary-600 dark:hover:bg-gray-700 focus:outline-none"
                                aria-label="رجوع"
                            >
                                {/* Rotate 180 for RTL back arrow */}
                                <ArrowBackIcon className="h-6 w-6 transform rotate-180" />
                            </button>
                        )}
                    </div>
                    <div className="px-2 py-1 border border-yellow-400 text-yellow-400 text-xs font-bold rounded-md bg-yellow-400/10 select-none">
                        تجريبي
                    </div>
                </div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <h1 className="text-lg font-bold text-white dark:text-gray-100 truncate pointer-events-none max-w-[150px] sm:max-w-md">
                        {pageName}
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                     <div className="p-2 rounded-full" title={isOnline ? "متصل بالإنترنت" : "لا يوجد اتصال بالإنترنت"}>
                        {isOnline ? (
                            // Using text-green-300 for visibility on blue background
                            <WifiIcon className="h-6 w-6 text-green-300 dark:text-green-400" />
                        ) : (
                            <WifiOffIcon className="h-6 w-6 text-red-300 dark:text-red-400" />
                        )}
                    </div>

                    <ThemeToggleButton className="p-2 rounded-full text-white dark:text-gray-300 hover:bg-primary-600 dark:hover:bg-gray-700" />

                    {showRefreshButton && (
                        <button
                            onClick={onRefresh}
                            className="p-2 rounded-full text-white dark:text-gray-300 hover:bg-primary-600 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary dark:focus:ring-offset-slate-800 focus:ring-white"
                            aria-label="إعادة تحميل البيانات"
                        >
                            <ResetIcon className="h-6 w-6" />
                        </button>
                    )}
                </div>
            </header>
        </>
    );
};

export default Header;