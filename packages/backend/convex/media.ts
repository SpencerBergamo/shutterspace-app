import { paginationOptsValidator, PaginationResult } from "convex/server";
import { ConvexError, v } from "convex/values";
import { Media } from "../types/Media";
import { api, internal } from "./_generated/api";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { parseExifToEpoch } from "./lib/dates";
import { albumAllowsUploads, albumIsVisible } from "./lib/albumLifecycle";
import {
    coverFromMedia,
    isCustomCoverObject,
    patchCoverFromLatestReady,
} from "./lib/albumCover";
import {
    MEDIA_DELIVERY_BATCH_LIMIT,
    resolvedMediaForDeliveryValidator,
} from "./lib/mediaDelivery";
import { selectMediaForDelivery } from "./lib/selectMediaForDelivery";
import { adjustStorageUsed, wouldExceedQuota } from "./lib/storage";


// --------------------
// March 2 2026
// --------------------

export const paginateMedia = query({
    args: {
        albumId: v.id('albums'),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, { albumId, paginationOpts }): Promise<PaginationResult<Media>> => {
        const membership = await ctx.runQuery(api.albumMembers.queryMembership, { albumId });
        if (!membership || membership === 'not-a-member') throw new ConvexError('You are not a member of this album');

        const album = await ctx.db.get(albumId);
        if (!album || !albumIsVisible(album)) throw new ConvexError('Album not found');

        const media = await ctx.db.query('media')
            .withIndex('by_albumId', q => q.eq('albumId', albumId))
            .order('desc')
            .paginate(paginationOpts);

        // Dual-read: hide legacy soft-deleted rows until dropLegacyAlbumLifecycleFields.
        return {
            ...media,
            page: media.page.filter(m => !(m as { isDeleted?: boolean }).isDeleted),
        };
    }
})

/**
 * Resolve media docs for batch signing. Verifies every ID belongs to `albumId`
 * (throws on cross-album IDs). Skips missing, soft-deleted, and non-ready rows.
 */
export const resolveMediaForDelivery = internalQuery({
    args: {
        albumId: v.id("albums"),
        mediaIds: v.array(v.id("media")),
    },
    returns: v.array(resolvedMediaForDeliveryValidator),
    handler: async (ctx, { albumId, mediaIds }) => {
        if (mediaIds.length > MEDIA_DELIVERY_BATCH_LIMIT) {
            throw new ConvexError(
                `Too many media IDs (max ${MEDIA_DELIVERY_BATCH_LIMIT})`,
            );
        }

        const album = await ctx.db.get(albumId);
        if (!album || !albumIsVisible(album)) {
            throw new ConvexError("Album not found");
        }

        try {
            const rows = await Promise.all(mediaIds.map((mediaId) => ctx.db.get(mediaId)));
            return selectMediaForDelivery(albumId, rows);
        } catch (e) {
            throw new ConvexError(
                e instanceof Error ? e.message : "Failed to resolve media for delivery",
            );
        }
    },
});

// --------------------
// OLD
// --------------------

export const getMediaForAlbum = query({
    args: {
        albumId: v.id("albums"),
    }, handler: async (ctx, args) => {
        const membership = await ctx.runQuery(api.albumMembers.getMembership, { albumId: args.albumId });
        if (!membership || membership === 'not-a-member') throw new Error('You are not a member of this album');

        return await ctx.db.query('media')
            .withIndex('by_albumId', q => q.eq('albumId', args.albumId))
            .order('desc')
            .collect();
    }
});

