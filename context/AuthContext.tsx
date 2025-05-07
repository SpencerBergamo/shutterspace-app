import React, { createContext, useContext, useEffect, useState } from 'react';
import { isUsingMockData, userMockData } from '../config/env';

const USE_MOCK_DATA = __DEV__; // Only use mock data in development


// Define user type
interface User {
    id: string;
    email: string;
    // Add other user profile fields here
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signInWithApple: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isUsingMockData) {
            // Simulate auth state change
            setTimeout(() => {
                setUser(userMockData);
                setLoading(false);
            }, 1000);
        } else {
            // Real implementation
        }
    }, []);

    const signIn = async (email: string, password: string) => {
        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
            setUser(userMockData);
            return;
        }
        // Real implementation
    };

    const signUp = async (email: string, password: string) => {
        // TODO: Implement Firebase email/password sign up
    };

    const signOut = async () => {
        // TODO: Implement Firebase sign out
    };

    const signInWithGoogle = async () => {
        // TODO: Implement Google Sign In
    };

    const signInWithApple = async () => {
        // TODO: Implement Apple Sign In
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                signIn,
                signUp,
                signOut,
                signInWithGoogle,
                signInWithApple,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
} 