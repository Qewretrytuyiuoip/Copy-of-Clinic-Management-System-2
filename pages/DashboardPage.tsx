import React from 'react';
import { User, UserRole } from '../types';
import DashboardAdmin from '../components/dashboards/DashboardAdmin';
import DashboardDoctor from '../components/dashboards/DashboardDoctor';
import DashboardSecretary from '../components/dashboards/DashboardSecretary';

interface DashboardPageProps {
    user: User;
    refreshTrigger: number;
    setCurrentPage: (page: string) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ user, refreshTrigger, setCurrentPage }) => {
    const renderDashboard = () => {
        switch (user.role) {
            case UserRole.Admin:
            case UserRole.SubManager:
                return <DashboardAdmin user={user} refreshTrigger={refreshTrigger} setCurrentPage={setCurrentPage} />;
            case UserRole.Doctor:
                return <DashboardDoctor user={user} refreshTrigger={refreshTrigger} />;
            case UserRole.Secretary:
                return <DashboardSecretary user={user} refreshTrigger={refreshTrigger} />;
            default:
                return <div>مرحباً!</div>;
        }
    };

    return (
        <div>
            {renderDashboard()}
        </div>
    );
};

export default DashboardPage;