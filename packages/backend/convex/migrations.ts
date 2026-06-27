import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { parseExifToEpoch } from "./lib/dates";
import { DEFAULT_STORAGE_LIMIT_BYTES } from "./lib/storage";

/**
 * ADR-0001 migration: membership roles & ownership.
 *
 * The Host is now the single source of truth via `albums.hostId`; the Host no
 * longer has an `albumMembers` row. Legacy rows with `role: 'host'` are therefore
 * redundant (or orphaned, when their album was already deleted) and are dropped.
 *
 * Any surviving `member`/`moderator` rows would need a `status` backfill, but the
 * current dev data set is entirely `host` rows, so this single step empties the
 * table and the strict ADR-0001 schema deploys cleanly with no rows to backfill.
 */
export const dropLegacyHostMemberRows = internalMutation({
    args: {},
    returns: v.object({
        total: v.number(),
        deletedHostRows: v.number(),
        deletedOrphanRows: v.number(),
        untouched: v.number(),
    }),
    handler: async (ctx) => {
        const rows = await ctx.db.query("albumMembers").collect();

        let deletedHostRows = 0;
        let deletedOrphanRows = 0;
        let untouched = 0;

        for (const row of rows) {
            const album = await ctx.db.get(row.albumId);

            // Orphaned membership (album no longer exists) — drop it.
            if (!album) {
                await ctx.db.delete(row._id);
                deletedOrphanRows++;
                continue;
            }

            // Legacy host rows are redundant with albums.hostId — drop them.
            // (`host` is no longer part of the role union, hence the cast.)
            if ((row.role as string) === "host") {
                await ctx.db.delete(row._id);
                deletedHostRows++;
                continue;
            }

            untouched++;
        }

        return { total: rows.length, deletedHostRows, deletedOrphanRows, untouched };
    },
});

/**
 * ADR-0002 migration: album lifecycle + epoch-ms time representation.
 *
 * - albums: derive explicit `status` from legacy `isDeleted` (`true` -> trashed,
 *   otherwise active), drop the legacy `isDeleted` field, and backfill the scalar
 *   `startsAt` from `dateRange.start` when present.
 * - media: parse legacy EXIF-string `dateTaken` to epoch ms, and drop the legacy
 *   `isDeleted` field (ADR-0002 removes per-media soft delete).
 *
 * Legacy fields are read via casts so this compiles against both the transitional
 * and the final schema. Patching a field to `undefined` removes it from the doc.
 */
export const migrateAlbumLifecycleAndTimes = internalMutation({
    args: {},
    returns: v.object({
        albumsPatched: v.number(),
        mediaPatched: v.number(),
        mediaDatesParsed: v.number(),
    }),
    handler: async (ctx) => {
        let albumsPatched = 0;
        const albums = await ctx.db.query("albums").collect();
        for (const album of albums) {
            const legacy = album as unknown as {
                isDeleted?: boolean;
                status?: "active" | "archived" | "trashed";
                startsAt?: number;
                dateRange?: { start?: number };
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const patch: Record<string, any> = {};

            if (legacy.status === undefined) {
                patch.status = legacy.isDeleted ? "trashed" : "active";
            }
            if (legacy.isDeleted !== undefined) {
                patch.isDeleted = undefined; // remove legacy field
            }
            if (legacy.startsAt === undefined && legacy.dateRange?.start !== undefined) {
                patch.startsAt = legacy.dateRange.start;
            }

            if (Object.keys(patch).length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await ctx.db.patch(album._id, patch as any);
                albumsPatched++;
            }
        }

        let mediaPatched = 0;
        let mediaDatesParsed = 0;
        const media = await ctx.db.query("media").collect();
        for (const m of media) {
            const legacy = m as unknown as {
                isDeleted?: boolean;
                dateTaken?: number | string;
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const patch: Record<string, any> = {};

            if (typeof legacy.dateTaken === "string") {
                patch.dateTaken = parseExifToEpoch(legacy.dateTaken);
                mediaDatesParsed++;
            }
            if (legacy.isDeleted !== undefined) {
                patch.isDeleted = undefined; // remove legacy field
            }

            if (Object.keys(patch).length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await ctx.db.patch(m._id, patch as any);
                mediaPatched++;
            }
        }

        return { albumsPatched, mediaPatched, mediaDatesParsed };
    },
});

/**
 * ADR-0004 migration: storage accounting.
 *
 * Replaces the legacy one-way `storageQuota` counter with two fields:
 * `storageUsedBytes` (recomputed accurately from each profile's media `size`)
 * and `storageLimitBytes` (default free tier, 5 GB). Drops `storageQuota`.
 */
export const migrateStorageAccounting = internalMutation({
    args: {},
    returns: v.object({
        profilesPatched: v.number(),
    }),
    handler: async (ctx) => {
        // Sum committed bytes per profile from the media table (source of truth).
        const media = await ctx.db.query("media").collect();
        const usedByProfile = new Map<string, number>();
        for (const m of media) {
            const prev = usedByProfile.get(m.createdBy) ?? 0;
            usedByProfile.set(m.createdBy, prev + (m.size ?? 0));
        }

        let profilesPatched = 0;
        const profiles = await ctx.db.query("profiles").collect();
        for (const profile of profiles) {
            const legacy = profile as unknown as {
                storageQuota?: number;
                storageUsedBytes?: number;
                storageLimitBytes?: number;
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const patch: Record<string, any> = {
                storageUsedBytes: usedByProfile.get(profile._id) ?? 0,
                storageLimitBytes: legacy.storageLimitBytes ?? DEFAULT_STORAGE_LIMIT_BYTES,
            };
            if (legacy.storageQuota !== undefined) {
                patch.storageQuota = undefined; // remove legacy field
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await ctx.db.patch(profile._id, patch as any);
            profilesPatched++;
        }

        return { profilesPatched };
    },
});
