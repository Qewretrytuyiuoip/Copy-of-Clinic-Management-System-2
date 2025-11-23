import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect } from 'react';
import { User, UserRole, Permission } from '../types';
import { login as apiLogin, logout as apiLogout, getMe as apiGetMe, register as apiRegister, ApiError } from '../services/api';
import { useAppSettings } from './useAppSettings';

class SubscriptionExpiredError extends Error {
    role: UserRole;
    constructor(role: UserRole) {
        super("Subscription has expired.");
        this.name = 'SubscriptionExpiredError';
        this.role = role;
    }
}

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
            const { user: userFromApi, center: centerFromApi, token, permissions, refresh_token, refresh_expires_at } = loginData;

            // Set token early to allow API calls from subscription modal
            localStorage.setItem('authToken', token);
            
            // Save refresh token and its expiry if present
            if (refresh_token) {
                localStorage.setItem('refreshToken', refresh_token);
            }
            if (refresh_expires_at) {
                localStorage.setItem('refreshTokenExpiry', refresh_expires_at);
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0); // Compare dates only, not time
            const subscriptionEndDate = new Date(centerFromApi.subscription_end);

            if (subscriptionEndDate < today) {
                throw new SubscriptionExpiredError(userFromApi.role as UserRole);
            }

            const mappedPermissions: Permission[] = (permissions || []).map((pName: string, index: number) => ({
                id: index, // Placeholder ID
                name: pName,
                display_name: pName === 'financial_management' ? 'الأدارة المالية' : pName.replace(/_/g, ' '),
            }));

            const user: User = {
                id: String(userFromApi.id),
                center_id: userFromApi.center_id,
                name: userFromApi.name,
                email: userFromApi.email,
                role: userFromApi.role as UserRole,
                specialty: userFromApi.specialty,
                is_diagnosis_doctor: userFromApi.is_diagnosis_doctor == 1,
                permissions: mappedPermissions,
            };
            
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
            const { user: userFromApi, center: centerFromApi, token, permissions, refresh_token, refresh_expires_at } = registerData;

            const mappedPermissions: Permission[] = (permissions || []).map((pName: string, index: number) => ({
                id: index, // Placeholder ID
                name: pName,
                display_name: pName === 'financial_management' ? 'الأدارة المالية' : pName.replace(/_/g, ' '),
            }));

            const user: User = {
                id: String(userFromApi.id),
                center_id: userFromApi.center_id,
                name: userFromApi.name,
                email: userFromApi.email,
                role: userFromApi.role as UserRole,
                specialty: userFromApi.specialty,
                is_diagnosis_doctor: userFromApi.is_diagnosis_doctor == 1,
                permissions: mappedPermissions,
            };
            
            localStorage.setItem('authToken', token);
            
            // Save refresh token and its expiry if present
            if (refresh_token) {
                localStorage.setItem('refreshToken', refresh_token);
            }
            if (refresh_expires_at) {
                localStorage.setItem('refreshTokenExpiry', refresh_expires_at);
            }

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