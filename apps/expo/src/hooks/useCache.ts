import * as SQLite from "expo-sqlite";

/**
 * Persistent TTL cache for signed Cloudflare delivery URLs.
 *
 * Docs: https://docs.expo.dev/versions/latest/sdk/sqlite/
 */

export type CachePurpose =
    | "media_thumbnail"
    | "album_cover"
    | "video_playback";

interface CacheEntry {
    key: string;
    url: string;
    expires_at: number;
    purpose: CachePurpose;
}

export interface CacheResult {
    url: string;
    expiresAt: number;
}

export interface CacheStats {
    total: number;
    byPurpose: Record<CachePurpose, number>;
}

const DB_NAME = "file_cache.db";

/** Keep SQLite entries slightly shorter than the 1h signature TTL. */
export const DEFAULT_CACHE_DURATION_MS = 55 * 60 * 1000;

let dbInstance: SQLite.SQLiteDatabase | null = null;
let dbInitialized = false;

async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (dbInstance && dbInitialized) return dbInstance;

    dbInstance = await SQLite.openDatabaseAsync(DB_NAME);

    if (!dbInitialized) {
        await dbInstance.execAsync(`
            CREATE TABLE IF NOT EXISTS url_cache (
                key TEXT NOT NULL,
                url TEXT NOT NULL,
                expires_at INTEGER NOT NULL,
                purpose TEXT NOT NULL,
                PRIMARY KEY (key, purpose)
            );
            CREATE INDEX IF NOT EXISTS idx_expires_at ON url_cache(expires_at);
        `);
        dbInitialized = true;
    }

    return dbInstance;
}

export async function getCached(
    key: string,
    purpose: CachePurpose,
): Promise<CacheResult | null> {
    const db = await getDatabase();
    const now = Date.now();

    const result = await db.getFirstAsync<CacheEntry>(
        `SELECT url, expires_at FROM url_cache WHERE key = ? AND purpose = ? AND expires_at > ?`,
        [key, purpose, now],
    );

    if (!result) return null;

    return {
        url: result.url,
        expiresAt: result.expires_at,
    };
}

export async function setCache(
    key: string,
    url: string,
    purpose: CachePurpose,
    durationMs: number = DEFAULT_CACHE_DURATION_MS,
): Promise<void> {
    const db = await getDatabase();
    const expiresAt = Date.now() + durationMs;

    await db.runAsync(
        `INSERT OR REPLACE INTO url_cache (key, url, expires_at, purpose) VALUES (?, ?, ?, ?)`,
        [key, url, expiresAt, purpose],
    );
}

export async function setCacheUntil(
    key: string,
    url: string,
    purpose: CachePurpose,
    expiresAt: number,
): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
        `INSERT OR REPLACE INTO url_cache (key, url, expires_at, purpose) VALUES (?, ?, ?, ?)`,
        [key, url, expiresAt, purpose],
    );
}

export async function removeCache(
    key: string,
    purpose: CachePurpose,
): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
        `DELETE FROM url_cache WHERE key = ? AND purpose = ?`,
        [key, purpose],
    );
}

export async function clearCacheByPurpose(purpose: CachePurpose): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM url_cache WHERE purpose = ?`, [purpose]);
}

export async function clearAllCache(): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM url_cache`);
}

export async function cleanupExpiredCache(): Promise<number> {
    const db = await getDatabase();
    const now = Date.now();
    const result = await db.runAsync(
        `DELETE FROM url_cache WHERE expires_at <= ?`,
        [now],
    );
    return result.changes;
}

export async function getCacheStats(): Promise<CacheStats> {
    const db = await getDatabase();

    const totalResult = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM url_cache`,
    );

    const purposes: CachePurpose[] = [
        "media_thumbnail",
        "album_cover",
        "video_playback",
    ];
    const byPurpose = {} as Record<CachePurpose, number>;

    for (const purpose of purposes) {
        const result = await db.getFirstAsync<{ count: number }>(
            `SELECT COUNT(*) as count FROM url_cache WHERE purpose = ?`,
            [purpose],
        );
        byPurpose[purpose] = result?.count ?? 0;
    }

    return {
        total: totalResult?.count ?? 0,
        byPurpose,
    };
}

export async function getOrFetch(
    key: string,
    purpose: CachePurpose,
    fetcher: () => Promise<string | null>,
    durationMs: number = DEFAULT_CACHE_DURATION_MS,
): Promise<string | null> {
    const cached = await getCached(key, purpose);
    if (cached) return cached.url;

    const url = await fetcher();
    if (url) {
        await setCache(key, url, purpose, durationMs);
    }

    return url;
}

/** Reset module state for tests. */
export function __resetUrlCacheForTests(): void {
    dbInstance = null;
    dbInitialized = false;
}
