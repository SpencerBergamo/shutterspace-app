import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internalMutation } from "./_generated/server";
import { coverFromMedia } from "./lib/albumCover";
import { parseExifToEpoch } from "./lib/dates";
import { DEFAULT_STORAGE_LIMIT_BYTES } from "./lib/storage";

/**
 * =============================================================================
 * Backwards-compatible migrations
 * =============================================================================
 *
 * Convention:
 *   backfill*  — Phase 1. Add/populate NEW fields. KEEP legacy fields so older
 *                app versions keep working. Safe to re-run.
 *   drop*      — Phase 2. Remove LEGACY fields once every client is on the new
 *                app. Then delete those fields from schema.ts in a follow-up.
 *
 * Suggested run order (dev + prod):
 *   1. backfillAlbumMemberStatus
 *   2. backfillAlbumLifecycleAndTimes
 *   3. backfillProfileStorageAccounting
 *   4. backfillAlbumCovers
 *   … later, after rollout verification …
 *   5. dropLegacyHostAlbumMemberRows
 *   6. dropLegacyAlbumLifecycleFields
 *   7. dropLegacyProfileStorageQuota
 *   8. dropAlbumThumbnails
 *   9. normalizeAlbumDateRangesAndMediaDates  (string → epoch; breaks old clients)
 *
 * Run via Convex dashboard / CLI, e.g.:
 *   npx convex run migrations:backfillAlbumMemberStatus
 *   npx convex run migrations:backfillAlbumMemberStatus --prod
 */

// -----------------------------------------------------------------------------
// ADR-0001 — membership roles & ownership
// -----------------------------------------------------------------------------

/**
 * Phase 1 (ADR-0001): backfill `albumMembers.status` for dual-read.
 *
 * - `role: 'member' | 'moderator'` → `status: 'active'` (if missing)
 * - `role: 'pending'` → `status: 'pending'` (keeps legacy role for old clients)
 * - `role: 'host'` rows are LEFT IN PLACE (old clients still list the host here;
 *   new clients derive host from `albums.hostId`)
 *
 * Does NOT delete host rows. Does NOT rewrite `role: 'pending'` → `member`.
 */
export const backfillAlbumMemberStatus = internalMutation({
    args: {},
    returns: v.object({
        total: v.number(),
        statusBackfilledActive: v.number(),
        statusBackfilledPending: v.number(),
        hostRowsLeftIntact: v.number(),
        alreadyHadStatus: v.number(),
        orphanRowsSkipped: v.number(),
    }),
    handler: async (ctx) => {
        let statusBackfilledActive = 0;
        let statusBackfilledPending = 0;
        let hostRowsLeftIntact = 0;
        let alreadyHadStatus = 0;
        let orphanRowsSkipped = 0;

        const rows = await ctx.db.query("albumMembers").collect();
        for (const row of rows) {
            const album = await ctx.db.get(row.albumId);
            if (!album) {
                orphanRowsSkipped++;
                continue;
            }

            const role = row.role as string;
            if (role === "host") {
                hostRowsLeftIntact++;
                continue;
            }

            if (row.status !== undefined) {
                alreadyHadStatus++;
                continue;
            }

            if (role === "pending") {
                await ctx.db.patch(row._id, { status: "pending" });
                statusBackfilledPending++;
                continue;
            }

            // member | moderator
            await ctx.db.patch(row._id, { status: "active" });
            statusBackfilledActive++;
        }

        return {
            total: rows.length,
            statusBackfilledActive,
            statusBackfilledPending,
            hostRowsLeftIntact,
            alreadyHadStatus,
            orphanRowsSkipped,
        };
    },
});

/**
 * Phase 2 (ADR-0001): drop legacy host membership rows + orphans.
 *
 * BREAKING for old clients that expect a `role: 'host'` row.
 * Run only after all users are on apps that derive host from `albums.hostId`.
 *
 * Also remaps lingering `role: 'pending'` → `role: 'member'` + `status: 'pending'`
 * so the role union can later be tightened to `member | moderator` only.
 */
