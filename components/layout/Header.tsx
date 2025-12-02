
import React from 'react';
import { User, UserRole } from '../../types';
import { MenuIcon, ResetIcon } from '../Icons';
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

const Header: React.FC<HeaderProps> = ({ user, setSidebarOpen, onRefresh, pageName, currentPage, isOnline, setCurrentPage }) => {
    // The "Treatments" settings for admins/submanagers are part of the "Profile" page.
    // The user requested to hide the refresh button on this page.
    // We keep it for other roles on the profile page (like Doctors for their schedule).
    const showRefreshButton = !(currentPage === 'profile' && (user.role === UserRole.Admin || user.role === UserRole.SubManager));

    return (
        <>
            <header className="relative flex items-center justify-between p-4 
                bg-primary/70 dark:bg-slate-900/70 
                backdrop-blur-xl backdrop-saturate-150 
                border-b border-white/20 dark:border-white/5 
                shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] 
                transition-all duration-300 z-30 overflow-hidden">
                
                {/* Liquid Shine Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none"></div>

                <div className="flex items-center gap-3 relative z-10">
                    <div className="flex items-center lg:hidden gap-2">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="text-white dark:text-gray-200 hover:bg-white/20 dark:hover:bg-white/10 p-1 rounded-full focus:outline-none transition-colors"
                            aria-label="القائمة"
                        >
                            <MenuIcon className="h-6 w-6" />
                        </button>
                    </div>
                    <div className="px-2 py-1 border border-yellow-400 text-yellow-400 text-xs font-bold rounded-md bg-yellow-400/10 select-none backdrop-blur-sm">
                        تجريبي
                    </div>
                </div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <h1 className="text-lg font-bold text-white dark:text-gray-100 truncate pointer-events-none max-w-[150px] sm:max-w-md drop-shadow-sm">
                        {pageName}
                    </h1>
                </div>
                
                <div className="flex items-center gap-2 relative z-10">
                    <ThemeToggleButton className="p-2 rounded-full text-white dark:text-gray-200 hover:bg-white/20 dark:hover:bg-white/10 transition-colors" />

                    {showRefreshButton && (
                        <button
                            onClick={onRefresh}
                            className="p-2 rounded-full text-white dark:text-gray-200 hover:bg-white/20 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-white transition-colors"
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
