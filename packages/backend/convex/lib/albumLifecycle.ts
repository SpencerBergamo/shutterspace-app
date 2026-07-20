import { internal } from "../_generated/api";
import { Doc, Id } from "../_generated/dataModel";
import { MutationCtx } from "../_generated/server";

export type EffectiveAlbumStatus = "active" | "archived" | "trashed";

/** Grace after event end before auto-archive (ADR-0002). */
export const ARCHIVE_GRACE_MS = 7 * 24 * 60 * 60 * 1000;

/** Time in trash before hard purge (ADR-0002). */
export const PURGE_DELAY_MS = 30 * 24 * 60 * 60 * 1000;

type LegacyAlbum = Doc<"albums"> & { isDeleted?: boolean };

/**
 * Effective status for authorization. Readers may also defensively treat
 * `active && now >= expiresAt` as archived (ADR-0002).
 *
 * Falls back to legacy `isDeleted` when `status` has not been backfilled yet.
 */
export function getEffectiveStatus(
    album: Doc<"albums">,
    now: number = Date.now(),
): EffectiveAlbumStatus {
    const legacy = album as LegacyAlbum;
    if (album.status === "trashed" || legacy.isDeleted === true) return "trashed";
    if (album.status === "archived") return "archived";
    if (album.expiresAt !== undefined && now >= album.expiresAt) return "archived";
    return "active";
}

export function albumAllowsUploads(album: Doc<"albums">, now?: number): boolean {
    return getEffectiveStatus(album, now) === "active";
}

export function albumAllowsEdits(album: Doc<"albums">, now?: number): boolean {
    return getEffectiveStatus(album, now) === "active";
}

export function albumIsVisible(album: Doc<"albums">): boolean {
    return getEffectiveStatus(album) !== "trashed";
}

/** Default `expiresAt` = event end + grace window (ADR-0002). */
export function defaultExpiresAt(dateRange: {
    start: number;
    end?: number;
}): number {
    const eventEnd = dateRange.end ?? dateRange.start;
    return eventEnd + ARCHIVE_GRACE_MS;
}

/** Status to restore to after leaving trash. */
export function statusAfterRestore(
    album: Doc<"albums">,
    now: number = Date.now(),
): "active" | "archived" {
    if (album.expiresAt !== undefined && now >= album.expiresAt) return "archived";
    return "active";
}

/** (Re)schedule the `active → archived` flip at `expiresAt`. */
export async function rescheduleArchiveJob(
    ctx: MutationCtx,
    albumId: Id<"albums">,
    album: Doc<"albums">,
    expiresAt: number | undefined,
): Promise<void> {
    if (album.scheduledArchiveId) {
        await ctx.scheduler.cancel(album.scheduledArchiveId);
    }

    const effective = getEffectiveStatus(album);
    if (expiresAt === undefined || effective !== "active") {
        await ctx.db.patch(albumId, { scheduledArchiveId: undefined });
        return;
    }

    const scheduledArchiveId =
        expiresAt <= Date.now()
            ? await ctx.scheduler.runAfter(0, internal.albums.archiveAlbumAtExpiry, { albumId })
            : await ctx.scheduler.runAt(expiresAt, internal.albums.archiveAlbumAtExpiry, { albumId });

    await ctx.db.patch(albumId, { scheduledArchiveId });
}
