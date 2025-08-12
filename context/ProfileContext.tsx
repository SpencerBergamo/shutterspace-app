import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Profile } from "@/types/Profile";
import { useMutation, useQuery } from "convex/react";
import { createContext, useContext } from "react";


interface ProfileContextType {
    profile: Profile;
    profileId: Id<'profiles'>;
    updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export const ProfileProvider = ({ children, fuid }: {
    children: React.ReactNode;
    fuid: string;
}) => {
    const profile = useQuery(api.profile.getProfile, { fuid });
    const updateProfileMutation = useMutation(api.profile.updateProfile);

    if (!profile) return null;

    const updateProfile = async (updates: Partial<Profile>) => {
        if (!profile) return;

        await updateProfileMutation({
            profileId: profile._id,
            updates: {
                nickname: updates.nickname ?? profile.nickname,
                avatarUrl: updates.avatarUrl ?? profile.avatarUrl,
            },
        });
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