export const createMedia = mutation({
    args: {
        albumId: v.id('albums'),
        assetId: v.string(),
        filename: v.string(),
        identifier: v.union(
            v.object({
                type: v.literal('image'),
                imageId: v.string(),
                width: v.number(),
                height: v.number(),
            }),
            v.object({
                type: v.literal('video'),
                videoUid: v.string(),
                duration: v.number(),
                width: v.optional(v.number()),
                height: v.optional(v.number()),
            }),
        ),
        setThumbnail: v.optional(v.boolean()),
        status: v.union(
            v.literal('pending'),
            v.literal('ready'),
            v.literal('error'),
        ),

        size: v.optional(v.number()),
        // Accepts the EXIF DateTimeOriginal string from the client; normalized to
        // epoch ms before storage (ADR-0002).
        dateTaken: v.optional(v.string()),
        location: v.optional(v.object({
            lat: v.number(),
            lng: v.number(),
            name: v.optional(v.string()),
            address: v.optional(v.string()),
        })),
    },
    handler: async (ctx, args) => {
        const membership = await ctx.runQuery(api.albumMembers.getMembership, { albumId: args.albumId });
        if (!membership || membership === 'not-a-member') throw new Error('You are not a member of this album');

        const album = await ctx.db.get(args.albumId);
        if (!album || !albumIsVisible(album)) throw new Error('Album not found');
        if (!albumAllowsUploads(album)) {
            throw new Error('Album is archived and no longer accepts uploads');
        }

        const profile = await ctx.runQuery(api.profile.getProfile);
        if (!profile) throw new Error("User Profile Not Found");

        const mediaId = await ctx.db.insert("media", {
            albumId: args.albumId,
            createdBy: profile._id,
            assetId: args.assetId,
            filename: args.filename,
            identifier: args.identifier,
            size: args.size,
            dateTaken: parseExifToEpoch(args.dateTaken),
            location: args.location,
            status: args.status,
            // Dual-write for older clients filtering `isDeleted`.
            isDeleted: false,
        });

        // ADR-0004: increment global storage usage on commit.
        await adjustStorageUsed(ctx, profile._id, args.size ?? 0);

        const pin = !!args.setThumbnail;
        if (pin || (album.isDynamicThumbnail && args.status === 'ready')) {
            // Pending videos wait for the Stream webhook before becoming cover.
            if (args.status === 'ready') {
                const media = await ctx.db.get(mediaId);
                if (media) {
                    await ctx.db.patch(args.albumId, {
                        cover: coverFromMedia(media),
                        // Dual-write for older clients still reading `thumbnail`.
                        thumbnail: mediaId,
                        ...(pin ? { isDynamicThumbnail: false } : {}),
                        updatedAt: Date.now(),
                    });
                }
            } else if (pin) {
                // Pin requested but not ready yet — flip mode; cover set when ready.
                await ctx.db.patch(args.albumId, {
                    isDynamicThumbnail: false,
                    updatedAt: Date.now(),
                });
            }
        }
    },
})

export const deleteMedia = action({
    args: {
        albumId: v.id('albums'),
        mediaId: v.id('media'),
    }, handler: async (ctx, { albumId, mediaId }) => {
        const profile = await ctx.runQuery(api.profile.getProfile);
        if (!profile) throw new Error("Profile not found");

        const membership = await ctx.runQuery(api.albumMembers.getMembership, { albumId });
        if (!membership || membership === 'not-a-member') throw new Error('You are not a member of this album');

        const media = await ctx.runQuery(internal.media.getMedia, { mediaId });

        const canDelete = membership === 'host' || membership === 'moderator' || media.createdBy === profile._id;
        if (!canDelete) throw new Error("You don't have permission to delete this media");

        await ctx.runMutation(internal.media.deleteMediaDoc, { mediaId });

        if (media.identifier.type === 'image') {
            await ctx.runAction(internal.r2.deleteObject, { objectKey: `album/${albumId}/${media.identifier.imageId}` });
        } else if (media.identifier.type === 'video') {
            await ctx.runAction(internal.cloudflare.deleteVideo, { videoUID: media.identifier.videoUid });
        }

    }
})

export const getMedia = internalQuery({
    args: { mediaId: v.id('media') },
    handler: async (ctx, { mediaId }) => {
        const media = await ctx.db.get(mediaId);
        if (!media) throw new Error("Media not found");

        return media;
    }
})

export const listMediaForAlbum = internalQuery({
    args: { albumId: v.id('albums') },
    handler: async (ctx, { albumId }) => {
        return await ctx.db.query('media')
            .withIndex('by_albumId', q => q.eq('albumId', albumId))
            .collect();
    },
})

/**
 * ADR-0004: quota gate for upload-URL mint time. Throws if the authenticated
 * caller's projected usage would exceed their storage limit.
 */
