import React from 'react';
import { User, UserRole } from '../types';
import DashboardAdmin from '../components/dashboards/DashboardAdmin';
import DashboardDoctor from '../components/dashboards/DashboardDoctor';
import DashboardSecretary from '../components/dashboards/DashboardSecretary';

interface DashboardPageProps {
    user: User;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ user }) => {
    const renderDashboard = () => {
        switch (user.role) {
            case UserRole.Admin:
                return <DashboardAdmin user={user} />;
            case UserRole.Doctor:
                return <DashboardDoctor user={user} />;
            case UserRole.Secretary:
                return <DashboardSecretary user={user} />;
            default:
                return <div>مرحباً!</div>;
        }
    };

    return (
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">لوحة التحكم</h1>
            {renderDashboard()}
        </div>
    );
};

export default DashboardPage;