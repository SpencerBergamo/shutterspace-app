import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { DbMedia } from "@/types/Media";
import { useAction } from "convex/react";
import * as FileSystem from "expo-file-system";
import {
    SQLiteProvider,
    useSQLiteContext,
    type SQLiteDatabase,
} from "expo-sqlite";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const cacheDir = `${FileSystem.cacheDirectory}files/`;

type MediaCacheEntry = {
    mediaId: Id<'media'>;
    albumId: Id<'albums'>;
    type: 'image' | 'video';
    uri: string;
    cachedAt: number;
};

type MediaCacheContextType = {
    cachedMedia: MediaCacheEntry[];
    cacheMediaInBackground(media: DbMedia, profileId: Id<'profiles'>): Promise<void>;
    clearAlbumCache(albumId: Id<'albums'>): Promise<void>;
    clearAll(): Promise<void>;
};

const MediaCacheContext = createContext<MediaCacheContextType | null>(null);

// DB migration: ensure tables exist
async function migrateDbIfNeeded(db: SQLiteDatabase) {
    await db.execAsync(`
        PRAGMA journal_mode = WAL;
        
        CREATE TABLE IF NOT EXISTS media_cache (
            mediaId TEXT PRIMARY KEY,
            albumId TEXT NOT NULL,
            type TEXT NOT NULL CHECK (type IN ('image', 'video')),
            uri TEXT NOT NULL,
            cachedAt INTEGER NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS idx_media_cache_albumId ON media_cache(albumId);
        CREATE INDEX IF NOT EXISTS idx_media_cache_fileSize ON media_cache(fileSize);
    `);
}

export function MediaCacheProvider({ children }: { children: React.ReactNode }) {
    return (
        <SQLiteProvider databaseName="shutterspace-media.db" onInit={migrateDbIfNeeded}>
            <MediaCacheImpl>{children}</MediaCacheImpl>
        </SQLiteProvider>
    );
}

function MediaCacheImpl({ children }: { children: React.ReactNode }) {
    const [cache, setCache] = useState<MediaCacheEntry[]>([]);
    const db = useSQLiteContext();

    const requestImageDeliveryURL = useAction(api.cloudflare.requestImageDeliveryURL);
    const requestVideoPlaybackToken = useAction(api.cloudflare.requestVideoPlaybackToken);

    useEffect(() => {
        const loadCache = async () => {
            try {
                const dirInfo = await FileSystem.getInfoAsync(cacheDir);
                if (!dirInfo.exists) {
                    await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
                    return;
                }

                const entries = await db.getAllAsync<MediaCacheEntry>('SELECT * FROM media_cache');
                setCache(entries);

                console.log(`Loaded ${entries.length} cached media in ${dirInfo.uri}`);
            } catch (e) {
                console.error("Failed to load MediaCacheContext", e);
            }
        }

        loadCache();
    }, []);

    const cacheMediaInBackground = useCallback(async (media: DbMedia, profileId: Id<'profiles'>) => {
        const albumId = media.albumId;
        const type = media.identifier.type;
        const cloudflareId = type === 'image' ? media.identifier.imageId : media.identifier.videoUid;
        let url: string | undefined;

        try {
            if (type === 'image') {
                url = await requestImageDeliveryURL({ albumId, profileId, imageId: cloudflareId });
            } else if (type === 'video') {
                url = await requestVideoPlaybackToken({ albumId, profileId, videoUID: cloudflareId });
            }

            if (!url) {
                console.error("Failed to get URL from cloudflare");
                return;
            }

            const ext = type === 'image' ? 'jpg' : 'mp4';
            const localUri = `${cacheDir}/${media._id}.${ext}`;
            const downloadResult = await FileSystem.downloadAsync(url, localUri);
            if (downloadResult.status !== 200) {
                console.error(`Failed to download ${url} with headers ${downloadResult.headers}`);
                return;
            }

            const uri = downloadResult.uri;
            await db.runAsync(`
                INSERT OR REPLACE INTO media_cache
                (mediaId, albumId, type, uri, cachedAt)
                VALUES (?, ?, ?, ?, ?)
                `, [
                media._id,
                albumId,
                type,
                uri,
                Date.now(),
            ]);

            setCache(prev => [...prev, {
                mediaId: media._id,
                albumId,
                type,
                uri,
                cachedAt: Date.now(),
            } as MediaCacheEntry]);
        } catch (e) {
            console.error(`cacheMediaInBackground FAIL: ${e}`);
        }
    }, [db, requestImageDeliveryURL, requestVideoPlaybackToken]);

    const clearAlbumCache = useCallback(async (albumId: Id<'albums'>) => {
        try {// Get all cached files for this album
            const cachedFiles = await db.getAllAsync<{ uri: string }>(
                "SELECT uri FROM media_cache WHERE albumId = ?",
                [albumId]
            );

            // Delete files from filesystem
            for (const file of cachedFiles) {
                try {
                    const fileInfo = await FileSystem.getInfoAsync(file.uri);
                    if (fileInfo.exists) {
                        await FileSystem.deleteAsync(file.uri, { idempotent: true });
                    }
                } catch (error) {
                    console.warn('Failed to delete cached file:', file.uri, error);
                }
            }

            // Remove from database
            await db.runAsync("DELETE FROM media_cache WHERE albumId = ?", [albumId]);
            console.log(`Cleared cache for album ${albumId}: ${cachedFiles.length} files`);
        } catch (e) {
            console.error(`clearAlbumCache FAIL: ${e}`);
        }
    }, [db]);

    const clearAll = useCallback(async () => {
        try {// Get all cached files
            const allFiles = await db.getAllAsync<{ uri: string }>(
                "SELECT uri FROM media_cache"
            );

            // Delete all files from filesystem
            for (const file of allFiles) {
                try {
                    const fileInfo = await FileSystem.getInfoAsync(file.uri);
                    if (fileInfo.exists) {
                        await FileSystem.deleteAsync(file.uri, { idempotent: true });
                    }
                } catch (error) {
                    console.warn('Failed to delete cached file:', file.uri, error);
                }
            }

            await db.runAsync("DELETE FROM media_cache");

            console.log(`Cleared all cache: ${allFiles.length} files`);
        } catch (e) {
            console.error(`clearAll FAIL: ${e}`);
        }
    }, [db]);


    const contextValue: MediaCacheContextType = {
        cachedMedia: cache as MediaCacheEntry[],
        cacheMediaInBackground,
        clearAlbumCache,
        clearAll,
    };

    return (
        <MediaCacheContext.Provider value={contextValue}>
            {children}
        </MediaCacheContext.Provider>
    );
}

// Hook
export function useMediaCache() {
    const ctx = useContext(MediaCacheContext);
    if (!ctx) throw new Error("useMediaCache must be inside MediaCacheProvider");
    return ctx;
}