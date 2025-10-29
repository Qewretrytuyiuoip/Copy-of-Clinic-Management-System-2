

import React, { useState, useMemo, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Patient, User, UserRole } from './types';
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
import StatisticsPage from './pages/StatisticsPage';
import ProfilePage from './pages/ProfilePage';
import PatientSessionsPage from './pages/PatientSessionsPage';
import PatientPlanPage from './pages/PatientPlanPage';
import PatientDetailsPage from './pages/PatientDetailsPage';
import PatientFinancialPage from './pages/PatientFinancialPage';
import PatientPhotosPage from './pages/PatientPhotosPage';
import PatientActivityLogPage from './pages/PatientActivityLogPage';
import { api } from './services/api';
import { CenteredLoadingSpinner } from './components/LoadingSpinner';

const queryClient = new QueryClient();

const AppContent: React.FC = () => {
    const { user, isLoading } = useAuth();
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [activePatient, setActivePatient] = useState<Patient | null>(null);
    const [doctors, setDoctors] = useState<User[]>([]);

    useEffect(() => {
        const fetchDoctors = async () => {
            if (user) {
                const fetchedDoctors = await api.doctors.getAll();
                setDoctors(fetchedDoctors);
            }
        };
        fetchDoctors();
    }, [user, refreshTrigger]);


    const handleRefresh = () => {
        queryClient.invalidateQueries();
        api.cache.invalidateAll();
        setRefreshTrigger(prev => prev + 1);
    };

    const handleNavigation = (page: string) => {
        setActivePatient(null); // Reset active patient when changing main pages
        setCurrentPage(page);
    };

    const handleViewPatientSessions = (patient: Patient) => {
        setActivePatient(patient);
        setCurrentPage('sessions');
    };
    
    const handleViewPatientPlan = (patient: Patient) => {
        setActivePatient(patient);
        setCurrentPage('plan');
    };

    const handleViewPatientDetails = (patient: Patient) => {
        setActivePatient(patient);
        setCurrentPage('details');
    };

    const handleViewPatientFinancial = (patient: Patient) => {
        setActivePatient(patient);
        setCurrentPage('financial');
    };

    const handleViewPatientPhotos = (patient: Patient) => {
        setActivePatient(patient);
        setCurrentPage('photos');
    };
    
    const handleViewPatientActivity = (patient: Patient) => {
        setActivePatient(patient);
        setCurrentPage('activity');
    };

    if (isLoading) {
        return <CenteredLoadingSpinner containerClassName="min-h-screen" />;
    }

    if (!user) {
        return <LoginPage />;
    }

    const renderPage = () => {
        const patientsPageProps = {
            user: user,
            onViewSessions: handleViewPatientSessions,
            onViewPlan: handleViewPatientPlan,
            onViewDetails: handleViewPatientDetails,
            onViewFinancial: handleViewPatientFinancial,
            onViewPhotos: handleViewPatientPhotos,
            onViewActivity: handleViewPatientActivity,
        };
        const fallback = <PatientsPage {...patientsPageProps} />;

        switch (currentPage) {
            case 'dashboard':
                return <DashboardPage user={user} refreshTrigger={refreshTrigger} />;
            case 'patients':
                return <PatientsPage {...patientsPageProps} />;
            case 'sessions':
                return activePatient 
                    ? <PatientSessionsPage patient={activePatient} user={user} onBack={() => handleNavigation('patients')} refreshTrigger={refreshTrigger} />
                    : fallback;
            case 'plan':
                return activePatient 
                    ? <PatientPlanPage patient={activePatient} user={user} onBack={() => handleNavigation('patients')} doctors={doctors} refreshTrigger={refreshTrigger} />
                    : fallback;
            case 'details':
                return activePatient 
                    ? <PatientDetailsPage patient={activePatient} doctors={doctors} onBack={() => handleNavigation('patients')} refreshTrigger={refreshTrigger} /> 
                    : fallback;
            case 'financial':
                return activePatient 
                    ? <PatientFinancialPage patient={activePatient} onBack={() => handleNavigation('patients')} refreshTrigger={refreshTrigger} />
                    : fallback;
            case 'photos':
                return activePatient
                    ? <PatientPhotosPage patient={activePatient} onBack={() => handleNavigation('patients')} refreshTrigger={refreshTrigger} />
                    : fallback;
            case 'activity':
                 return activePatient
                    ? <PatientActivityLogPage patient={activePatient} onBack={() => handleNavigation('patients')} refreshTrigger={refreshTrigger} />
                    : fallback;
            case 'users':
                return (user.role === UserRole.Admin || user.role === UserRole.SubManager) ? <UsersPage refreshTrigger={refreshTrigger} /> : <div>الوصول مرفوض</div>;
            case 'appointments':
                return <AppointmentsPage user={user} refreshTrigger={refreshTrigger} />;
            case 'payments':
                 return (user.role === UserRole.Admin || user.role === UserRole.Secretary || user.role === UserRole.SubManager) ? <PaymentsPage user={user} refreshTrigger={refreshTrigger} /> : <div>الوصول مرفوض</div>;
            case 'statistics':
                return (user.role === UserRole.Admin || user.role === UserRole.SubManager) ? <StatisticsPage refreshTrigger={refreshTrigger} /> : <div>الوصول مرفوض</div>;
            case 'schedule':
                return user.role === UserRole.Doctor ? <DoctorSchedulePage user={user} refreshTrigger={refreshTrigger} /> : <div>الوصول مرفوض</div>;
            case 'profile':
                return <ProfilePage refreshTrigger={refreshTrigger} />;
            default:
                return <DashboardPage user={user} refreshTrigger={refreshTrigger} />;
        }
    };
    
    return (
        <Layout user={user} currentPage={currentPage} setCurrentPage={handleNavigation} onRefresh={handleRefresh}>
            {renderPage()}
        </Layout>
    );
};

const App: React.FC = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <AuthProvider>
                    <AppSettingsProvider>
                        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
                            <AppContent />
                        </div>
                    </AppSettingsProvider>
                </AuthProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
};

export default App;