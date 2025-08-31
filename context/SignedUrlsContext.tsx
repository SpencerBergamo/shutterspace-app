import { LRUCache } from "@/utils/lruCache";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useRef } from "react";

interface SignedEntry {
    id: {
        value: string;
        expiresAt: number;
    }
}

interface SignedUrlsContextType {
    getSignedUrl: (id: string) => string | undefined;
    setSignedUrl: (id: string, url: string, ttlMs: number) => void;
    clearSignedUrls: () => void;
    getCacheSize: () => number;
}

const SignedUrlsContext = createContext<SignedUrlsContextType | undefined>(undefined);

export function SignedUrlsProvider({ children }: { children: React.ReactNode }) {
    const cacheRef = useRef<LRUCache<string, string>>(new LRUCache(50));

    useEffect(() => {
        const loadCache = async () => {
            try {
                const stored = await AsyncStorage.getItem("@signed-urls");
                if (stored) {
                    const entries: [string, { value: string, expiresAt: number }][] = JSON.parse(stored);
                    entries.forEach(([id, { value, expiresAt }]) => {
                        const ttlMs = Math.max(expiresAt - Date.now(), 0);
                        if (ttlMs > 0) {
                            cacheRef.current.set(id, value, ttlMs);
                        }
                    });
                }
            } catch (e) {
                console.error("Error loading cache: ", e);
            }
        }

        loadCache();
    }, []);

    const saveCache = useCallback(async () => {
        try {
            const entries = cacheRef.current.getEntries();
            await AsyncStorage.setItem("@signed-urls", JSON.stringify(entries));
        } catch (e) {
            console.error('Failed to save signed URLs to storage: ', e);
        }
    }, []);

    const getSignedUrl = useCallback((id: string) => {
        return cacheRef.current.get(id);
    }, []);

    const setSignedUrl = useCallback((id: string, url: string, ttlMs: number) => {
        cacheRef.current.set(id, url, ttlMs);
        saveCache();
    }, [saveCache]);

    const clearSignedUrls = useCallback(() => {
        cacheRef.current.clear();
        AsyncStorage.removeItem("@signed-urls");
    }, []);

    const getCacheSize = useCallback(() => {
        return cacheRef.current.size();
    }, []);

    const value = {
        getSignedUrl,
        setSignedUrl,
        clearSignedUrls,
        getCacheSize
    }

    return (
        <SignedUrlsContext.Provider value={value}>
            {children}
        </SignedUrlsContext.Provider>
    );
}


export const useSignedUrls = () => {
    const context = useContext(SignedUrlsContext);
    if (!context) throw new Error('useSignedUrls must be used within a SignedUrlsProvider');
    return context;
}
