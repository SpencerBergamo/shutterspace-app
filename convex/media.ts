import { Media } from "@/src/types/Media";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";

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

export const getLastMedia = query({
    args: { albumId: v.id('albums') },
    handler: async (ctx, { albumId }): Promise<Media | null> => {
        return await ctx.db.query('media')
            .withIndex('by_albumId', q => q.eq('albumId', albumId))
            .order('desc')
            .first();
    }
})

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

        const profile = await ctx.runQuery(api.profile.getProfile);
        if (!profile) throw new Error("User Profile Not Found");

        const mediaId = await ctx.db.insert("media", {
            albumId: args.albumId,
            createdBy: profile._id,
            assetId: args.assetId,
            filename: args.filename,
            identifier: args.identifier,
            size: args.size,
            dateTaken: args.dateTaken,
            location: args.location,
            status: args.status,
            isDeleted: false,
        });

        await ctx.db.patch(profile._id, {
            storageQuota: (profile.storageQuota ?? 0) + (args.size ?? 0),
        })

        if (args.setThumbnail) {
            await ctx.db.patch(args.albumId, {
                thumbnail: mediaId,
            })
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

export const deleteMediaDoc = internalMutation({
    args: {
        mediaId: v.id("media"),
    }, handler: async (ctx, { mediaId }) => {
        await ctx.db.delete(mediaId);
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
    },
})