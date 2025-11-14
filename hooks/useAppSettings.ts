import React, { createContext, useState, useContext, useEffect, useMemo, ReactNode } from 'react';

// FIX: Added appLogo to the AppSettings interface to support logo customization.
interface AppSettings {
    appName: string;
    appLogo: string;
}

// FIX: Added setAppLogo to the context type to allow updating the application logo.
interface AppSettingsContextType {
    settings: AppSettings;
    setAppName: (name: string) => void;
    setAppLogo: (logo: string) => void;
}

export const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

const getInitialSettings = (): AppSettings => {
    // FIX: Added appLogo to the default settings and load it from localStorage.
    const defaultSettings: AppSettings = {
        appName: 'Clinic Key',
        appLogo: '/assets/logo.svg',
    };
    try {
        const savedSettings = localStorage.getItem('appSettings');
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            return { 
                appName: parsed.appName || defaultSettings.appName,
                appLogo: parsed.appLogo || defaultSettings.appLogo
            };
        }
    } catch (error) {
        console.error("Could not parse app settings from localStorage", error);
    }
    return defaultSettings;
};

export const AppSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<AppSettings>(getInitialSettings);

    useEffect(() => {
        try {
            localStorage.setItem('appSettings', JSON.stringify(settings));
            document.title = settings.appName;
        } catch (error) {
            console.error("Could not save app settings to localStorage", error);
        }
    }, [settings]);

    const setAppName = (name: string) => {
        setSettings(prev => ({ ...prev, appName: name }));
    };

    // FIX: Implemented setAppLogo to update the logo in the application state.
    const setAppLogo = (logo: string) => {
        setSettings(prev => ({ ...prev, appLogo: logo }));
    };

    // FIX: Provided setAppLogo through the context value.
    const value = useMemo(() => ({ settings, setAppName, setAppLogo }), [settings]);

    return React.createElement(AppSettingsContext.Provider, { value }, children);
};

export const useAppSettings = () => {
    const context = useContext(AppSettingsContext);
    if (context === undefined) {
        throw new Error('useAppSettings must be used within an AppSettingsProvider');
    }
    return context;
};
