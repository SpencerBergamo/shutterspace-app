import { Id } from "@shutterspace/backend/convex/_generated/dataModel";
import { Image } from "expo-image";
import {
    getCached,
    removeCache,
    setCacheUntil,
    type CachePurpose,
} from "@/src/hooks/useCache";

/**
 * Unified signed-URL delivery cache.
 *
 * - Sync memory map for zero-frame warm remounts
 * - SQLite persistence with TTL below the 1h Cloudflare signature lifetime
 * - In-flight dedupe + page-level batch fills
 *
 * Docs:
 * - https://docs.expo.dev/versions/latest/sdk/image/
 * - https://docs.expo.dev/versions/latest/sdk/sqlite/
 * - https://developers.cloudflare.com/r2/api/s3/presigned-urls/
 */

export type DeliveryPurpose =
    | "media_thumbnail"
    | "album_cover"
    | "video_playback";

export interface DeliveryEntry {
    url: string;
    expiresAt: number;
}

export interface DeliveryBatchItem {
    key: string;
    purpose: DeliveryPurpose;
    url: string;
    expiresAt: number;
    /** Stable expo-image cache key (media id / cover identity). */
    imageCacheKey?: string;
}

type MemoryKey = `${DeliveryPurpose}:${string}`;

const memoryCache = new Map<MemoryKey, DeliveryEntry>();
const inflight = new Map<MemoryKey, Promise<DeliveryEntry | null>>();

/** Refresh before Cloudflare's 1h expiry. */
const SAFETY_MARGIN_MS = 5 * 60 * 1000;

function toMemoryKey(purpose: DeliveryPurpose, key: string): MemoryKey {
    return `${purpose}:${key}`;
}

function isFresh(entry: DeliveryEntry, now = Date.now()): boolean {
    return entry.expiresAt - SAFETY_MARGIN_MS > now;
}

export function getDeliveryUrlSync(
    key: string,
    purpose: DeliveryPurpose,
): string | undefined {
    const entry = memoryCache.get(toMemoryKey(purpose, key));
    if (!entry) return undefined;
    if (!isFresh(entry)) return entry.url; // stale-while-revalidate: still paint
    return entry.url;
}

export function peekDeliveryEntry(
    key: string,
    purpose: DeliveryPurpose,
): DeliveryEntry | undefined {
    return memoryCache.get(toMemoryKey(purpose, key));
}

export function setDeliveryEntry(
    key: string,
    purpose: DeliveryPurpose,
    url: string,
    expiresAt: number,
): void {
    memoryCache.set(toMemoryKey(purpose, key), { url, expiresAt });
    void setCacheUntil(key, url, purpose as CachePurpose, expiresAt).catch((e) => {
        console.warn("Failed to persist delivery URL", e);
    });
}

export function invalidateDeliveryEntry(
    key: string,
    purpose: DeliveryPurpose,
): void {
    memoryCache.delete(toMemoryKey(purpose, key));
    void removeCache(key, purpose as CachePurpose).catch(() => undefined);
}

export async function hydrateDeliveryEntryFromDisk(
    key: string,
    purpose: DeliveryPurpose,
): Promise<DeliveryEntry | null> {
    const memKey = toMemoryKey(purpose, key);
    const existing = memoryCache.get(memKey);
    if (existing && isFresh(existing)) return existing;

    const cached = await getCached(key, purpose as CachePurpose);
    if (!cached) return existing ?? null;

    const entry = { url: cached.url, expiresAt: cached.expiresAt };
    memoryCache.set(memKey, entry);
    return entry;
}

export function applyDeliveryBatch(items: DeliveryBatchItem[]): void {
    for (const item of items) {
        setDeliveryEntry(item.key, item.purpose, item.url, item.expiresAt);
        if (item.imageCacheKey) {
            void Image.prefetch(item.url).catch(() => undefined);
        }
    }
}

/**
 * Resolve a URL with: memory → SQLite → fetcher, deduping concurrent callers.
 */
export async function ensureDeliveryUrl(
    key: string,
    purpose: DeliveryPurpose,
    fetcher: () => Promise<DeliveryEntry | null>,
): Promise<DeliveryEntry | null> {
    const memKey = toMemoryKey(purpose, key);
    const cached = memoryCache.get(memKey);
    if (cached && isFresh(cached)) return cached;

    const pending = inflight.get(memKey);
    if (pending) return pending;

    const task = (async (): Promise<DeliveryEntry | null> => {
        const disk = await hydrateDeliveryEntryFromDisk(key, purpose);
        if (disk && isFresh(disk)) return disk;

        const fresh = await fetcher();
        if (fresh) {
            memoryCache.set(memKey, fresh);
            void setCacheUntil(key, fresh.url, purpose as CachePurpose, fresh.expiresAt);
        }
        return fresh ?? disk;
    })().finally(() => {
        inflight.delete(memKey);
    });

    inflight.set(memKey, task);
    return task;
}

export function mediaThumbnailKey(mediaId: Id<"media"> | string): string {
    return String(mediaId);
}

export function videoPlaybackKey(mediaId: Id<"media"> | string): string {
    return String(mediaId);
}

export function albumCoverCacheKey(
    albumId: Id<"albums"> | string,
    coverIdentity: string,
): string {
    return `${albumId}:${coverIdentity}`;
}

/** Test helper. */
export function __resetDeliveryCacheForTests(): void {
    memoryCache.clear();
    inflight.clear();
}
