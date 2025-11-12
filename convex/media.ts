import { MediaIdentifier } from "@/types/Media";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { action, internalMutation, mutation, query } from "./_generated/server";

export const uploadMedia = action({
    args: {
        albumId: v.id('albums'),
        profileId: v.id('profiles'),
        files: v.array(v.object({
            uri: v.string(),
            filename: v.string(),
            assetId: v.string(),
            type: v.union(v.literal('image'), v.literal('video')),
            mimeType: v.string(),
            duration: v.optional(v.number()),
            width: v.optional(v.number()),
            height: v.optional(v.number()),
            size: v.optional(v.number()),
            dateTaken: v.optional(v.string()),
            location: v.optional(v.object({
                lat: v.number(),
                lng: v.number(),
                name: v.optional(v.string()),
                address: v.optional(v.string()),
            })),
        })),
    }, handler: async (ctx, { albumId, profileId, files }) => {
        const membership = await ctx.runQuery(api.albums.getMembership, {
            albumId,
            profileId,
        });

        if (!membership) throw new Error('You are not a member of this album');

        for (const file of files) {
            let uploadUrl: string | undefined;
            let identifier: MediaIdentifier | undefined;

            if (file.type === 'image') {
                const response = await ctx.runAction(internal.cloudflare.requestImageUploadURL, {
                    filename: file.filename,
                });

                uploadUrl = response.uploadURL;
                identifier = {
                    type: 'image',
                    imageId: response.id,
                    width: file.width ?? 0,
                    height: file.height ?? 0,
                }

            } else if (file.type === 'video') {
                const response = await ctx.runAction(internal.cloudflare.requestVideoUploadURL, {
                    filename: file.filename,
                });

                uploadUrl = response.uploadURL;
                identifier = {
                    type: 'video',
                    videoUid: response.uid,
                    duration: file.duration ?? 0,
                    width: file.width ?? 0,
                    height: file.height ?? 0,
                }
            }

            if (!uploadUrl || !identifier) throw new Error('Failed to get upload URL or cloudflare ID');

            const mediaId = await ctx.runMutation(internal.media.createMedia, {
                albumId,
                uploaderId: profileId,
                assetId: file.assetId,
                filename: file.filename,
                identifier: identifier,
                size: file.size ?? 0,
                dateTaken: file.dateTaken ?? undefined,
                location: file.location ?? undefined,
                status: file.type === 'video' ? 'pending' : 'ready',
            });

            await ctx.runAction(internal.crypto.uploadFile, {
                uploadURL: uploadUrl,
                uri: file.uri,
                filename: file.filename,
                mimeType: file.mimeType,
            });

            const isLast = file === files.at(-1);

            if (isLast) {
                await ctx.runMutation(internal.albums.updateThumbnail, {
                    albumId,
                    thumbnail: mediaId,
                });
            }
        }
    }
});

export const createMedia = internalMutation({
    args: {
        albumId: v.id('albums'),
        uploaderId: v.id('profiles'),
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
        size: v.optional(v.number()),
        dateTaken: v.optional(v.string()),
        location: v.optional(v.object({
            lat: v.number(),
            lng: v.number(),
            name: v.optional(v.string()),
            address: v.optional(v.string()),
        })),
        status: v.union(
            v.literal('pending'),
            v.literal('ready'),
            v.literal('error'),
        ),
    }, handler: async (ctx, args) => {
        return await ctx.db.insert("media", {
            albumId: args.albumId,
            createdBy: args.uploaderId,
            assetId: args.assetId,
            filename: args.filename,
            identifier: args.identifier,
            size: args.size,
            dateTaken: args.dateTaken,
            location: args.location,
            status: args.status,
            isDeleted: false,
        });
    }
});

// TODO: add comments and likes to the query later
export const getMediaForAlbum = query({
    args: {
        albumId: v.id("albums"),
        profileId: v.id('profiles'),
    }, handler: async (ctx, args) => {
        const membership = await ctx.db.query('albumMembers')
            .withIndex('by_album_profileId', q => q.eq('albumId', args.albumId)
                .eq('profileId', args.profileId))
            .first();

        if (!membership) throw new Error('You are not a member of this album');

        return await ctx.db.query('media')
            .withIndex('by_albumId', q => q.eq('albumId', args.albumId))
            .order('desc')
            .collect();
    }
});

export const getMediaById = query({
    args: {
        mediaId: v.id('media'),
    }, handler: async (ctx, { mediaId }) => {
        return await ctx.db.get(mediaId);
    }
});


export const deleteMedia = mutation({
    args: {
        mediaId: v.id("media"),
        profileId: v.id("profiles"),
    }, handler: async (ctx, { mediaId, profileId }) => {
        const media = await ctx.db.get(mediaId);
        if (!media) throw new Error("Media not found");

        const membership = await ctx.db.query('albumMembers')
            .withIndex('by_profileId', q => q.eq('profileId', profileId))
            .first();

        if (!membership) throw new Error("You are not a member of this album");

        const canDelete = membership.role === 'host' || membership.role === 'moderator' || media.createdBy === profileId;
        if (!canDelete) throw new Error("You don't have permission to delete this media");

        await ctx.db.delete(mediaId);
    }
});

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

export const updateMediaUploadStatusByVideoUid = mutation({
    args: {
        videoUid: v.string(),
        status: v.union(
            v.literal('pending'),
            v.literal('ready'),
            v.literal('error'),
        ),
    }, handler: async (ctx, { videoUid, status }) => {
        const media = await ctx.db.query('media')
            .withIndex('by_videoUid', q => q.eq('identifier.videoUid', videoUid))
            .first();

        if (!media) {
            console.log("Media not found for videoUid: ", videoUid);
            return;
        }

        await ctx.db.patch(media._id, { status: status });
    }
})