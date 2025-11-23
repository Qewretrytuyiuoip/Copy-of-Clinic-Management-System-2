
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
import ContactPage from './pages/ContactPage';
import PricingPage from './pages/PricingPage';
import ActivityArchivesPage from './pages/ActivityArchivesPage';
import CenterPage from './pages/CenterPage';
import { api } from './services/api';
import { CenteredLoadingSpinner } from './components/LoadingSpinner';
import { setupSyncListeners } from './services/sync';
import { playTouchSound } from './services/touchSound';
import PatientActivityLogPage from './pages/PatientActivityLogPage';

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
            refreshTrigger: refreshTrigger,
        };
        const fallback = <PatientsPage {...patientsPageProps} />;

        switch (currentPage) {
            case 'dashboard':
                return <DashboardPage user={user} refreshTrigger={refreshTrigger} setCurrentPage={handleNavigation} />;
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
                    ? <PatientFinancialPage patient={activePatient} user={user} onBack={() => handleNavigation('patients')} refreshTrigger={refreshTrigger} />
                    : fallback;
            case 'photos':
                return activePatient
                    ? <PatientPhotosPage patient={activePatient} user={user} onBack={() => handleNavigation('patients')} refreshTrigger={refreshTrigger} />
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
                return <PaymentsPage user={user} refreshTrigger={refreshTrigger} />;
            case 'statistics':
                return (user.role === UserRole.Admin || user.role === UserRole.SubManager) ? <StatisticsPage refreshTrigger={refreshTrigger} /> : <div>الوصول مرفوض</div>;
            case 'schedule':
                return user.role === UserRole.Doctor ? <DoctorSchedulePage user={user} refreshTrigger={refreshTrigger} /> : <div>الوصول مرفوض</div>;
            case 'profile':
                return <ProfilePage refreshTrigger={refreshTrigger} />;
            case 'center':
                return <CenterPage refreshTrigger={refreshTrigger} />;
            case 'contact':
                return <ContactPage />;
            case 'pricing':
                return (user.role === UserRole.Admin) ? <PricingPage /> : <div>الوصول مرفوض</div>;
            case 'activity-archives':
                return <ActivityArchivesPage onBack={() => handleNavigation('dashboard')} refreshTrigger={refreshTrigger} />;
            default:
                return <DashboardPage user={user} refreshTrigger={refreshTrigger} setCurrentPage={handleNavigation} />;
        }
    };
    
    return (
        <Layout user={user} currentPage={currentPage} setCurrentPage={handleNavigation} onRefresh={handleRefresh}>
            {renderPage()}
        </Layout>
    );
};

const App: React.FC = () => {
    useEffect(() => {
        setupSyncListeners();

        let refreshTimeout: ReturnType<typeof setTimeout>;

        const scheduleTokenRefresh = async () => {
            const expiryTimestamp = await api.refreshToken();
            
            if (expiryTimestamp) {
                const now = Date.now();
                const bufferTime = 15 * 60 * 1000; // 15 minutes before expiry
                const timeToExpiry = expiryTimestamp - now;
                
                // Calculate delay: Time until expiry minus buffer
                // If timeToExpiry is less than buffer (e.g. token valid for 10 mins), 
                // refresh in 1 minute to avoid spamming but ensure we get a new one soon.
                let delay = timeToExpiry - bufferTime;
                
                if (delay <= 0) {
                    delay = 60 * 1000; // Retry/Refresh in 1 minute if close to expiry
                }

                console.log(`Next token refresh scheduled in ${(delay / 1000 / 60).toFixed(2)} minutes`);
                refreshTimeout = setTimeout(scheduleTokenRefresh, delay);
            } else {
                // If refresh failed (e.g. network error), retry in 1 minute
                refreshTimeout = setTimeout(scheduleTokenRefresh, 60 * 1000);
            }
        };

        // Initial call to start the cycle
        scheduleTokenRefresh();


        // Check for mobile/touch device to enable touch sounds
        const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        let interactionHandlerAttached = false;

        const handleInteraction = (event: Event) => {
            let target = event.target as HTMLElement;

            // Bubble up to find an interactive element to play sound for
            while (target && target !== document.body) {
                const tagName = target.tagName.toLowerCase();
                const role = target.getAttribute('role');

                if (
                    tagName === 'button' ||
                    tagName === 'a' ||
                    (tagName === 'input' && ['button', 'submit', 'reset', 'checkbox', 'radio'].includes(target.getAttribute('type') || '')) ||
                    (role === 'button') ||
                    target.hasAttribute('onclick')
                ) {
                    playTouchSound();
                    return; // Play sound once per event bubble
                }
                target = target.parentElement as HTMLElement;
            }
        };

        if (isMobile) {
            document.addEventListener('click', handleInteraction, { capture: true });
            interactionHandlerAttached = true;
        }
        
        return () => {
            if (interactionHandlerAttached) {
                document.removeEventListener('click', handleInteraction, { capture: true });
            }
            clearTimeout(refreshTimeout);
        };
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            <AppSettingsProvider>
                <ThemeProvider>
                    <AuthProvider>
                        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
                            <AppContent />
                        </div>
                    </AuthProvider>
                </ThemeProvider>
            </AppSettingsProvider>
        </QueryClientProvider>
    );
};

export default App;
