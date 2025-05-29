import * as Network from 'expo-network';
import { useEffect, useState } from "react";

export const useNetworkStatus = () => {
    const [isConnected, setIsConnected] = useState<boolean | undefined>(true);

    useEffect(() => {
        const sub = Network.addNetworkStateListener(({ isConnected }) => {
            setIsConnected(isConnected);
        });

        return () => sub.remove();
    }, []);


    return isConnected;
}