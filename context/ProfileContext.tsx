import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Profile } from "@/types/Profile";
import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { useQuery } from "convex/react";
import { createContext, useContext } from "react";

interface ProfileContextType {
    profile: Profile;
    profileId: Id<'profiles'>;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export const ProfileProvider = ({ children, firebaseUser }: {
    children: React.ReactNode;
    firebaseUser: FirebaseAuthTypes.User;
}) => {
    const profile = useQuery(api.profile.getProfile, {
        firebaseUID: firebaseUser.uid
    });

    if (!profile) return null;

    return <ProfileContext.Provider value={{ profile, profileId: profile._id }}>
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