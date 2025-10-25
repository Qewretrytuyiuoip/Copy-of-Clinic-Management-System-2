


import React from 'react';
import { User } from '../../types';
import { MenuIcon, ResetIcon } from '../Icons';
import ThemeToggleButton from '../ThemeToggleButton';

interface HeaderProps {
    user: User;
    setSidebarOpen: (open: boolean) => void;
    onRefresh: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, setSidebarOpen, onRefresh }) => {
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
                </div>
            </header>
        </>
    );
};

export default Header;