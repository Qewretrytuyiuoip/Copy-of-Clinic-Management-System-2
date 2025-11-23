
import React, { useMemo, useState } from 'react';
import { User, UserRole } from '../../types';
import { NAV_ITEMS } from '../../constants';
import { XIcon, BellIcon, BellSlashIcon, ChevronRightIcon, ChevronLeftIcon, PlusIcon } from '../Icons';
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
    const [isCollapsed, setIsCollapsed] = useState(false);

    const [permissionStatus, setPermissionStatus] = React.useState<NotificationPermission>('default');
    const [isSubscribed, setIsSubscribed] = React.useState(false);
    const [subscriptionLoading, setSubscriptionLoading] = React.useState(true);
    const [isSupported, setIsSupported] = React.useState(false);
    
    const canAddPatient = user.role === UserRole.Admin || user.role === UserRole.SubManager || user.permissions?.some(p => p.name === 'add_patient');

    const navItems = useMemo(() => {
        let filteredNavItems = [...baseNavItems];

        if (user.role === UserRole.Doctor) {
            const hasFinancialPermission = user.permissions?.some(p => p.name === 'financial_management');
            if (hasFinancialPermission) {
                filteredNavItems = filteredNavItems.filter(item => item.page !== 'payments');
            }
        } else if (user.role === UserRole.Secretary || user.role === UserRole.SubManager) {
            const hasFinancialPermission = user.permissions?.some(p => p.name === 'financial_management');
            if (!hasFinancialPermission) {
                filteredNavItems = filteredNavItems.filter(item => item.page !== 'payments');
            }
        }

        return filteredNavItems;
    }, [user, baseNavItems]);


    React.useEffect(() => {
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
            await currentSubscription.unsubscribe();
            await fetch(`${API_BASE_URL}delete-subscription`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint: currentSubscription.endpoint })
            });
            setIsSubscribed(false);
        } else {
            const subscription = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
            });

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
        if (!isSupported) return null;

        if (subscriptionLoading) {
            return (
                 <div className={`flex items-center mt-4 py-3 ${isCollapsed ? 'justify-center' : 'px-6'} text-white/50`}>
                    <LoadingSpinner className="h-5 w-5" />
                    {!isCollapsed && <span className="mx-3 text-sm">جاري التحميل...</span>}
                </div>
            )
        }
        
        if (permissionStatus === 'denied') {
            return (
                <div className={`flex items-center mt-4 py-3 ${isCollapsed ? 'justify-center' : 'px-6'} text-red-300/80 cursor-help`} title="تم حظر الإشعارات">
                    <BellSlashIcon className="h-5 w-5" />
                    {!isCollapsed && <span className="mx-3 text-sm">محظورة</span>}
                </div>
            );
        }

        const buttonText = isSubscribed ? 'إيقاف الإشعارات' : 'تفعيل الإشعارات';
        const Icon = isSubscribed ? BellSlashIcon : BellIcon;
        const containerClasses = isSubscribed 
            ? 'bg-red-500/10 text-red-200 hover:bg-red-500/20 border border-red-500/20' 
            : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5';

        return (
             <a
                href="#"
                onClick={(e) => {
                    e.preventDefault();
                    handleToggleSubscription();
                }}
                className={`flex items-center mt-4 py-3 mx-3 rounded-xl transition-all duration-300 backdrop-blur-sm ${containerClasses} ${isCollapsed ? 'justify-center px-0' : 'px-6'}`}
                title={isCollapsed ? buttonText : undefined}
            >
                <Icon className="h-5 w-5" />
                {!isCollapsed && <span className="mx-3 text-sm font-medium">{buttonText}</span>}
            </a>
        );
    };

    const handleNavigation = (page: string) => {
        setCurrentPage(page);
        setSidebarOpen(false);
    }
    
    const toggleCollapse = () => setIsCollapsed(!isCollapsed);

    const sidebarHeader = (
        <div className={`flex items-center ${isCollapsed ? 'justify-center h-20' : 'justify-between h-24 px-6'} mb-2 transition-all duration-300`}>
            <div className={`flex items-center transition-all duration-300 ${isCollapsed ? 'flex-col gap-2' : 'space-x-3 rtl:space-x-reverse'} relative z-10`}>
                <div className="relative flex-shrink-0">
                    {!isCollapsed && <div className="absolute inset-0 bg-blue-400 blur-lg opacity-20 rounded-full"></div>}
                    <img src={settings.appLogo} alt="شعار التطبيق" className={`${isCollapsed ? 'h-10 w-10' : 'h-12 w-12'} relative z-10 drop-shadow-lg transition-all duration-300`} />
                </div>
                <h1 className={`font-bold text-white tracking-wide drop-shadow-md transition-all duration-300 overflow-hidden whitespace-nowrap ${isCollapsed ? 'w-0 opacity-0 h-0' : 'w-auto opacity-100 text-2xl'}`}>
                    {settings.appName}
                </h1>
            </div>
            <button
                type="button"
                className="lg:hidden p-2 -mr-2 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                onClick={() => setSidebarOpen(false)}
            >
                <span className="sr-only">إغلاق الشريط الجانبي</span>
                <XIcon className="h-6 w-6" aria-hidden="true" />
            </button>
        </div>
    );

    const contactItem = navItems.find(item => item.page === 'contact');
    const pricingItem = navItems.find(item => item.page === 'pricing');
    const mainNavItems = navItems.filter(item => item.page !== 'contact' && item.page !== 'pricing');

    // Glassmorphism Item Style
    const getItemClass = (isActive: boolean) => `
        relative flex items-center py-3.5 mx-3 my-1.5 rounded-xl transition-all duration-300 group
        ${isCollapsed ? 'justify-center px-0' : 'px-6'}
        ${isActive 
            ? 'bg-gradient-to-r from-white/20 to-white/5 shadow-[0_0_20px_rgba(255,255,255,0.15)] border border-white/30 text-white backdrop-blur-md' 
            : 'text-white/70 hover:text-white hover:bg-white/10 border border-transparent'
        }
    `;

    const navLinks = (
        <nav className="mt-2 flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(255, 255, 255, 0.2);
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(255, 255, 255, 0.3);
                }
            `}</style>
            
            {/* Compose Button */}
            {canAddPatient && (
                <div className={`mb-6 px-3 transition-all duration-300 ${isCollapsed ? 'flex justify-center' : ''}`}>
                    <button
                        onClick={() => handleNavigation('patients')} // Or trigger a modal directly
                        className={`
                            flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white 
                            shadow-lg shadow-blue-500/30 rounded-xl transition-all duration-300 border border-white/20
                            ${isCollapsed ? 'w-12 h-12 p-0' : 'w-full py-3 px-4'}
                        `}
                        title={isCollapsed ? "إضافة مريض" : undefined}
                    >
                        <PlusIcon className="h-6 w-6" />
                        {!isCollapsed && <span className="mx-2 font-bold tracking-wide">إضافة مريض</span>}
                    </button>
                </div>
            )}

            {mainNavItems.map((item) => {
                const isActive = currentPage === item.page;
                return (
                    <a
                        key={item.name}
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            handleNavigation(item.page);
                        }}
                        className={getItemClass(isActive)}
                        title={isCollapsed ? item.name : undefined}
                    >
                        {/* Glowing Dot for active state */}
                        {isActive && (
                            <span className={`absolute ${isCollapsed ? 'bottom-1 w-1 h-1 left-1/2 -translate-x-1/2 rounded-full' : 'right-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-l-full'} bg-blue-300 shadow-[0_0_10px_rgba(147,197,253,0.8)]`}></span>
                        )}
                        
                        <item.icon className={`h-5 w-5 transition-transform duration-300 ${isActive ? 'scale-110 text-blue-200' : 'group-hover:scale-110'}`} />
                        
                        <span className={`mx-3 font-medium text-sm tracking-wide transition-all duration-300 overflow-hidden whitespace-nowrap ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                            {item.name}
                        </span>
                        
                        {/* Categories Dot Simulation (just decoration) */}
                        {!isCollapsed && isActive && (
                            <span className="absolute left-4 w-1.5 h-1.5 rounded-full bg-blue-400 shadow-sm"></span>
                        )}
                    </a>
                );
            })}
            
            {(contactItem || pricingItem || isSupported) && (
                <div className={`mt-6 pt-6 border-t border-white/10 mx-4 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
                    {!isCollapsed && <p className="px-4 text-xs font-semibold text-white/30 uppercase tracking-wider mb-2">الدعم والإعدادات</p>}
                    {contactItem && (
                        <a
                            key={contactItem.name}
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                handleNavigation(contactItem.page);
                            }}
                            className={getItemClass(currentPage === contactItem.page)}
                            title={isCollapsed ? contactItem.name : undefined}
                        >
                            <contactItem.icon className="h-5 w-5" />
                            {!isCollapsed && <span className="mx-3 font-medium text-sm">{contactItem.name}</span>}
                        </a>
                    )}
                    {pricingItem && (
                        <a
                            key={pricingItem.name}
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                handleNavigation(pricingItem.page);
                            }}
                            className={getItemClass(currentPage === pricingItem.page)}
                            title={isCollapsed ? pricingItem.name : undefined}
                        >
                            <pricingItem.icon className="h-5 w-5" />
                            {!isCollapsed && <span className="mx-3 font-medium text-sm">{pricingItem.name}</span>}
                        </a>
                    )}
                    {isSupported && renderNotificationButton()}
                </div>
            )}
        </nav>
    );

    const SidebarContent = () => (
        <div className="relative flex flex-col h-full overflow-hidden bg-primary/95 dark:bg-slate-900/95 backdrop-blur-2xl border-r border-white/10">
            {/* Content Layer */}
            <div className="relative z-10 flex flex-col h-full">
                {sidebarHeader}
                {navLinks}
                
                {/* Collapse Toggle Button (Desktop Only) */}
                <div className="hidden lg:flex justify-center p-4 border-t border-white/10">
                    <button 
                        onClick={toggleCollapse}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all duration-300 border border-white/5 hover:border-white/20"
                    >
                        {isCollapsed ? <ChevronLeftIcon className="h-5 w-5" /> : <ChevronRightIcon className="h-5 w-5" />}
                    </button>
                </div>

                {!isCollapsed && (
                    <div className="p-4 text-center transition-opacity duration-300">
                        <p className="text-xs text-white/20 font-light tracking-widest">
                            VERSION {appSettings.appVersion}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Sidebar with Overlay */}
            <div className={`fixed inset-0 z-40 flex pointer-events-none lg:hidden`}>
                {/* Overlay */}
                <div 
                    className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
                    onClick={() => setSidebarOpen(false)}
                ></div>
                
                {/* Sidebar Panel Mobile */}
                {/* Changed translate-x-full logic here to slide from the right in RTL mode */}
                <div className={`relative w-72 max-w-[85vw] h-full shadow-2xl transform transition-transform duration-300 ease-out pointer-events-auto ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <SidebarContent />
                </div>
            </div>

            {/* Desktop Sidebar - Dynamic Width */}
            <aside className={`hidden lg:block ${isCollapsed ? 'w-24' : 'w-72'} h-screen sticky top-0 shadow-2xl z-30 transition-all duration-500 ease-in-out`}>
                <SidebarContent />
            </aside>
        </>
    );
};

export default Sidebar;
