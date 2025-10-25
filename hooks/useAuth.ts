import React, { createContext, useState, useContext, ReactNode, useMemo } from 'react';
import { User, UserRole } from '../types';
import { login as apiLogin, logout as apiLogout } from '../services/api';

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<User | null>;
    logout: () => void;
    loginSuccessMessage: string | null;
    setLoginSuccessMessage: (message: string | null) => void;
    setUser: (user: User | null) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loginSuccessMessage, setLoginSuccessMessage] = useState<string | null>(null);

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

    const value = useMemo(() => ({ user, login, logout, loginSuccessMessage, setLoginSuccessMessage, setUser }), [user, loginSuccessMessage]);

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