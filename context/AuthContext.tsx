import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
    email: string;
    role: 'admin' | 'student';
    displayName: string;
}

const CREDENTIALS: Record<string, { password: string; user: User }> = {
    'admin@campus.ma': {
        password: 'admin123',
        user: { email: 'admin@campus.ma', role: 'admin', displayName: 'Administrateur' },
    },
    'etudiant@campus.ma': {
        password: 'etudiant123',
        user: { email: 'etudiant@campus.ma', role: 'student', displayName: 'Étudiant' },
    },
};

const SESSION_KEY = 'campus_session';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const stored = await AsyncStorage.getItem(SESSION_KEY);
                if (stored) {
                    setUser(JSON.parse(stored));
                }
            } catch {
                // ignore
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    const login = async (email: string, password: string) => {
        const entry = CREDENTIALS[email.trim().toLowerCase()];
        if (!entry || entry.password !== password) {
            return { success: false, error: 'Email ou mot de passe incorrect.' };
        }
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(entry.user));
        setUser(entry.user);
        return { success: true };
    };

    const logout = async () => {
        await AsyncStorage.removeItem(SESSION_KEY);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
