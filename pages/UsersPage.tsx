
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DoctorsTab from '../components/users/DoctorsTab';
import SecretariesTab from '../components/users/SecretariesTab';
import AdminsTab from '../components/users/AdminsTab';
import { UserGroupIcon, UsersIcon } from '../components/Icons';
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

    const TabButton = ({ tabName, label, icon: Icon }: { tabName: string, label: string, icon: React.FC<any> }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tabName
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary-300'
            }`}
        >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
        </button>
    );

    return (
        <div>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md">
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <TabButton tabName="doctors" label="الأطباء" icon={UserGroupIcon} />
                    <TabButton tabName="secretaries" label="السكرتارية" icon={UsersIcon} />
                    {user && user.role === UserRole.Admin && (
                        <TabButton tabName="admins" label="المدراء" icon={UsersIcon} />
                    )}
                </div>
                <div>
                    {isLoading ? <div className="p-6"><CenteredLoadingSpinner /></div> : renderTabContent()}
                </div>
            </div>
        </div>
    );
};

export default UsersPage;
