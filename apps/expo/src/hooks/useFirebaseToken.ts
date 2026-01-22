import { FirebaseAuthTypes, getAuth, getIdToken, onAuthStateChanged } from "@react-native-firebase/auth";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function useFirebaseAuth() {
    const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    function handleAuthStateChanged(user: FirebaseAuthTypes.User | null) {
        setUser(user);
        setIsLoading(false);
        setIsAuthenticated(!!user);
    }

    const fetchAccessToken = useCallback(async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
        if (!user) return null;

        return await getIdToken(user, forceRefreshToken);
    }, [user]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(getAuth(), handleAuthStateChanged);
        return unsubscribe;
    }, []);

    return useMemo(() => ({
        isLoading: isLoading,
        isAuthenticated,
        fetchAccessToken,
    }), [isLoading, user, fetchAccessToken]);
}

