
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DoctorsTab from '../components/users/DoctorsTab';
import SecretariesTab from '../components/users/SecretariesTab';
import AdminsTab from '../components/users/AdminsTab';
import { UserGroupIcon, UsersIcon, UserCircleIcon } from '../components/Icons';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';
import { api } from '../services/api';
import { CenteredLoadingSpinner } from '../components/LoadingSpinner';

interface UsersPageProps {
    refreshTrigger: number;
}

const UsersPage: React.FC<UsersPageProps> = ({ refreshTrigger }) => {
    const [activeTab, setActiveTab] = useState('doctors');
    const { user } = useAuth();

    const { data: centerData, isLoading: isLoadingCenter } = useQuery({
        queryKey: ['center', user?.center_id],
        queryFn: () => api.centers.getOne(),
        enabled: !!user?.center_id,
        gcTime: 0,
        staleTime: 0,
    });

    const { data: allUsersCount, isLoading: isLoadingUsers } = useQuery({
        queryKey: ['allUsersCount', refreshTrigger],
        queryFn: async () => {
            const [doctors, secretaries, admins, subManagers] = await Promise.all([
                api.doctors.getAll(),
                api.secretaries.getAll(),
                api.admins.getAll(),
                api.subManagers.getAll(),
            ]);
            return doctors.length + secretaries.length + admins.length + subManagers.length;
        },
        gcTime: 0,
        staleTime: 0,
    });

    const maxUsers = centerData?.max_users ?? 0;
    const canAddUser = maxUsers === 0 || (allUsersCount ?? 0) < maxUsers;

    const isLoading = isLoadingCenter || isLoadingUsers;

    const renderTabContent = () => {
        switch (activeTab) {
            case 'doctors':
                return <DoctorsTab refreshTrigger={refreshTrigger} canAddUser={canAddUser} />;
            case 'secretaries':
                return <SecretariesTab refreshTrigger={refreshTrigger} canAddUser={canAddUser} />;
            case 'admins':
                return <AdminsTab refreshTrigger={refreshTrigger} canAddUser={canAddUser} />;
            default:
                return <DoctorsTab refreshTrigger={refreshTrigger} canAddUser={canAddUser} />;
        }
    };

    const tabs = [
        { id: 'doctors', label: 'الأطباء', icon: UserGroupIcon },
        { id: 'secretaries', label: 'السكرتارية', icon: UsersIcon },
        ...(user && user.role === UserRole.Admin ? [{ id: 'admins', label: 'المدراء', icon: UserCircleIcon }] : []),
    ];

    return (
        <div className="space-y-8">
            {/* Liquid Glass Navigation */}
            <div className="relative p-1.5 bg-gray-200/60 dark:bg-slate-900/60 backdrop-blur-2xl rounded-2xl border border-white/40 dark:border-white/5 shadow-inner mx-auto max-w-3xl">
                <div className="flex relative z-10">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    relative flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold rounded-xl 
                                    transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
                                    ${isActive 
                                        ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] ring-1 ring-black/5 dark:ring-white/10 scale-[1.02] -translate-y-0.5' 
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/40 dark:hover:bg-white/5'
                                    }
                                `}
                            >
                                <tab.icon className={`h-5 w-5 transition-transform duration-500 ${isActive ? 'scale-110 rotate-[-5deg]' : ''}`} />
                                <span className="tracking-wide">{tab.label}</span>
                                {isActive && (
                                    <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-primary-400 dark:bg-primary-500 opacity-80"></span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50 dark:border-white/5 overflow-hidden min-h-[500px]">
                {isLoading ? (
                    <div className="p-12"><CenteredLoadingSpinner /></div>
                ) : (
                    <div>
                        {renderTabContent()}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UsersPage;