export const dropLegacyHostAlbumMemberRows = internalMutation({
    args: {},
    returns: v.object({
        deletedHostRows: v.number(),
        deletedOrphanRows: v.number(),
        pendingRolesRemapped: v.number(),
        untouched: v.number(),
    }),
    handler: async (ctx) => {
        let deletedHostRows = 0;
        let deletedOrphanRows = 0;
        let pendingRolesRemapped = 0;
        let untouched = 0;

        const rows = await ctx.db.query("albumMembers").collect();
        for (const row of rows) {
            const album = await ctx.db.get(row.albumId);
            if (!album) {
                await ctx.db.delete(row._id);
                deletedOrphanRows++;
                continue;
            }

            const role = row.role as string;
            if (role === "host") {
                await ctx.db.delete(row._id);
                deletedHostRows++;
                continue;
            }

            if (role === "pending") {
                await ctx.db.patch(row._id, {
                    role: "member",
                    status: row.status ?? "pending",
                });
                pendingRolesRemapped++;
                continue;
            }

            untouched++;
        }

        return { deletedHostRows, deletedOrphanRows, pendingRolesRemapped, untouched };
    },
});

/** @deprecated Use backfillAlbumMemberStatus then dropLegacyHostAlbumMemberRows. */
export const dropLegacyHostMemberRows = dropLegacyHostAlbumMemberRows;

// -----------------------------------------------------------------------------
// ADR-0002 — album lifecycle + event time
// -----------------------------------------------------------------------------

/**
 * Phase 1 (ADR-0002): backfill new lifecycle/time fields. KEEP legacy fields.
 *
 * Albums:
 *   - `status` from `isDeleted` (`true` → trashed, else active) when missing
 *   - `startsAt` from `dateRange.start` (parses ISO string or uses epoch number)
 *   - leaves `isDeleted` and string `dateRange` intact for older clients
 *
 * Media:
 *   - leaves string `dateTaken` and `isDeleted` intact (new code accepts both)
 */
