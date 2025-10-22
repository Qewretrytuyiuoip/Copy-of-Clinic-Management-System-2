import React, { useState, useMemo } from 'react';
import { User, UserRole } from './types';
import { AuthContext, AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import Layout from './components/layout/Layout';
import PatientsPage from './pages/PatientsPage';
import DoctorsPage from './pages/DoctorsPage';
import SecretariesPage from './pages/SecretariesPage';
import AppointmentsPage from './pages/AppointmentsPage';
import PaymentsPage from './pages/PaymentsPage';
import DoctorSchedulePage from './pages/DoctorSchedulePage';
import DoctorSettingsPage from './pages/DoctorSettingsPage';
import TreatmentsSettingsPage from './pages/TreatmentsSettingsPage';
import StatisticsPage from './pages/StatisticsPage';

const AppContent: React.FC = () => {
    const { user } = useAuth();
    const [currentPage, setCurrentPage] = useState('dashboard');

    if (!user) {
        return <LoginPage />;
    }

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard':
                return <DashboardPage user={user} />;
            case 'patients':
                return <PatientsPage user={user} />;
            case 'doctors':
                return user.role === UserRole.Admin ? <DoctorsPage /> : <div>الوصول مرفوض</div>;
            case 'secretaries':
                return user.role === UserRole.Admin ? <SecretariesPage /> : <div>الوصول مرفوض</div>;
            case 'appointments':
                return <AppointmentsPage user={user} />;
            case 'payments':
                 return (user.role === UserRole.Admin || user.role === UserRole.Secretary) ? <PaymentsPage user={user} /> : <div>الوصول مرفوض</div>;
            case 'treatments_settings':
                return user.role === UserRole.Admin ? <TreatmentsSettingsPage /> : <div>الوصول مرفوض</div>;
            case 'statistics':
                return user.role === UserRole.Admin ? <StatisticsPage /> : <div>الوصول مرفوض</div>;
            case 'schedule':
                return user.role === UserRole.Doctor ? <DoctorSchedulePage user={user} /> : <div>الوصول مرفوض</div>;
            case 'settings':
                return user.role === UserRole.Doctor ? <DoctorSettingsPage user={user} /> : <div>الوصول مرفوض</div>;
            default:
                return <DashboardPage user={user} />;
        }
    };
    
    return (
        <Layout user={user} currentPage={currentPage} setCurrentPage={setCurrentPage}>
            {renderPage()}
        </Layout>
    );
};

const App: React.FC = () => {
    return (
        <ThemeProvider>
            <AuthProvider>
                <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
                    <AppContent />
                </div>
            </AuthProvider>
        </ThemeProvider>
    );
};

export default App;