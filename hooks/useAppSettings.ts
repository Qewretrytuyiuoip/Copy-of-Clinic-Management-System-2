import React, { createContext, useState, useContext, useEffect, useMemo, ReactNode } from 'react';

interface AppSettings {
    appName: string;
    appLogo: string | null;
}

interface AppSettingsContextType {
    settings: AppSettings;
    setAppName: (name: string) => void;
    setAppLogo: (logo: string | null) => void;
}

export const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

const getInitialSettings = (): AppSettings => {
    try {
        const savedSettings = localStorage.getItem('appSettings');
        if (savedSettings) {
            return JSON.parse(savedSettings);
        }
    } catch (error) {
        console.error("Could not parse app settings from localStorage", error);
    }
    return {
        appName: 'كلينك برو',
        appLogo: null,
    };
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

    const setAppLogo = (logo: string | null) => {
        setSettings(prev => ({ ...prev, appLogo: logo }));
    };

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
