import React, { useEffect, useState } from 'react';
import { isUsingMockData, userMockData } from '../config/env';
import { AuthContext } from '../context/AuthContext';
import { User } from '../types/User';

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
        if (isUsingMockData) {
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