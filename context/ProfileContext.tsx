import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Profile } from "@/types/Profile";
import { getAuth } from "@react-native-firebase/auth";
import { useMutation, useQuery } from "convex/react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

/** createProfileMutation flow
 * - the first execution of useQuery will return null, therefore, the useEffect
 *   will call the mutation to create the profile. After the mutation is executed
 *   successfully, the useEffect will detect the profile, set isLoading to false, 
 *   and the profile will be available to the children.
 */

interface ProfileContextType {
    profile: Profile;
    profileId: Id<'profiles'>;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export const ProfileProvider = ({ children }: {
    children: React.ReactNode;
}) => {

    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) return null;
    const [isLoading, setIsLoading] = useState(true);
    const profile = useQuery(api.profile.getProfile);
    const createProfile = useMutation(api.profile.createProfile);

    console.log(!!profile, !!currentUser);

    const createNewProfile = useCallback(async () => {
        setIsLoading(true);
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
            })
        } catch (e) {
            console.error("failed to create new profile", e);
        } finally {
            setIsLoading(false);
        }
    }, [createProfile]);

    useEffect(() => {
        if (profile === null) {
            setIsLoading(true);
        }

        setIsLoading(false);
    }, [profile, currentUser, createNewProfile]);

    if (isLoading || !profile) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="black" />
            </View>
        );
    }

    return <ProfileContext.Provider value={{
        profile,
        profileId: profile._id,
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