export const assertStorageWithinQuota = internalQuery({
    args: { incomingSize: v.optional(v.number()) },
    handler: async (ctx, { incomingSize }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error('Not authenticated');

        const profile = await ctx.db.query('profiles')
            .withIndex('by_firebase_uid', q => q.eq('firebaseUID', identity.user_id as string))
            .first();
        if (!profile) throw new Error('User Profile Not Found');

        if (wouldExceedQuota(profile, incomingSize ?? 0)) {
            throw new Error('Storage limit reached. Free up space or upgrade your plan.');
        }
    },
})

export const deleteMediaDoc = internalMutation({
    args: {
        mediaId: v.id("media"),
    }, handler: async (ctx, { mediaId }) => {
        const media = await ctx.db.get(mediaId);
        if (!media) return;

        const album = await ctx.db.get(media.albumId);

        // ADR-0004: decrement global storage usage on hard delete.
        await adjustStorageUsed(ctx, media.createdBy, -(media.size ?? 0));

        // Clear any comments/likes referencing this media.
        const comments = await ctx.db.query('comments')
            .withIndex('by_mediaId', q => q.eq('mediaId', mediaId))
            .collect();
        for (const c of comments) await ctx.db.delete(c._id);

        const likes = await ctx.db.query('likes')
            .withIndex('by_mediaId', q => q.eq('mediaId', mediaId))
            .collect();
        for (const l of likes) await ctx.db.delete(l._id);

        await ctx.db.delete(mediaId);

        if (!album?.cover) return;

        const cover = album.cover;
        const coverRefsMedia =
            cover.mediaId === mediaId ||
            (cover.type === 'image' && media.identifier.type === 'image' && cover.imageId === media.identifier.imageId) ||
            (cover.type === 'video' && media.identifier.type === 'video' && cover.videoUid === media.identifier.videoUid);

        if (!coverRefsMedia) return;

        if (isCustomCoverObject(cover)) {
            // Keep cover.jpg display; only drop the gallery link.
            // Leave legacy `thumbnail` as-is for older clients.
            await ctx.db.patch(album._id, {
                cover: {
                    type: 'image' as const,
                    imageId: cover.imageId,
                    width: cover.width,
                    height: cover.height,
                    size: cover.size,
                },
                updatedAt: Date.now(),
            });
            return;
        }

        if (album.isDynamicThumbnail) {
            await patchCoverFromLatestReady(ctx, album._id, mediaId);
            return;
        }

        // Pinned gallery media was deleted — clear broken pointer.
        await ctx.db.patch(album._id, {
            cover: undefined,
            thumbnail: undefined,
            updatedAt: Date.now(),
        });
    }
});
export const updateMediaStatus = internalMutation({
    args: {
        mediaId: v.id('media'),
        status: v.union(
            v.literal('pending'),
            v.literal('ready'),
            v.literal('error'),
        ),
    },
    handler: async (ctx, { mediaId, status }) => {
        await ctx.db.patch(mediaId, { status });

        if (status !== 'ready') return;
        const media = await ctx.db.get(mediaId);
        if (!media) return;
        const album = await ctx.db.get(media.albumId);
        if (!album) return;
        if (album.isDynamicThumbnail || !album.cover) {
            await ctx.db.patch(media.albumId, {
                cover: coverFromMedia(media),
                thumbnail: mediaId,
                updatedAt: Date.now(),
            });
        }
    },
})

export const updateMediaVideoStatus = internalMutation({
    args: {
        videoUid: v.string(),
        status: v.union(
            v.literal('pending'),
            v.literal('ready'),
            v.literal('error'),
        ),
    }, handler: async (ctx, { videoUid, status }) => {
        const media = await ctx.db.query('media').withIndex('by_videoUid', q => q.eq('identifier.videoUid', videoUid)).first();
        if (!media) throw new Error("Media not found");

        await ctx.db.patch(media._id, { status });

        if (status !== 'ready') return;
        const album = await ctx.db.get(media.albumId);
        if (!album) return;
        if (album.isDynamicThumbnail || !album.cover) {
            await ctx.db.patch(media.albumId, {
                cover: coverFromMedia({ ...media, status: 'ready' }),
                thumbnail: media._id,
                updatedAt: Date.now(),
            });
        }
    },
})
