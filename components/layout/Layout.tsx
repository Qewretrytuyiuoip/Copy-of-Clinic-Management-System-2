
import React, { useState, useEffect, useMemo } from 'react';
import { User } from '../../types';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { useAuth } from '../../hooks/useAuth';
import { NAV_ITEMS } from '../../constants';
import { WifiIcon, WifiOffIcon } from '../Icons';

interface LayoutProps {
    user: User;
    currentPage: string;
    setCurrentPage: (page: string) => void;
    onRefresh: () => void;
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user, currentPage, setCurrentPage, onRefresh, children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { loginSuccessMessage, setLoginSuccessMessage } = useAuth();
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showOnlineNotification, setShowOnlineNotification] = useState(false);


    useEffect(() => {
        if (loginSuccessMessage) {
            const timer = setTimeout(() => {
                setLoginSuccessMessage(null);
            }, 5000); // Auto-hide after 5 seconds
            return () => clearTimeout(timer);
        }
    }, [loginSuccessMessage, setLoginSuccessMessage]);
    
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowOnlineNotification(true);
            setTimeout(() => setShowOnlineNotification(false), 4000);
        };
        const handleOffline = () => {
            setIsOnline(false);
            setShowOnlineNotification(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const pageTitle = useMemo(() => {
        const specialTitles: { [key: string]: string } = {
            'sessions': 'جلسات المريض',
            'plan': 'خطة العلاج',
            'details': 'تفاصيل المريض',
            'financial': 'البيان المالي للمريض',
            'photos': 'معرض صور المريض',
            'activity-archives': 'أرشيف الأحداث',
        };

        if (specialTitles[currentPage]) {
            return specialTitles[currentPage];
        }
        
        const allNavItems = Object.values(NAV_ITEMS).flat();
        const currentNavItem = allNavItems.find(item => item.page === currentPage);
        return currentNavItem ? currentNavItem.name : '';
    }, [currentPage]);

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
             {/* Network Status Notifications */}
            {!isOnline && (
                <div className="fixed top-0 left-0 w-full bg-red-600 text-white z-[60] p-2 flex items-center justify-center gap-2 shadow-lg animate-slide-down">
                    <WifiOffIcon className="h-5 w-5" />
                    <span className="font-medium text-sm">الاتصال بالانترنت غير متصل</span>
                </div>
            )}
            {isOnline && showOnlineNotification && (
                <div className="fixed top-0 left-0 w-full bg-green-600 text-white z-[60] p-2 flex items-center justify-center gap-2 shadow-lg animate-slide-down">
                    <WifiIcon className="h-5 w-5" />
                    <span className="font-medium text-sm">عاد الاتصال بالانترنت</span>
                </div>
            )}

             {/* Toast Notification */}
            {loginSuccessMessage && (
                <div 
                    className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center w-full max-w-xs p-4 space-x-4 rtl:space-x-reverse text-gray-500 bg-white rounded-lg shadow-lg dark:text-gray-400 dark:bg-gray-800 animate-fade-in" 
                    role="alert"
                >
                    <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-green-500 bg-green-100 rounded-lg dark:bg-green-800 dark:text-green-200">
                        <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"/>
                        </svg>
                        <span className="sr-only">Check icon</span>
                    </div>
                    <div className="text-sm font-normal">{loginSuccessMessage}</div>
                    <button 
                        type="button" 
                        onClick={() => setLoginSuccessMessage(null)} 
                        className="ms-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700" 
                        aria-label="Close"
                    >
                        <span className="sr-only">Close</span>
                        <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                        </svg>
                    </button>
                </div>
            )}

            <Sidebar 
                user={user} 
                currentPage={currentPage} 
                setCurrentPage={setCurrentPage}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />
            <div className={`flex-1 flex flex-col overflow-hidden ${!isOnline || (isOnline && showOnlineNotification) ? 'pt-10' : ''} transition-all duration-300`}>
                <Header user={user} setSidebarOpen={setSidebarOpen} onRefresh={onRefresh} pageName={pageTitle} currentPage={currentPage} isOnline={isOnline} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 md:p-6 pb-20 lg:pb-6">
                    {children}
                </main>
                <BottomNav user={user} currentPage={currentPage} setCurrentPage={setCurrentPage} />
            </div>
        </div>
    );
};

export default Layout;
