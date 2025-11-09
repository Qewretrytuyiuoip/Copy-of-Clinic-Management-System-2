import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect } from 'react';
import { User, UserRole } from '../types';
import { login as apiLogin, logout as apiLogout, getMe as apiGetMe, register as apiRegister, ApiError } from '../services/api';
import { useAppSettings } from './useAppSettings';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<User | null>;
    register: (name: string, email: string, password: string) => Promise<User | null>;
    logout: () => void;
    loginSuccessMessage: string | null;
    setLoginSuccessMessage: (message: string | null) => void;
    setUser: (user: User | null) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loginSuccessMessage, setLoginSuccessMessage] = useState<string | null>(null);
    const { setAppName, setAppLogo } = useAppSettings();

    useEffect(() => {
        const checkLoggedIn = async () => {
            const currentUser = await apiGetMe();
            setUser(currentUser);
            setIsLoading(false);
        };
        checkLoggedIn();
    }, []);

    const login = async (email: string, password: string): Promise<User | null> => {
        const loginData = await apiLogin(email, password);
        if (loginData) {
            const { user: userFromApi, center: centerFromApi, token } = loginData;

            const user: User = {
                id: String(userFromApi.id),
                center_id: userFromApi.center_id,
                name: userFromApi.name,
                email: userFromApi.email,
                role: userFromApi.role as UserRole,
                specialty: userFromApi.specialty,
                is_diagnosis_doctor: userFromApi.is_diagnosis_doctor == 1,
            };
            
            localStorage.setItem('authToken', token);
            localStorage.setItem('currentUser', JSON.stringify(user));
            setUser(user);

            if (centerFromApi && centerFromApi.name && centerFromApi.logo_url) {
                setAppName(centerFromApi.name);
                setAppLogo(centerFromApi.logo_url);
            }
            
            setLoginSuccessMessage('تم تسجيل الدخول بنجاح!');
            return user;
        }
        return null;
    };
    
    const register = async (name: string, email: string, password: string): Promise<User | null> => {
        const registerData = await apiRegister(name, email, password);
        if (registerData) {
            const { user: userFromApi, center: centerFromApi, token } = registerData;

            const user: User = {
                id: String(userFromApi.id),
                center_id: userFromApi.center_id,
                name: userFromApi.name,
                email: userFromApi.email,
                role: userFromApi.role as UserRole,
                specialty: userFromApi.specialty,
                is_diagnosis_doctor: userFromApi.is_diagnosis_doctor == 1,
            };
            
            localStorage.setItem('authToken', token);
            localStorage.setItem('currentUser', JSON.stringify(user));
            setUser(user);

            if (centerFromApi && centerFromApi.name && centerFromApi.logo_url) {
                setAppName(centerFromApi.name);
                setAppLogo(centerFromApi.logo_url);
            }
            
            setLoginSuccessMessage('تم إنشاء الحساب وتسجيل الدخول بنجاح!');
            return user;
        }
        return null;
    };


    const logout = async () => {
        await apiLogout();
        setUser(null);
    };

    const value = useMemo(() => ({ user, isLoading, login, register, logout, loginSuccessMessage, setLoginSuccessMessage, setUser }), [user, isLoading, loginSuccessMessage]);

    // FIX: Reverted to using React.createElement because JSX syntax is not supported in .ts files, which was causing a syntax error.
    return React.createElement(AuthContext.Provider, { value }, children);
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};