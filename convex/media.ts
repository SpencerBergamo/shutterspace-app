import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createMedia = mutation({
    args: {
        albumId: v.id('albums'),
        uploaderId: v.id('profiles'),
        fileType: v.union(v.literal('image'), v.literal('video')),
        filename: v.string(),
        uploadedAt: v.number(),
        imageId: v.string(),
        size: v.optional(v.number()),
        width: v.optional(v.number()),
        height: v.optional(v.number()),
        duration: v.optional(v.number()),
        dateTaken: v.optional(v.string()),
        location: v.optional(v.object({
            lat: v.number(),
            lng: v.number(),
            name: v.optional(v.string()),
            address: v.optional(v.string()),
        })),
    }, handler: async (ctx, args) => {
        return await ctx.db.insert("media", {
            albumId: args.albumId,
            uploaderId: args.uploaderId,
            fileType: args.fileType,
            filename: args.filename,
            uploadedAt: args.uploadedAt,
            imageId: args.imageId,
            size: args.size,
            width: args.width,
            height: args.height,
            duration: args.duration,
            dateTaken: args.dateTaken,
            location: args.location,
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

        const canDelete = membership.role === 'host' || membership.role === 'moderator' || media.uploaderId === profileId;
        if (!canDelete) throw new Error("You don't have permission to delete this media");

        await ctx.db.delete(mediaId);
    }
});