export const backfillAlbumLifecycleAndTimes = internalMutation({
    args: {},
    returns: v.object({
        albumsStatusBackfilled: v.number(),
        albumsStartsAtBackfilled: v.number(),
        albumsAlreadyMigrated: v.number(),
        mediaInspected: v.number(),
    }),
    handler: async (ctx) => {
        let albumsStatusBackfilled = 0;
        let albumsStartsAtBackfilled = 0;
        let albumsAlreadyMigrated = 0;

        const albums = await ctx.db.query("albums").collect();
        for (const album of albums) {
            const legacy = album as unknown as {
                isDeleted?: boolean;
                status?: "active" | "archived" | "trashed";
                startsAt?: number;
                dateRange?: {
                    start?: number | string;
                    end?: number | string;
                    timezone?: string;
                };
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const patch: Record<string, any> = {};

            if (legacy.status === undefined) {
                patch.status = legacy.isDeleted ? "trashed" : "active";
                albumsStatusBackfilled++;
            }

            if (legacy.startsAt === undefined && legacy.dateRange?.start !== undefined) {
                const start = legacy.dateRange.start;
                const epoch =
                    typeof start === "number" ? start : parseExifToEpoch(start);
                if (epoch !== undefined) {
                    patch.startsAt = epoch;
                    albumsStartsAtBackfilled++;
                }
            }

            if (Object.keys(patch).length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await ctx.db.patch(album._id, patch as any);
            } else {
                albumsAlreadyMigrated++;
            }
        }

        const media = await ctx.db.query("media").collect();

        return {
            albumsStatusBackfilled,
            albumsStartsAtBackfilled,
            albumsAlreadyMigrated,
            mediaInspected: media.length,
        };
    },
});

/**
 * Phase 2a (ADR-0002): drop legacy soft-delete flags.
 *
 * BREAKING for old clients that read `albums.isDeleted` / `media.isDeleted`.
 * Prefer after `backfillAlbumLifecycleAndTimes` and full new-app rollout.
 */
export const dropLegacyAlbumLifecycleFields = internalMutation({
    args: {},
    returns: v.object({
        albumsClearedIsDeleted: v.number(),
        mediaClearedIsDeleted: v.number(),
    }),
    handler: async (ctx) => {
        let albumsClearedIsDeleted = 0;
        let mediaClearedIsDeleted = 0;

        const albums = await ctx.db.query("albums").collect();
        for (const album of albums) {
            const legacy = album as unknown as { isDeleted?: boolean };
            if (legacy.isDeleted === undefined) continue;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await ctx.db.patch(album._id, { isDeleted: undefined } as any);
            albumsClearedIsDeleted++;
        }

        const media = await ctx.db.query("media").collect();
        for (const m of media) {
            const legacy = m as unknown as { isDeleted?: boolean };
            if (legacy.isDeleted === undefined) continue;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await ctx.db.patch(m._id, { isDeleted: undefined } as any);
            mediaClearedIsDeleted++;
        }

        return { albumsClearedIsDeleted, mediaClearedIsDeleted };
    },
});

/**
 * Phase 2b (ADR-0002): normalize string timestamps → epoch ms (+ timezone).
 *
 * BREAKING for old clients that expect ISO-string `dateRange` / `dateTaken`.
 * Run after old clients are gone. Then tighten schema unions to numbers only.
 */
export const normalizeAlbumDateRangesAndMediaDates = internalMutation({
    args: {},
    returns: v.object({
        albumDateRangesNormalized: v.number(),
        mediaDatesNormalized: v.number(),
        skipped: v.number(),
    }),
    handler: async (ctx) => {
        let albumDateRangesNormalized = 0;
        let mediaDatesNormalized = 0;
        let skipped = 0;

        const albums = await ctx.db.query("albums").collect();
        for (const album of albums) {
            const dr = album.dateRange as
                | { start: string; end?: string }
                | { start: number; end?: number; timezone: string }
                | undefined;
            if (!dr) {
                skipped++;
                continue;
            }
            if (typeof dr.start === "number" && "timezone" in dr) {
                skipped++;
                continue;
            }

            const start = parseExifToEpoch(String(dr.start));
            if (start === undefined) {
                skipped++;
                continue;
            }
            const end =
                "end" in dr && dr.end !== undefined
                    ? parseExifToEpoch(String(dr.end))
                    : undefined;

            await ctx.db.patch(album._id, {
                dateRange: {
                    start,
                    ...(end !== undefined ? { end } : {}),
                    timezone: "UTC",
                },
                startsAt: album.startsAt ?? start,
            });
            albumDateRangesNormalized++;
        }

        const media = await ctx.db.query("media").collect();
        for (const m of media) {
            if (typeof m.dateTaken !== "string") {
                skipped++;
                continue;
            }
            const epoch = parseExifToEpoch(m.dateTaken);
            if (epoch === undefined) {
                skipped++;
                continue;
            }
            await ctx.db.patch(m._id, { dateTaken: epoch });
            mediaDatesNormalized++;
        }

        return { albumDateRangesNormalized, mediaDatesNormalized, skipped };
    },
});

/** @deprecated Use backfillAlbumLifecycleAndTimes + drop/normalize phase-2 migrations. */
export const migrateAlbumLifecycleAndTimes = backfillAlbumLifecycleAndTimes;

// -----------------------------------------------------------------------------
// ADR-0004 — storage accounting
// -----------------------------------------------------------------------------

/**
 * Phase 1 (ADR-0004): backfill `storageUsedBytes` + `storageLimitBytes`.
 * KEEPS legacy `storageQuota` for older clients.
 */
export const backfillProfileStorageAccounting = internalMutation({
    args: {},
    returns: v.object({
        profilesPatched: v.number(),
    }),
    handler: async (ctx) => {
        const media = await ctx.db.query("media").collect();
        const usedByProfile = new Map<string, number>();
        for (const m of media) {
            // Skip soft-deleted media still present during the dual-write window.
            if ((m as { isDeleted?: boolean }).isDeleted) continue;
            const prev = usedByProfile.get(m.createdBy) ?? 0;
            usedByProfile.set(m.createdBy, prev + (m.size ?? 0));
        }

        let profilesPatched = 0;
        const profiles = await ctx.db.query("profiles").collect();
        for (const profile of profiles) {
            const legacy = profile as unknown as {
                storageLimitBytes?: number;
            };

            await ctx.db.patch(profile._id, {
                storageUsedBytes: usedByProfile.get(profile._id) ?? 0,
                storageLimitBytes: legacy.storageLimitBytes ?? DEFAULT_STORAGE_LIMIT_BYTES,
            });
            profilesPatched++;
        }

        return { profilesPatched };
    },
});

/**
 * Phase 2 (ADR-0004): drop legacy `storageQuota`.
 *
 * BREAKING for old clients that read/write `storageQuota`.
 */
export const dropLegacyProfileStorageQuota = internalMutation({
    args: {},
    returns: v.object({
        profilesCleared: v.number(),
    }),
    handler: async (ctx) => {
        let profilesCleared = 0;
        const profiles = await ctx.db.query("profiles").collect();
        for (const profile of profiles) {
            const legacy = profile as unknown as { storageQuota?: number };
            if (legacy.storageQuota === undefined) continue;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await ctx.db.patch(profile._id, { storageQuota: undefined } as any);
            profilesCleared++;
        }
        return { profilesCleared };
    },
});

/** @deprecated Use backfillProfileStorageAccounting then dropLegacyProfileStorageQuota. */
export const migrateStorageAccounting = backfillProfileStorageAccounting;

// -----------------------------------------------------------------------------
// Album covers (denormalized `cover` + legacy `thumbnail`)
// -----------------------------------------------------------------------------

/**
 * Phase 1: backfill denormalized `cover` from legacy `thumbnail`.
 * KEEPS `thumbnail` for older clients.
 */
export const backfillAlbumCovers = internalMutation({
    args: {},
    returns: v.object({
        albumsMigrated: v.number(),
        albumsSkippedMissingMedia: v.number(),
        albumsAlreadyHadCover: v.number(),
    }),
    handler: async (ctx) => {
        let albumsMigrated = 0;
        let albumsSkippedMissingMedia = 0;
        let albumsAlreadyHadCover = 0;

        const albums = await ctx.db.query("albums").collect();
        for (const album of albums) {
            const legacy = album as unknown as {
                thumbnail?: Id<"media">;
                cover?: unknown;
            };

            if (legacy.cover) {
                albumsAlreadyHadCover++;
                continue;
            }
            if (!legacy.thumbnail) continue;

            const media = await ctx.db.get(legacy.thumbnail);
            if (!media) {
                albumsSkippedMissingMedia++;
                continue;
            }

            await ctx.db.patch(album._id, {
                cover: coverFromMedia(media),
            });
            albumsMigrated++;
        }

        return { albumsMigrated, albumsSkippedMissingMedia, albumsAlreadyHadCover };
    },
});

/**
 * Phase 2: drop legacy `thumbnail` once every client reads `cover`.
 * Then remove `thumbnail` from schema.ts.
 */
export const dropAlbumThumbnails = internalMutation({
    args: {},
    returns: v.object({
        albumsCleared: v.number(),
    }),
    handler: async (ctx) => {
        let albumsCleared = 0;

        const albums = await ctx.db.query("albums").collect();
        for (const album of albums) {
            const legacy = album as unknown as {
                thumbnail?: Id<"media">;
            };
            if (legacy.thumbnail === undefined) continue;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await ctx.db.patch(album._id, { thumbnail: undefined } as any);
            albumsCleared++;
        }

        return { albumsCleared };
    },
});
