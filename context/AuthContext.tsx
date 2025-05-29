import auth, { AppleAuthProvider, FirebaseAuthTypes, GoogleAuthProvider } from '@react-native-firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';

// Define what's available in the context
interface AuthContextType {
    user: FirebaseAuthTypes.User | null;
    loading: boolean;
    signUpWithPassword: (email: string, password: string) => Promise<void>;
    signInWithPassword: (email: string, password: string) => Promise<void>;
    signInAnonymously: () => Promise<void>;
    signInWithGoogle: (idToken: string) => Promise<void>;
    signInWithApple: (idToken: string) => Promise<void>;
    // updateEmail: (email: string) => Promise<void>;
    // updatePassword: (password: string) => Promise<void>;
    deleteAccount: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Subscribe to auth state changes
        const unsubscribe = auth().onAuthStateChanged((user: FirebaseAuthTypes.User | null) => {
            setUser(user);
            setLoading(false);
        });

        // Cleanup subscription
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

    const signOut = async () => {
        try {
            await auth().signOut();
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    };

    // provide the actual implementations and actual firebase calls
    // and the page will use `const {signInWithGoogle} = useAuth()`
    const value = {
        user,
        loading,
        signInWithPassword,
        signUpWithPassword,
        signOut,
        signInAnonymously: async () => {
            try {
                await auth().signInAnonymously();
            } catch (e) {
                console.error('Sign in anonymously error:', e);
                throw e;
            }
        },
        signInWithGoogle: async (idToken: string) => {
            try {
                await auth().signInWithCredential(GoogleAuthProvider.credential(idToken));
            } catch (e) {
                console.error('Sign in with Google error:', e);
                throw e;
            }
        },
        signInWithApple: async (idToken: string) => {
            try {
                await auth().signInWithCredential(AppleAuthProvider.credential(idToken));
            } catch (e) {
                console.error('Sign in with Apple error:', e);
                throw e;
            }
        },

        deleteAccount: async () => {
            try {
                await auth().currentUser?.delete();
            } catch (e) {
                console.error('Delete account error:', e);
                throw e;
            }
        }
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
} 