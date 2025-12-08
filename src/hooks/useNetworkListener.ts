import { addNetworkStateListener, getNetworkStateAsync, NetworkState } from "expo-network";
import { useCallback, useEffect, useState } from "react";

export const useNetworkListener = () => {
    const [networkStatus, setNetworkStatus] = useState<NetworkState>();

    useEffect(() => {
        getNetworkStateAsync().then(state => {
            setNetworkStatus(state);
        });

        const subscription = addNetworkStateListener(state => {
            setNetworkStatus(state);
        });

        return () => {
            subscription.remove();
        }
    }, []);

    const isNetworkError = useCallback((error: string): boolean => {
        return error.toLowerCase().includes('network') ||
            error.toLowerCase().includes('timeout') ||
            error.toLowerCase().includes('connection');
    }, []);

    const calcRetryDelay = useCallback((attempt: number): number => {
        return Math.pow(2, attempt) * 1000;
    }, []);

    return {
        isConnected: networkStatus?.isConnected ?? false,
        isNetworkAvailable: networkStatus?.isInternetReachable ?? false,
        isNetworkError,
        calcRetryDelay,
    }
}