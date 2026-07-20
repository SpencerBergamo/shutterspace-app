import { v } from "convex/values";

/** Signed URL lifetime for R2 GETs and Stream JWT delivery tokens. */
export const MEDIA_DELIVERY_URL_TTL_SECONDS = 3600;

/** Max media IDs accepted by one batch delivery action (matches gallery page size). */
export const MEDIA_DELIVERY_BATCH_LIMIT = 60;

export const mediaDeliveryKindValidator = v.union(
    v.literal("image"),
    v.literal("video_thumbnail"),
);

export const mediaDeliveryEntryValidator = v.object({
    mediaId: v.id("media"),
    kind: mediaDeliveryKindValidator,
    url: v.string(),
    expiresAt: v.number(),
});

export const resolvedMediaForDeliveryValidator = v.object({
    mediaId: v.id("media"),
    kind: v.union(v.literal("image"), v.literal("video")),
    objectId: v.string(),
});
