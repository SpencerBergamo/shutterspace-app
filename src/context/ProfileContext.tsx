import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Profile } from "@/src/types/Profile";
import { getAuth } from "@react-native-firebase/auth";
import { useAction, useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

interface ProfileContextType {
    profile: Profile;
    profileId: Id<'profiles'>;
    isLoading: boolean;
    createNewShareCode: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export const ProfileProvider = ({ children }: {
    children: React.ReactNode;
}) => {

    // Get Auth
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) return null;

    // State
    const [isCreatingProfile, setIsCreatingProfile] = useState(false);

    // Convex
    const profile = useQuery(api.profile.getProfile);
    const createProfile = useMutation(api.profile.createProfile);
    const createShareCode = useAction(api.shareCodes.createShareCode);

    const createNewShareCode = useCallback(async () => {
        try {
            await createShareCode();
        } catch (e) {
            console.error("failed creating new share code", e);
            throw new Error("Failed to create new share code");
        }
    }, []);

    useEffect(() => {
        if (profile === undefined) return;

        if (profile && !profile.shareCode) {
            createNewShareCode();
        }

        if (profile === null && !isCreatingProfile) {
            setIsCreatingProfile(true);

            (async () => {
                try {
                    let provider: 'email' | 'google' | 'apple';
                    const data = currentUser.providerData[0];

                    if (data.providerId === 'google.com') {
                        provider = 'google';
                    } else if (data.providerId === 'apple.com') {
                        provider = 'apple';
                    } else {
                        provider = 'email';
                    }

                    await createProfile({
                        nickname: currentUser.displayName ?? undefined,
                        authProvider: provider,
                    });
                    // After creation, Convex query will re-run and profile will be populated
                } catch (e) {
                    console.error("failed to create new profile", e);
                    setIsCreatingProfile(false);
                } finally {
                    setIsCreatingProfile(false);
                }
            })();
        }
    }, [profile, currentUser, createProfile, isCreatingProfile]);

    useEffect(() => {
        if (profile === null && !isCreatingProfile) {
            router.replace('/welcome');
        }
    }, [profile, isCreatingProfile]);

    if (profile === undefined || isCreatingProfile) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="black" />
            </View>
        );
    }

    if (profile === null) {
        return null;
    }

    return <ProfileContext.Provider value={{
        profile,
        profileId: profile._id,
        isLoading: false,
        createNewShareCode,
    }}>
        {children}
    </ProfileContext.Provider>;
}

export function useProfile() {
    const context = useContext(ProfileContext);
    if (!context) {
        throw new Error('useProfile must be used within a ProfileProvider');
    }
    return context;
}