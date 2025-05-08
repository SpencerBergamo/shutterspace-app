import { createContext } from 'react';
import { User } from '../types/User';



interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signInWithApple: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);