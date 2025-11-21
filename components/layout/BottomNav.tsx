import React, { useMemo } from 'react';
import { User, UserRole } from '../../types';
import { NAV_ITEMS } from '../../constants';

interface BottomNavProps {
    user: User;
    currentPage: string;
    setCurrentPage: (page: string) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ user, currentPage, setCurrentPage }) => {
    const navItems = useMemo(() => {
        let items = NAV_ITEMS[user.role];

        // Default filter: remove profile page
        items = items.filter(item => item.page !== 'profile');

        // Filter center page for Admin role from bottom bar
        if (user.role === UserRole.Admin) {
            items = items.filter(item => item.page !== 'center');
        }

        // Filter contact page for specific roles
        if (user.role === UserRole.Doctor || user.role === UserRole.Secretary || user.role === UserRole.Admin) {
            items = items.filter(item => item.page !== 'contact');
        }

        // Conditionally filter payments
        if (user.role === UserRole.Doctor) {
            // For doctors, hide if they HAVE financial permission (they get button on patient card instead)
            const hasFinancialPermission = user.permissions?.some(p => p.name === 'financial_management');
            if (hasFinancialPermission) {
                items = items.filter(item => item.page !== 'payments');
            }
        } else if (user.role === UserRole.Secretary || user.role === UserRole.SubManager) {
            // For others, hide if they DON'T have financial permission
            const hasFinancialPermission = user.permissions?.some(p => p.name === 'financial_management');
            if (!hasFinancialPermission) {
                items = items.filter(item => item.page !== 'payments');
            }
        }
        
        return items;
    }, [user]);


    return (
        <div className="lg:hidden fixed bottom-0 left-0 z-50 w-full">
            {/* Glassmorphism Container */}
            <div className="relative bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.1)] pb-safe">
                <div className="flex justify-around items-center h-[60px] px-2">
                    {navItems.slice(0, 5).map((item) => {
                        const isActive = currentPage === item.page;
                        return (
                            <button
                                key={item.name}
                                type="button"
                                onClick={() => setCurrentPage(item.page)}
                                className="relative flex flex-col items-center justify-center w-full h-full group outline-none"
                            >
                                {/* Animated Icon Container */}
                                <span
                                    className={`absolute transition-all duration-500 ease-in-out rounded-2xl flex items-center justify-center
                                        ${isActive
                                            ? '-top-5 w-12 h-12 bg-primary shadow-lg shadow-primary/40 rotate-6 scale-110' // Active: Float up, Color, Shadow, Tilt
                                            : 'top-2 w-8 h-8 bg-transparent' // Inactive: Sits inside
                                        }
                                    `}
                                >
                                    <item.icon
                                        className={`w-6 h-6 transition-all duration-300
                                            ${isActive 
                                                ? 'text-white -rotate-6' 
                                                : 'text-gray-400 dark:text-gray-500 group-hover:text-primary dark:group-hover:text-primary-400'
                                            }
                                        `}
                                    />
                                </span>

                                {/* Animated Label */}
                                <span
                                    className={`absolute bottom-1 text-[10px] font-bold transition-all duration-300
                                        ${isActive
                                            ? 'text-primary dark:text-primary-400 opacity-100 translate-y-0'
                                            : 'text-gray-400 opacity-0 translate-y-4'
                                        }
                                    `}
                                >
                                    {item.name}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default BottomNav;