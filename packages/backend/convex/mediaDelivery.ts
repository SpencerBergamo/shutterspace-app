"use node";

import { ConvexError, v } from "convex/values";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { action } from "./_generated/server";
import { signStreamDeliveryUrl } from "./cloudflare";
import {
    MEDIA_DELIVERY_BATCH_LIMIT,
    mediaDeliveryEntryValidator,
} from "./lib/mediaDelivery";
import { signGalleryImageUrl } from "./r2";

type MediaDeliveryEntry = {
    mediaId: Id<"media">;
    kind: "image" | "video_thumbnail";
    url: string;
    expiresAt: number;
};

/**
 * Batch-mint signed delivery URLs for a page of gallery media.
 *
 * Security:
 * - membership checked once for the album
 * - each media ID is resolved server-side and must belong to the album
 * - client-supplied R2 keys / Stream UIDs are never trusted
 *
 * Docs:
 * - https://docs.convex.dev/functions/actions
 * - https://developers.cloudflare.com/r2/api/s3/presigned-urls/
 * - https://developers.cloudflare.com/stream/viewing-videos/securing-your-stream/
 */
export const getMediaDeliveryUrls = action({
    args: {
        albumId: v.id("albums"),
        mediaIds: v.array(v.id("media")),
    },
    returns: v.array(mediaDeliveryEntryValidator),
    handler: async (ctx, { albumId, mediaIds }): Promise<MediaDeliveryEntry[]> => {
        if (mediaIds.length === 0) return [];
        if (mediaIds.length > MEDIA_DELIVERY_BATCH_LIMIT) {
            throw new ConvexError(
                `Too many media IDs (max ${MEDIA_DELIVERY_BATCH_LIMIT})`,
            );
        }

        const membership = await ctx.runQuery(api.albumMembers.getMembership, { albumId });
        if (!membership || membership === "not-a-member") {
            throw new ConvexError("Not a member of this album");
        }

        const resolved: Array<{
            mediaId: Id<"media">;
            kind: "image" | "video";
            objectId: string;
        }> = await ctx.runQuery(internal.media.resolveMediaForDelivery, {
            albumId,
            mediaIds,
        });

        const entries: MediaDeliveryEntry[] = await Promise.all(
            resolved.map(async (item): Promise<MediaDeliveryEntry> => {
                if (item.kind === "image") {
                    const { url, expiresAt } = await signGalleryImageUrl(
                        albumId,
                        item.objectId,
                    );
                    return {
                        mediaId: item.mediaId,
                        kind: "image",
                        url,
                        expiresAt,
                    };
                }

                const { url, expiresAt } = await signStreamDeliveryUrl(
                    item.objectId,
                    "thumbnail",
                );
                return {
                    mediaId: item.mediaId,
                    kind: "video_thumbnail",
                    url,
                    expiresAt,
                };
            }),
        );

        return entries;
    },
});
