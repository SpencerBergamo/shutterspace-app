import { v } from "convex/values";
import { Doc, Id } from "../_generated/dataModel";
import { MutationCtx, QueryCtx } from "../_generated/server";

/** Stable R2 filename for custom album covers (always JPEG). */
export const CUSTOM_COVER_IMAGE_ID = "cover.jpg";

export const albumCoverValidator = v.union(
    v.object({
        type: v.literal("image"),
        imageId: v.string(),
        width: v.number(),
        height: v.number(),
        size: v.optional(v.number()),
        mediaId: v.optional(v.id("media")),
    }),
    v.object({
        type: v.literal("video"),
        videoUid: v.string(),
        duration: v.number(),
        width: v.optional(v.number()),
        height: v.optional(v.number()),
        mediaId: v.optional(v.id("media")),
    }),
);

export type AlbumCover = Doc<"albums">["cover"];

export function coverObjectKey(albumId: Id<"albums">): string {
    return `album/${albumId}/${CUSTOM_COVER_IMAGE_ID}`;
}

export function galleryObjectKey(albumId: Id<"albums">, imageId: string): string {
    return `album/${albumId}/${imageId}`;
}

export function isCustomCoverObject(
    cover: NonNullable<AlbumCover>,
): cover is Extract<NonNullable<AlbumCover>, { type: "image" }> {
    return cover.type === "image" && cover.imageId === CUSTOM_COVER_IMAGE_ID;
}

/** Build a denormalized cover from a gallery media row. */
export function coverFromMedia(media: Doc<"media">): NonNullable<AlbumCover> {
    if (media.identifier.type === "image") {
        return {
            type: "image",
            imageId: media.identifier.imageId,
            width: media.identifier.width,
            height: media.identifier.height,
            size: media.size,
            mediaId: media._id,
        };
    }

    return {
        type: "video",
        videoUid: media.identifier.videoUid,
        duration: media.identifier.duration,
        width: media.identifier.width,
        height: media.identifier.height,
        mediaId: media._id,
    };
}

export function coverCacheKey(cover: NonNullable<AlbumCover>): string {
    if (cover.type === "image") {
        return cover.mediaId ? `${cover.imageId}:${cover.mediaId}` : cover.imageId;
    }
    return cover.mediaId ? `${cover.videoUid}:${cover.mediaId}` : cover.videoUid;
}

/** Latest ready media for dynamic cover fallback / repoint. */
export async function getLatestReadyMedia(
    ctx: QueryCtx | MutationCtx,
    albumId: Id<"albums">,
    excludeMediaId?: Id<"media">,
): Promise<Doc<"media"> | null> {
    const media = await ctx.db
        .query("media")
        .withIndex("by_albumId", (q) => q.eq("albumId", albumId))
        .order("desc")
        .collect();

    for (const m of media) {
        if (excludeMediaId && m._id === excludeMediaId) continue;
        if (m.status !== "ready") continue;
        return m;
    }
    return null;
}

export async function patchCoverFromLatestReady(
    ctx: MutationCtx,
    albumId: Id<"albums">,
    excludeMediaId?: Id<"media">,
): Promise<void> {
    const latest = await getLatestReadyMedia(ctx, albumId, excludeMediaId);
    await ctx.db.patch(albumId, {
        cover: latest ? coverFromMedia(latest) : undefined,
        // Dual-write for older clients still reading `thumbnail`.
        thumbnail: latest?._id,
        updatedAt: Date.now(),
    });
}
