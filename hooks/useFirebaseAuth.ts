import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";

function useFirebaseAuth() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        async function fetchToken() {
            if (user) {
                try {
                    const idToken = await user.getIdToken();
                    setToken(idToken);
                } catch (e) {
                    setToken(null);
                }
            } else { setToken(null); }
            setIsLoading(false);
        }

        fetchToken();
    }, [user]);

    return {
        isLoading,
        isAuthenticated: !!token,
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

export default useFirebaseAuth;