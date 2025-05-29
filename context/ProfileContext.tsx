import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Profile } from "@/types/Profile";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from "convex/react";
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";


interface ProfileContextType {
    profile: Profile | null;
    isLoading: boolean;
    error: Error | null;
    updateOptimistically: (update: Partial<Profile>) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const CACHE_KEY = '@profile_cache';

export function ProfileProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // query the profile from convex
    const convexProfile = useQuery(api.profile.getProfile, user ? {
        userId: user.uid as Id<'profiles'>
    } : 'skip');

    useEffect(() => {
        async function loadProfile() {
            if (!user) {
                setProfile(null);
                setIsLoading(false);
                return;
            }

            try {
                const cached = await AsyncStorage.getItem(CACHE_KEY);
                if (cached) {
                    setProfile(JSON.parse(cached));
                }

                if (convexProfile) {
                    setProfile(convexProfile);
                    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(convexProfile));
                }
            } catch (e) {
                setError(e instanceof Error ? e : new Error("Failed to load Profile"));
            } finally { setIsLoading(false); }
        }

        loadProfile();
    }, [user, convexProfile]);

    const updateOptimistically = (updates: Partial<Profile>) => {
        if (!profile) return;

        const updatedProfile = { ...profile, ...updates };
        setProfile(updatedProfile);
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(updatedProfile))
            .catch(e => console.error("Failed to cache profile update: ", e));
    }

    return (<ProfileContext.Provider value={{ profile, isLoading, error, updateOptimistically }}>
        {children}
    </ProfileContext.Provider>);
}

export function useProfile() {
    const context = useContext(ProfileContext);
    if (context === undefined) {
        throw new Error("useProfile must be used within a ProfileProvider");
    }
    return context;
}