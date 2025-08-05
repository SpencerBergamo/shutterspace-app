/**
 * @fileoverview Firebase Authentication Context
 * @author Spencer Bergamo
 * @created 2025-08-04
 * 
 * Documentation Reference:
 * - React Native Firebase Auth: https://rnfirebase.io/auth/usage
 */

import auth, { AppleAuthProvider, FirebaseAuthTypes, GoogleAuthProvider, getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

// Define what's available in the context
interface AuthContextType {
    user: FirebaseAuthTypes.User | null;

    // -- Auth Methods --
    signUpWithPassword: (email: string, password: string) => Promise<void>;
    signInWithPassword: (email: string, password: string) => Promise<void>;
    signInAnonymously: () => Promise<void>;
    signInWithGoogle: (idToken: string) => Promise<void>;
    signInWithApple: (idToken: string) => Promise<void>;
    // updateEmail: (email: string) => Promise<void>;
    // updatePassword: (password: string) => Promise<void>;
    signOut: () => Promise<void>;
    deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    function handleAuthStateChanged(user: FirebaseAuthTypes.User | null) {
        setUser(user);
        setIsLoading(false);
    }

    const fetchAccessToken = useCallback(async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
        if (!user) return null;

        return await user.getIdToken(forceRefreshToken);
    }, [user]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(getAuth(), handleAuthStateChanged);
        return unsubscribe;
    }, []);


    const signUpWithPassword = async (email: string, password: string) => {
        try {
            await auth().createUserWithEmailAndPassword(email, password);
        } catch (error) {
            console.error('Sign up error:', error);
            throw error;
        }
    };

    const signInWithPassword = async (email: string, password: string) => {
        try {
            await auth().signInWithEmailAndPassword(email, password);
        } catch (error) {
            console.error('Sign in error:', error);
            throw error;
        }
    };

    const signInAnonymously = async () => {
        try {
            await auth().signInAnonymously();
        } catch (e) {
            console.error('Sign in anonymously error:', e);
            throw e;
        }
    }

    const signInWithGoogle = async (idToken: string) => {
        try {
            await auth().signInWithCredential(GoogleAuthProvider.credential(idToken));
        } catch (e) {
            console.error('Sign in with Google error:', e);
            throw e;
        }
    }

    const signInWithApple = async (idToken: string) => {
        try {
            await auth().signInWithCredential(AppleAuthProvider.credential(idToken));
        } catch (e) {
            console.error('Sign in with Apple error:', e);
            throw e;
        }
    };

    const signOut = async () => {
        try {
            await auth().signOut();
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    };

    const deleteAccount = async () => {
        try {
            await auth().currentUser?.delete();
        } catch (e) {
            console.error('Delete account error:', e);
            throw e;
        }
    };

    const contextValue = {
        user,


        // -- Auth Methods --
        signInWithPassword,
        signUpWithPassword,
        signInAnonymously,
        signInWithGoogle,
        signInWithApple,
        signOut,
        deleteAccount,
    }

    return (
        <AuthContext.Provider value={contextValue}>
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
