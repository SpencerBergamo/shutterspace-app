import { useAuth } from "@/context/AuthContext";

export default function useFirebaseToken() {
    const { firebaseUser: user } = useAuth();

    return {
        isLoading: user === undefined,
        isAuthenticated: !!user,
        fetchAccessToken: async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
            if (!user) return null;
            try {
                return await user.getIdToken(forceRefreshToken);
            } catch (e) {
                console.error("Error fetching token", e);
                return null;
            }
        }
    }
}