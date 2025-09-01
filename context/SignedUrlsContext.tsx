import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { LRUCache } from "@/utils/lruCache";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAction } from "convex/react";
import { createContext, useCallback, useContext, useEffect, useRef } from "react";


interface ThumbnailURLRequest {
    fileId: string;
    type: 'image' | 'video';
    albumId: Id<'albums'>;
    profileId: Id<'profiles'>;
}

interface EnsureSignedRequest {
    type: 'image' | 'video';
    id: string;
    albumId: Id<'albums'>;
    profileId: Id<'profiles'>;
}

interface SignedUrlsContextType {
    getThumbnailURLAsync: ({ fileId, type, albumId, profileId }: ThumbnailURLRequest) => Promise<string | undefined>;
    getVideoThumbnailURLAsync: ({ fileId, type, albumId, profileId }: ThumbnailURLRequest) => Promise<string | undefined>;
    ensureSigned: ({ type, id, albumId, profileId }: EnsureSignedRequest) => Promise<string | undefined>;
    clearSignedEntries: () => void;
    getCacheSize: () => number;
}

const SignedUrlsContext = createContext<SignedUrlsContextType | undefined>(undefined);

export function SignedUrlsProvider({ children }: { children: React.ReactNode }) {

    const cacheRef = useRef<LRUCache<string, string>>(new LRUCache(50));

    const requestImageUploadURL = useAction(api.cloudflare.requestImageUploadURL);
    const requestImageDeliveryURL = useAction(api.cloudflare.requestImageDeliveryURL);
    const requestVideoUploadURL = useAction(api.cloudflare.requestVideoUploadURL);
    const requestVideoPlaybackToken = useAction(api.cloudflare.requestVideoPlaybackToken);

    const saveCache = useCallback(async () => {
        try {
            const entries = cacheRef.current.getEntries();
            await AsyncStorage.setItem("@signed-urls", JSON.stringify(entries));
        } catch (e) {
            console.error('Failed to save signed URLs to storage: ', e);
        }
    }, []);

    const setSignedEntry = useCallback((id: string, url: string, ttlMs: number) => {
        cacheRef.current.set(id, url, ttlMs);
        saveCache();
    }, [saveCache]);

    const clearSignedEntries = useCallback(() => {
        cacheRef.current.clear();
        AsyncStorage.removeItem("@signed-urls");
    }, []);

    const getCacheSize = useCallback(() => {
        return cacheRef.current.size();
    }, []);

    const parseExpiry = (url: string): number => {
        if (!url || url.trim() === '') return 0;

        try {
            const u = new URL(url);
            const exp = u.searchParams.get('exp');
            if (!exp) return 0;

            const seconds = parseInt(exp, 10);
            if (Number.isNaN(seconds)) return 0;
            return seconds * 1000; // convert to milliseconds
        } catch (e) {
            console.error("parseExpiry FAIL: ", url, e);
            return 0;
        }
    };

    // on mount: load any cache from async storage
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

    const ensureSigned = useCallback(async ({ type, id, albumId, profileId }: EnsureSignedRequest): Promise<string | undefined> => {
        const cache = cacheRef.current.get(id);
        if (cache) return cache;

        try {
            if (type === 'image') {
                const url = await requestImageDeliveryURL({ albumId, profileId, identifier: id });
                const expiresAt = parseExpiry(url);
                const ttlMs = Math.max(expiresAt - Date.now(), 1000); // duration until expires at
                setSignedEntry(id, url, ttlMs);
                return url;
            } else if (type === 'video') {
                const token = await requestVideoPlaybackToken({ albumId, profileId, videoUID: id });
                console.log("Video Token: ", token);
                const ttlMs = 24 * 60 * 60 * 1000; // duration until expires at 24 hours
                setSignedEntry(id, token, ttlMs);
                return token;
            }
        } catch (e) {
            console.error("getSignedUrl FAIL: ", id, e);
        }
    }, [requestImageDeliveryURL, requestVideoPlaybackToken, setSignedEntry]);

    // we want this the first point of contact for any signed url/token requests
    const getThumbnailURLAsync = useCallback(async ({ fileId, type, albumId, profileId }: ThumbnailURLRequest) => {
        const signed = await ensureSigned({ type, id: fileId, albumId, profileId });
        if (!signed) return undefined;

        if (type === 'video') {
            return `https://customer-${process.env.CLOUDFLARE_CUSTOMER_CODE}.cloudflarestream.com/${signed}/thumbnails/thumbnail.png`;
        } else {
            return signed;
        }
    }, [ensureSigned]);

    const getVideoThumbnailURLAsync = useCallback(async ({ fileId, type, albumId, profileId }: ThumbnailURLRequest) => {
        const signed = await ensureSigned({ type, id: fileId, albumId, profileId });
        if (signed) {
            const base = `https://customer-${process.env.CLOUDFLARE_CUSTOMER_CODE}.cloudflarestream.com`;
            return `${base}/${signed}/thumbnails/thumbnail.png`;
        }
    }, [ensureSigned]);

    const value = {
        getThumbnailURLAsync,
        getVideoThumbnailURLAsync,
        ensureSigned,
        clearSignedEntries,
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
