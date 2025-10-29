import React from 'react';
import { User } from '../../types';
import { MenuIcon, ResetIcon, ArrowDownOnSquareIcon } from '../Icons';
import ThemeToggleButton from '../ThemeToggleButton';

interface HeaderProps {
    user: User;
    setSidebarOpen: (open: boolean) => void;
    onRefresh: () => void;
    pageName: string;
}

const Header: React.FC<HeaderProps> = ({ user, setSidebarOpen, onRefresh, pageName }) => {
    return (
        <>
            <header className="relative flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-b dark:border-gray-700">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="text-gray-500 dark:text-gray-400 focus:outline-none lg:hidden"
                >
                    <MenuIcon className="h-6 w-6" />
                </button>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate pointer-events-none">
                        {pageName}
                    </h1>
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
                </div>
            </header>
        </>
    );
};

export default Header;