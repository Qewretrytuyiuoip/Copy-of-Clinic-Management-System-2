import React from 'react';
import { User } from '../../types';
import { NAV_ITEMS } from '../../constants';

interface BottomNavProps {
    user: User;
    currentPage: string;
    setCurrentPage: (page: string) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ user, currentPage, setCurrentPage }) => {
    const navItems = NAV_ITEMS[user.role].filter(item => item.page !== 'profile');

    return (
        <div className="lg:hidden fixed bottom-0 left-0 z-10 w-full h-16 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-gray-700">
            <div className="flex h-full max-w-lg mx-auto font-medium">
                {navItems.slice(0, 5).map((item) => (
                    <button
                        key={item.name}
                        type="button"
                        onClick={() => setCurrentPage(item.page)}
                        className={`flex-1 inline-flex flex-col items-center justify-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 group ${
                            currentPage === item.page ? 'text-primary' : 'text-gray-500 dark:text-gray-400'
                        }`}
                    >
                        <item.icon className="w-6 h-6 mb-1" />
                        <span className="text-xs text-center">{item.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default BottomNav;