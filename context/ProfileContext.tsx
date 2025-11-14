import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Profile } from "@/types/Profile";
import { getAuth } from "@react-native-firebase/auth";
import { useMutation, useQuery } from "convex/react";
import { createContext, useContext, useEffect, useState } from "react";
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
    updateProfile: (nickname?: string, base64?: string) => Promise<void>;
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
    const updateProfileMutation = useMutation(api.profile.updateProfile);
    const createProfileMutation = useMutation(api.profile.createProfile);

    useEffect(() => {
        if (!currentUser) return;

        if (profile === null && currentUser) {
            setIsLoading(true);
            createProfileMutation({
                firebaseUID: currentUser.uid,
                email: currentUser.email ?? 'private',
                nickname: currentUser.displayName ?? 'new user',
                avatarUrl: currentUser.photoURL ?? undefined,
            }).catch(e => {
                console.error('Creating Profile (FAILED)', e);
                auth.signOut();
            });
        } else if (profile !== undefined) {
            setIsLoading(false);
        }
    }, [profile, currentUser, createProfileMutation]);

    const updateProfile = async (nickname?: string, base64?: string) => {
        if (!profile) return;

        await updateProfileMutation({
            profileId: profile._id,
            nickname: nickname,
            base64: base64,
        });
    }

    if (isLoading || !profile) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="white" />
            </View>
        );
    }

    return <ProfileContext.Provider value={{
        profile,
        profileId: profile._id,
        updateProfile,
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