import { Id } from "@/convex/_generated/dataModel";
import { MediaIdentifier } from "@/types/Media";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from 'expo-file-system';

export interface CachedEntry {
    identifier: MediaIdentifier;
    filename: string;
    localUri: string;
    remoteUri: string;
    expiresAt: number;
    fileSize: number;
    lastAccessedAt: number;
}

export interface CacheMetadata {
    totalSize: number;
    entries: Map<Id<'media'>, CachedEntry>;
    lastSyncAt: number;
}

export class MediaCacheManager {
    private static instance: MediaCacheManager;
    private readonly MAX_CACHE = 500 * 1024 * 1024; // 500MB
    private readonly CACHE_DIR = `${FileSystem.cacheDirectory}shutterspace-cache`;
    private readonly METADATA_KEY = "@shutterspace-metadata-cache";
    private metadata: CacheMetadata;

    private constructor() {
        this.metadata = {
            totalSize: 0,
            entries: new Map(),
            lastSyncAt: 0,
        };
    }

    static getInstance(): MediaCacheManager {
        if (!MediaCacheManager.instance) {
            MediaCacheManager.instance = new MediaCacheManager();
        }
        return MediaCacheManager.instance;
    }

    async init() {
        try {
            const dirInfo = await FileSystem.getInfoAsync(this.CACHE_DIR);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(this.CACHE_DIR, { intermediates: true });
            }

            await this.loadMetadata(); // load metadata from AsyncStorage
            await this.validateCache(); // verify cached files still exist
        } catch (e) {
            console.error("MediaCacheManager init: ", e);
        }
    }

    private async loadMetadata(): Promise<void> {
        try {
            const stored = await AsyncStorage.getItem(this.METADATA_KEY);
            if (stored) {
                const data = JSON.parse(stored) as CacheMetadata;
                this.metadata = {
                    totalSize: data.totalSize,
                    entries: new Map(data.entries),
                    lastSyncAt: data.lastSyncAt,
                };
            }
        } catch (e) {
            console.error("MediaCacheManager loadMetadata: ", e);
        }
    }

    private async saveMetadata(): Promise<void> {
        try {
            const data = {
                totalSize: this.metadata.totalSize,
                entries: Array.from(this.metadata.entries.entries()),
                lastSyncAt: this.metadata.lastSyncAt,
            };

            await AsyncStorage.setItem(this.METADATA_KEY, JSON.stringify(data));
        } catch (e) {
            console.error("MediaCacheManager saveMetadata: ", e);
        }
    }

    private async validateCache(): Promise<void> {
        const validEntries = new Map<Id<'media'>, CachedEntry>();
        let totalSize = 0;

        for (const [mediaId, entry] of this.metadata.entries) {
            try {
                const fileInfo = await FileSystem.getInfoAsync(entry.localUri);
                if (fileInfo.exists && fileInfo.size) {
                    validEntries.set(mediaId, entry);
                    totalSize += fileInfo.size;
                } else {
                    console.log("Removing invalid cache entry: ", mediaId);
                }
            } catch (e) {
                console.error("MediaCacheManager validateCache: ", e);
            }
        }
    }

    async getCachedEntry(mediaId: Id<'media'>): Promise<CachedEntry | undefined> {
        const entry = this.metadata.entries.get(mediaId);
        if (!entry) return undefined;

        try {
            const fileInfo = await FileSystem.getInfoAsync(entry.localUri);
            if (!fileInfo.exists) {
                this.metadata.entries.delete(mediaId);
                await this.saveMetadata();
                return undefined;
            }

            entry.lastAccessedAt = Date.now();
            this.metadata.entries.set(mediaId, entry);
            await this.saveMetadata();

            return entry;
        } catch (e) {
            console.error("MediaCacheManager getCachedEntry: ", e);
            return undefined;
        }
    }

    async cacheEntry(): Promise<void> { }

    private async ensureSpace(neededBytes: number): Promise<void> {
        if (this.metadata.totalSize + neededBytes <= this.MAX_CACHE) return;

        const entries = Array.from(this.metadata.entries).sort((a, b) => {
            return a[1].lastAccessedAt - b[1].lastAccessedAt;
        });

        let freedSpace = 0;
        const toRemove: Id<'media'>[] = [];

        for (const [mediaId, entry] of entries) {
            if (this.metadata.totalSize - freedSpace + neededBytes <= this.MAX_CACHE) break;

            toRemove.push(mediaId);
            freedSpace += entry.fileSize;
        }

        for (const mediaId of toRemove) {
            await this.removeCachedEntry(mediaId);
        }
    }

    private async removeCachedEntry(mediaId: Id<'media'>): Promise<void> {
        const entry = this.metadata.entries.get(mediaId);
        if (entry) {
            try {
                await FileSystem.deleteAsync(entry.localUri, { idempotent: true });
                this.metadata.totalSize -= entry.fileSize;
                this.metadata.entries.delete(mediaId);
                await this.saveMetadata();
            } catch (e) {
                console.error("MediaCacheManager removedCachedEntry: ", e);
            }
        }
    }

    async syncWithDatabase(): Promise<void> {

    }
}