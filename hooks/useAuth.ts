import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect } from 'react';
import { User, UserRole } from '../types';
import { login as apiLogin, logout as apiLogout, getMe as apiGetMe } from '../services/api';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<User | null>;
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

    useEffect(() => {
        const checkLoggedIn = async () => {
            const currentUser = await apiGetMe();
            setUser(currentUser);
            setIsLoading(false);
        };
        checkLoggedIn();
    }, []);

    const login = async (email: string, password: string): Promise<User | null> => {
        const loggedInUser = await apiLogin(email, password);
        if (loggedInUser) {
            setLoginSuccessMessage('تم تسجيل الدخول بنجاح!');
            setUser(loggedInUser);
        }
        return loggedInUser;
    };

    const logout = async () => {
        await apiLogout();
        setUser(null);
        localStorage.removeItem('authToken');
    };

    const value = useMemo(() => ({ user, isLoading, login, logout, loginSuccessMessage, setLoginSuccessMessage, setUser }), [user, isLoading, loginSuccessMessage]);

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