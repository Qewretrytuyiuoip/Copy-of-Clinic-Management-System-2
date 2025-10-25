import React, { useState, useMemo } from 'react';
import { User, UserRole } from './types';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import { AppSettingsProvider } from './hooks/useAppSettings';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import Layout from './components/layout/Layout';
import PatientsPage from './pages/PatientsPage';
import UsersPage from './pages/UsersPage';
import AppointmentsPage from './pages/AppointmentsPage';
import PaymentsPage from './pages/PaymentsPage';
import DoctorSchedulePage from './pages/DoctorSchedulePage';
import DoctorSettingsPage from './pages/DoctorSettingsPage';
import TreatmentsSettingsPage from './pages/TreatmentsSettingsPage';
import StatisticsPage from './pages/StatisticsPage';
import ProfilePage from './pages/DoctorsPage'; // Re-use DoctorsPage file for ProfilePage

const AppContent: React.FC = () => {
    const { user } = useAuth();
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    if (!user) {
        return <LoginPage />;
    }

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard':
                return <DashboardPage user={user} refreshTrigger={refreshTrigger} />;
            case 'patients':
                return <PatientsPage user={user} refreshTrigger={refreshTrigger} />;
            case 'users':
                return (user.role === UserRole.Admin || user.role === UserRole.SubManager) ? <UsersPage refreshTrigger={refreshTrigger} /> : <div>الوصول مرفوض</div>;
            case 'appointments':
                return <AppointmentsPage user={user} refreshTrigger={refreshTrigger} />;
            case 'payments':
                 return (user.role === UserRole.Admin || user.role === UserRole.Secretary || user.role === UserRole.SubManager) ? <PaymentsPage user={user} refreshTrigger={refreshTrigger} /> : <div>الوصول مرفوض</div>;
            case 'treatments_settings':
                return (user.role === UserRole.Admin || user.role === UserRole.SubManager) ? <TreatmentsSettingsPage refreshTrigger={refreshTrigger} /> : <div>الوصول مرفوض</div>;
            case 'statistics':
                return (user.role === UserRole.Admin || user.role === UserRole.SubManager) ? <StatisticsPage refreshTrigger={refreshTrigger} /> : <div>الوصول مرفوض</div>;
            case 'schedule':
                return user.role === UserRole.Doctor ? <DoctorSchedulePage user={user} refreshTrigger={refreshTrigger} /> : <div>الوصول مرفوض</div>;
            case 'settings':
                return user.role === UserRole.Doctor ? <DoctorSettingsPage user={user} refreshTrigger={refreshTrigger} /> : <div>الوصول مرفوض</div>;
            case 'profile':
                return <ProfilePage />;
            default:
                return <DashboardPage user={user} refreshTrigger={refreshTrigger} />;
        }
    };
    
    return (
        <Layout user={user} currentPage={currentPage} setCurrentPage={setCurrentPage} onRefresh={handleRefresh}>
            {renderPage()}
        </Layout>
    );
};

const App: React.FC = () => {
    return (
        <ThemeProvider>
            <AuthProvider>
                <AppSettingsProvider>
                    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
                        <AppContent />
                    </div>
                </AppSettingsProvider>
            </AuthProvider>
        </ThemeProvider>
    );
};

export default App;