
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { User } from '../../types';
import { LogoutIcon, MenuIcon } from '../Icons';
import { ROLE_NAMES } from '../../constants';

interface HeaderProps {
    user: User;
    setSidebarOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ user, setSidebarOpen }) => {
    const { logout } = useAuth();

    return (
        <header className="flex items-center justify-between p-4 bg-white border-b">
            <button
                onClick={() => setSidebarOpen(true)}
                className="text-gray-500 focus:outline-none lg:hidden"
            >
                <MenuIcon className="h-6 w-6" />
            </button>
            <div className="flex items-center">
                 {/* Placeholder for search or title */}
            </div>
            <div className="flex items-center">
                <div className="text-left ml-4">
                    <p className="font-semibold text-gray-800">{user.name}</p>
                    <p className="text-sm text-gray-500">{ROLE_NAMES[user.role]}</p>
                </div>
                <button
                    onClick={logout}
                    className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    aria-label="تسجيل الخروج"
                >
                    <LogoutIcon className="h-6 w-6 text-gray-600" />
                </button>
            </div>
        </header>
    );
};

export default Header;
