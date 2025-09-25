import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAction } from "convex/react";
import { createContext, useCallback, useContext } from "react";

interface SignedEntry {
    value: string;
    expiresAt: number;
}

interface RequestSignedEntryRequest {
    albumId: Id<'albums'>;
    profileId: Id<'profiles'>;
    mediaId: Id<'media'>;
    cloudflareId: string;
    type: 'image' | 'video';
}

interface SignedUrlsContextType {
    requestSignedEntry: (request: RequestSignedEntryRequest) => Promise<SignedEntry | null>;
    setSignedEntry: (mediaId: Id<'media'>, value: string, expiresAt: number, localUri?: string) => Promise<void>;
    clearSignedEntries: () => void;
}

const CACHE_KEY = '@shutterspace-media-';

const SignedUrlsContext = createContext<SignedUrlsContextType | undefined>(undefined);

export function SignedUrlsProvider({ children }: { children: React.ReactNode }) {
    const requestImageDeliveryURL = useAction(api.cloudflare.requestImageDeliveryURL);
    const requestVideoPlaybackToken = useAction(api.cloudflare.requestVideoPlaybackToken);

    const setSignedEntry = useCallback(async (mediaId: Id<'media'>, value: string, expiresAt: number) => {
        const entry: SignedEntry = {
            value,
            expiresAt,
        }

        try {
            const key = `${CACHE_KEY}-${mediaId}`;
            await AsyncStorage.setItem(key, JSON.stringify(entry));
        } catch (e) {
            console.error("SignedUrlsContext saveEntry: ", e);
        }
    }, []);

    const requestSignedEntry = useCallback(async (request: RequestSignedEntryRequest): Promise<SignedEntry | null> => {
        const { mediaId, cloudflareId, type, albumId, profileId } = request;

        try {
            const key = `${CACHE_KEY}-${mediaId}`;
            const stored = await AsyncStorage.getItem(key);

            if (stored) {
                const parsed = JSON.parse(stored) as SignedEntry;
                if (parsed.expiresAt > Date.now()) {
                    return parsed;
                } else {
                    await AsyncStorage.removeItem(key);
                }
            }

            if (type === 'image') {
                const url = await requestImageDeliveryURL({ albumId, profileId, imageId: cloudflareId });
                const expiresAt = parseExpiry(url);
                await setSignedEntry(mediaId, url, expiresAt);
                return { value: url, expiresAt };
            } else if (type === 'video') {
                const token = await requestVideoPlaybackToken({ albumId, profileId, videoUID: cloudflareId });
                const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // duration until expires at 24 hours
                await setSignedEntry(mediaId, token, expiresAt);
                return { value: token, expiresAt };
            }

            return null;
        } catch (e) {
            console.error("SignedUrlsContext requestSignedEntry: ", e);
            return null;
        }
    }, [requestImageDeliveryURL, requestVideoPlaybackToken, setSignedEntry]);

    const clearSignedEntries = useCallback(async () => {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const signedKeys = keys.filter(key => key.startsWith(CACHE_KEY));
            await AsyncStorage.multiRemove(signedKeys);
        } catch (e) {
            console.error("SignedUrlsContext clearSignedEntries: ", e);
        }
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

    const value = {
        requestSignedEntry,
        setSignedEntry,
        clearSignedEntries,
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
