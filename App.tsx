

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Patient, User, UserRole, Session } from './types';
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
import SessionTreatmentsPage from './pages/SessionTreatmentsPage';
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
    const [activeSession, setActiveSession] = useState<Session | null>(null);
    const [doctors, setDoctors] = useState<User[]>([]);
    
    // Back Button Handling States
    const [showExitToast, setShowExitToast] = useState(false);
    const lastBackPressTime = useRef<number>(0);
    const isHandlingBack = useRef(false); // Flag to prevent pushState on back navigation

    useEffect(() => {
        const fetchDoctors = async () => {
            if (user) {
                const fetchedDoctors = await api.doctors.getAll();
                setDoctors(fetchedDoctors);
            }
        };
        fetchDoctors();
    }, [user, refreshTrigger]);

    // Initial History State Setup
    useEffect(() => {
        // Replace the initial state to ensure we have a valid state object
        window.history.replaceState({ page: 'dashboard', patient: null, session: null }, '', '');
    }, []);

    // Sync Browser History with App State
    useEffect(() => {
        if (isHandlingBack.current) {
            isHandlingBack.current = false;
            return;
        }

        const state = { page: currentPage, patient: activePatient, session: activeSession };
        // Only push if it's different from current history state to avoid duplicates
        if (JSON.stringify(window.history.state) !== JSON.stringify(state)) {
            window.history.pushState(state, '', '');
        }
    }, [currentPage, activePatient, activeSession]);

    // Handle Hardware Back Button (popstate)
    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            const now = Date.now();
            
            // If we are at the dashboard and trying to go back (which means exiting)
            if (currentPage === 'dashboard' && (!event.state || event.state.page === 'dashboard')) {
                if (now - lastBackPressTime.current < 2000) {
                    // Double press detected: Allow exit (browser default behavior)
                    // We don't prevent default here, so the browser will close the PWA or go back to previous site
                    return;
                } else {
                    // First press: Prevent exit
                    lastBackPressTime.current = now;
                    setShowExitToast(true);
                    
                    // Push state back to dashboard to cancel the "back" action visually/logically
                    // keeping the user in the app
                    window.history.pushState({ page: 'dashboard', patient: null, session: null }, '', '');
                    
                    setTimeout(() => setShowExitToast(false), 2000);
                    return;
                }
            }

            // Internal Navigation
            if (event.state) {
                isHandlingBack.current = true; // Prevent pushing state again inside useEffect
                
                if (event.state.page) {
                    setCurrentPage(event.state.page);
                }
                if (event.state.patient !== undefined) {
                    setActivePatient(event.state.patient);
                } else {
                    setActivePatient(null);
                }
                if (event.state.session !== undefined) {
                    setActiveSession(event.state.session);
                } else {
                    setActiveSession(null);
                }
            } else {
                // Fallback if state is null (e.g. external link back)
                isHandlingBack.current = true;
                setCurrentPage('dashboard');
                setActivePatient(null);
                setActiveSession(null);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [currentPage]);


    const handleRefresh = () => {
        queryClient.invalidateQueries();
        api.cache.invalidateAll();
        setRefreshTrigger(prev => prev + 1);
    };

    const handleNavigation = (page: string) => {
        setActivePatient(null); // Reset active patient when changing main pages
        setActiveSession(null);
        setCurrentPage(page);
    };

    const handleViewPatientSessions = (patient: Patient) => {
        setActivePatient(patient);
        setCurrentPage('sessions');
    };
    
    const handleViewSessionTreatments = (session: Session) => {
        setActiveSession(session);
        setCurrentPage('treatments');
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
                    ? <PatientSessionsPage patient={activePatient} user={user} onBack={() => handleNavigation('patients')} refreshTrigger={refreshTrigger} onViewTreatments={handleViewSessionTreatments} />
                    : fallback;
            case 'treatments':
                return activePatient && activeSession
                    ? <SessionTreatmentsPage 
                        patient={activePatient}
                        session={activeSession}
                        user={user}
                        onBack={() => {
                            setActiveSession(null);
                            setCurrentPage('sessions');
                        }}
                        refreshTrigger={refreshTrigger}
                      />
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
            
            {/* Exit Toast Notification */}
            {showExitToast && (
                <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-[100] animate-fade-in-up">
                    <div className="bg-slate-800/90 backdrop-blur text-white px-6 py-3 rounded-full shadow-xl text-sm font-medium border border-slate-700">
                        اضغط مرة أخرى للخروج
                    </div>
                </div>
            )}
        </Layout>
    );
};

const App: React.FC = () => {
    useEffect(() => {
        setupSyncListeners();

        let refreshTimeout: ReturnType<typeof setTimeout>;

        const performRefresh = async () => {
            try {
                const newExpiry = await api.refreshToken();
                if (newExpiry) {
                    scheduleTokenRefresh(newExpiry);
                }
            } catch (e) {
                // Retry in 1 minute if refresh fails due to network error
                console.error("Refresh token failed", e);
                refreshTimeout = setTimeout(performRefresh, 60 * 1000);
            }
        };

        const scheduleTokenRefresh = (expiryTimestamp: number) => {
            const now = Date.now();
            const bufferTime = 10 * 60 * 1000; // 10 minutes before expiry
            const timeToExpiry = expiryTimestamp - now;
            
            // Calculate delay: Time until expiry minus 10 minutes buffer
            let delay = timeToExpiry - bufferTime;
            
            if (delay <= 0) {
                // Token is already expired or within the 10 min buffer, refresh immediately
                console.log("Token expiring soon or expired, refreshing immediately...");
                performRefresh();
            } else {
                console.log(`Next token refresh scheduled in ${(delay / 1000 / 60).toFixed(2)} minutes`);
                refreshTimeout = setTimeout(performRefresh, delay);
            }
        };

        // Initial check on app load / reload / PWA start
        const storedRefreshToken = localStorage.getItem('refreshToken');

        if (storedRefreshToken) {
            console.log("App mounted, performing immediate token refresh...");
            performRefresh();
        }

        // Add listener for when the app comes back to foreground (PWA resume)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                const currentRefreshToken = localStorage.getItem('refreshToken');
                if (currentRefreshToken) {
                    console.log("App resumed (visible), performing immediate token refresh...");
                    // Clear any pending scheduled refresh to avoid double calling
                    clearTimeout(refreshTimeout);
                    performRefresh();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

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
            document.removeEventListener('visibilitychange', handleVisibilityChange);
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