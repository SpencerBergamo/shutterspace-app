import { useAuth } from "@/context/AuthContext";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

export function useProfile() {
    const { firebaseUser: user } = useAuth();
    const profile = useQuery(api.profile.getProfile,
        user ? { firebaseUID: user.uid } : 'skip'
    );

    return {
        profile,
        isLoading: profile === undefined,
    }
}