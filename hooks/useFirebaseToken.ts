import { useAuth } from "@/context/AuthContext";
import { useCallback, useMemo } from "react";

export default function useFirebaseToken() {
    const { isLoading, firebaseUser: user, getToken } = useAuth();

    const fetchAccessToken = useCallback(async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
        return await getToken(forceRefreshToken);
    }, [getToken]);

    return useMemo(() => ({
        isLoading: isLoading,
        isAuthenticated: !!user,
        fetchAccessToken,
    }), [user, isLoading, fetchAccessToken]);

}