import { createContext, useContext, useEffect, useState } from 'react';

// Mock user for demo purposes
interface MockUser {
    email: string;
    uid: string;
}

// Define what's available in the context
interface AuthContextType {
    isLoading: boolean;
    firebaseUser: MockUser | null;
    getToken: (forceRefreshToken?: boolean) => Promise<string | null>;
    signUpWithPassword: (email: string, password: string) => Promise<void>;
    signInWithPassword: (email: string, password: string) => Promise<void>;
    signInAnonymously: () => Promise<void>;
    signInWithGoogle: (idToken: string) => Promise<void>;
    signInWithApple: (idToken: string) => Promise<void>;
    signOut: () => Promise<void>;
    deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    // Mock user for demo purposes - simulate being logged in
    const [firebaseUser, setFirebaseUser] = useState<MockUser | null>({ 
        email: 'demo@shutterspace.com', 
        uid: 'demo-user-123' 
    });
    const [isLoading, setIsLoading] = useState(true);

    const getToken = async (forceRefreshToken = false) => {
        if (!firebaseUser) return null;
        // Return a mock token for demo
        return 'mock-token-123';
    }

    useEffect(() => {
        // Simulate loading time and set user as authenticated
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    const signUpWithPassword = async (email: string, password: string) => {
        // Mock implementation
        console.log('Mock sign up:', email);
    };

    const signInWithPassword = async (email: string, password: string) => {
        // Mock implementation
        console.log('Mock sign in:', email);
    };

    const signInAnonymously = async () => {
        // Mock implementation
        console.log('Mock anonymous sign in');
    }

    const signInWithGoogle = async (idToken: string) => {
        // Mock implementation
        console.log('Mock Google sign in');
    }

    const signInWithApple = async (idToken: string) => {
        // Mock implementation
        console.log('Mock Apple sign in');
    };

    const signOut = async () => {
        // Mock implementation
        console.log('Mock sign out');
        setFirebaseUser(null);
    };

    const deleteAccount = async () => {
        // Mock implementation
        console.log('Mock delete account');
        setFirebaseUser(null);
    };

    if (isLoading) return null;

    return <AuthContext.Provider value={{
        isLoading,
        firebaseUser,
        getToken,
        signInWithPassword,
        signUpWithPassword,
        signInAnonymously,
        signInWithGoogle,
        signInWithApple,
        signOut,
        deleteAccount,
    }}>
        {children}
    </AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
