import React, { Fragment, useState, useEffect, useMemo } from 'react';
import { User, UserRole } from '../../types';
import { NAV_ITEMS } from '../../constants';
import { XIcon, BellIcon, BellSlashIcon, CheckIcon } from '../Icons';
import { appSettings } from '../../appSettings';
import LoadingSpinner from '../LoadingSpinner';
import { API_BASE_URL } from '../../appSettings';
import { useAppSettings } from '../../hooks/useAppSettings';

interface SidebarProps {
    user: User;
    currentPage: string;
    setCurrentPage: (page: string) => void;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

const PUBLIC_VAPID_KEY = 'BHaNdTdoCkF0IzrmmhbuuggJllWdP3JQIKdpChIhangVyCWH0rcMs3XXH8YsI61_lkrZ23RpwWW8V5hafK7hYnA';

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

const Sidebar: React.FC<SidebarProps> = ({ user, currentPage, setCurrentPage, sidebarOpen, setSidebarOpen }) => {
    const baseNavItems = NAV_ITEMS[user.role];
    const { settings } = useAppSettings();

    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscriptionLoading, setSubscriptionLoading] = useState(true);
    const [isSupported, setIsSupported] = useState(false);
    
    const navItems = useMemo(() => {
        if (user.role === UserRole.Doctor || user.role === UserRole.Secretary || user.role === UserRole.SubManager) {
            const hasFinancialPermission = user.permissions?.some(p => p.name === 'financial_management');
            if (!hasFinancialPermission) {
                return baseNavItems.filter(item => item.page !== 'payments');
            }
        }
        return baseNavItems;
    }, [user, baseNavItems]);


    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            setPermissionStatus(Notification.permission);
            navigator.serviceWorker.ready.then(reg => {
                reg.pushManager.getSubscription().then(sub => {
                    if (sub && !(sub.expirationTime && Date.now() > sub.expirationTime - 5 * 60 * 1000)) {
                        setIsSubscribed(true);
                    }
                    setSubscriptionLoading(false);
                });
            });
        } else {
            setSubscriptionLoading(false);
        }
    }, []);

   const handleToggleSubscription = async () => {
    if (Notification.permission === 'denied') {
        alert('تم حظر الإشعارات. يرجى تغيير الإعدادات في متصفحك.');
        return;
    }

    setSubscriptionLoading(true);

    try {
        const reg = await navigator.serviceWorker.ready;
        const currentSubscription = await reg.pushManager.getSubscription();

        if (currentSubscription) {
            // إلغاء الاشتراك
            await currentSubscription.unsubscribe();

            // حذف الاشتراك من الـ backend
            await fetch(`${API_BASE_URL}delete-subscription`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint: currentSubscription.endpoint })
            });

            console.log('Unsubscribed successfully.');
            setIsSubscribed(false);
        } else {
            // عمل subscribe جديد
            const subscription = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
            });

            // إرسال الاشتراك للـ backend لحفظه
           const saveResponse = await fetch(`${API_BASE_URL}save-subscription`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                endpoint: subscription.endpoint,
                keys: {
                  p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
                  auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
                },
                user_id: user.id,
                encoding: 'aesgcm',
              })
            });
            
            if (!saveResponse.ok) {
                throw new Error(`Failed to save subscription on server: ${saveResponse.statusText}`);
            }

            const saveData = await saveResponse.json();
            if (!saveData.success) {
                throw new Error('Backend failed to save subscription.');
            }


            console.log('Subscribed successfully:', JSON.stringify(subscription));
            setIsSubscribed(true);
        }
    } catch(err) {
        console.error('Failed to subscribe/unsubscribe', err);
        alert('فشل في تحديث حالة الإشعارات. الرجاء المحاولة مرة أخرى.');
    } finally {
        setSubscriptionLoading(false);
    }
};


    const renderNotificationButton = () => {
        if (!isSupported) {
            return null;
        }

        if (subscriptionLoading) {
            return (
                 <div className="flex items-center mt-4 py-2 px-6 text-gray-600 dark:text-gray-300">
                    <LoadingSpinner className="h-6 w-6" />
                    <span className="mx-3">جاري التحميل...</span>
                </div>
            )
        }
        
        if (permissionStatus === 'denied') {
            return (
                <div
                    className="flex items-center mt-4 py-2 px-6 text-red-600 dark:text-red-400 cursor-help"
                    title="تم حظر الإشعارات. يرجى تغيير الإعدادات في متصفحك."
                >
                    <BellSlashIcon className="h-6 w-6" />
                    <span className="mx-3">الإشعارات محظورة</span>
                </div>
            );
        }

        const buttonText = isSubscribed ? 'إيقاف الإشعارات' : 'تفعيل الإشعارات';
        const Icon = isSubscribed ? BellSlashIcon : BellIcon;
        const hoverClasses = isSubscribed 
            ? 'hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400' 
            : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300';

        return (
             <a
                href="#"
                onClick={(e) => {
                    e.preventDefault();
                    handleToggleSubscription();
                }}
                className={`flex items-center mt-4 py-2 px-6 rounded-md transition-colors duration-200 ${hoverClasses}`}
            >
                <Icon className="h-6 w-6" />
                <span className="mx-3">{buttonText}</span>
            </a>
        );
    };

    const handleNavigation = (page: string) => {
        setCurrentPage(page);
        setSidebarOpen(false);
    }
    
    const sidebarHeader = (
        <div className="flex items-center justify-between lg:justify-center h-20 border-b dark:border-gray-700 px-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <img src={settings.appLogo} alt="شعار التطبيق" className="h-10 w-10" />
                <h1 className="text-xl font-bold text-primary truncate">{settings.appName}</h1>
            </div>
            <button
                type="button"
                className="lg:hidden p-2 -mr-2 text-gray-500 dark:text-gray-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setSidebarOpen(false)}
            >
                <span className="sr-only">إغلاق الشريط الجانبي</span>
                <XIcon className="h-6 w-6" aria-hidden="true" />
            </button>
        </div>
    );

    const contactItem = navItems.find(item => item.page === 'contact');
    const mainNavItems = navItems.filter(item => item.page !== 'contact');

    const navLinks = (
        <nav className="mt-8 px-2">
            {mainNavItems.map((item) => (
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
            {(contactItem || isSupported) && (
                <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                    {contactItem && (
                        <a
                            key={contactItem.name}
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                handleNavigation(contactItem.page);
                            }}
                            className={`flex items-center py-2 px-6 rounded-md transition-colors duration-200 ${
                                currentPage === contactItem.page
                                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                        >
                            <contactItem.icon className="h-6 w-6" />
                            <span className="mx-3">{contactItem.name}</span>
                        </a>
                    )}
                    {isSupported && renderNotificationButton()}
                </div>
            )}
        </nav>
    );

    return (
        <>
            {/* Mobile Sidebar with Overlay */}
            <div className={`fixed inset-0 z-30 flex transition-transform duration-300 lg:hidden ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="relative flex w-64 max-w-xs flex-1 flex-col bg-white dark:bg-slate-800">
                    {sidebarHeader}
                    <div className="flex-1 overflow-y-auto">
                        {navLinks}
                    </div>
                    <div className="p-4 text-center text-xs text-gray-500 dark:text-gray-400">
                        الإصدار {appSettings.appVersion}
                    </div>
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
                <div className="p-4 text-center text-xs text-gray-500 dark:text-gray-400">
                    الإصدار {appSettings.appVersion}
                </div>
            </aside>
        </>
    );
};

export default Sidebar;