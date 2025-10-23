import React, { Fragment } from 'react';
import { User } from '../../types';
import { NAV_ITEMS } from '../../constants';
import { XIcon } from '../Icons';
import { useAppSettings } from '../../hooks/useAppSettings';

interface SidebarProps {
    user: User;
    currentPage: string;
    setCurrentPage: (page: string) => void;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, currentPage, setCurrentPage, sidebarOpen, setSidebarOpen }) => {
    const { settings } = useAppSettings();
    const navItems = NAV_ITEMS[user.role];

    const handleNavigation = (page: string) => {
        setCurrentPage(page);
        setSidebarOpen(false);
    }
    
    const sidebarHeader = (
        <div className="flex items-center justify-center h-20 border-b dark:border-gray-700 px-4">
            {settings.appLogo && <img src={settings.appLogo} alt="App Logo" className="h-8 w-auto ml-2" />}
            <h1 className="text-xl font-bold text-primary truncate">{settings.appName}</h1>
        </div>
    );

    const navLinks = (
        <nav className="mt-8 px-2">
            {navItems.map((item) => (
                <a
                    key={item.name}
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        handleNavigation(item.page);
                    }}
                    className={`flex items-center mt-4 py-2 px-6 rounded-md transition-colors duration-200 ${
                        currentPage === item.page
                            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                >
                    <item.icon className="h-6 w-6" />
                    <span className="mx-3">{item.name}</span>
                </a>
            ))}
        </nav>
    );

    return (
        <>
            {/* Mobile Sidebar with Overlay */}
            <div className={`fixed inset-0 z-30 flex transition-transform duration-300 lg:hidden ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="relative flex w-64 max-w-xs flex-1 flex-col bg-white dark:bg-slate-800">
                    <div className="absolute top-0 left-0 -ml-12 pt-2">
                        <button
                            type="button"
                            className="mr-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <span className="sr-only">إغلاق الشريط الجانبي</span>
                            <XIcon className="h-6 w-6 text-white" aria-hidden="true" />
                        </button>
                    </div>
                    {sidebarHeader}
                    {navLinks}
                </div>
                <div className="w-14 flex-shrink-0" aria-hidden="true"></div>
            </div>
            {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)}></div>}

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex lg:flex-col w-64 bg-white dark:bg-slate-800 border-r dark:border-gray-700">
                {sidebarHeader}
                <div className="flex-1 overflow-y-auto">
                   {navLinks}
                </div>
            </aside>
        </>
    );
};

export default Sidebar;