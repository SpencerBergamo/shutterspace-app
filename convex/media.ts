import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createMedia = mutation({
    args: {
        filename: v.string(),
        createdAt: v.number(),
        albumId: v.id("albums"),
        uploadedById: v.id("profiles"),
        uploadedAt: v.number(),
        downloadUrl: v.string(),
        thumbnailUrl: v.string(),
        type: v.union(v.literal("image"), v.literal("video")),
        width: v.number(),
        height: v.number(),
        duration: v.optional(v.number()),
    }, handler: async (ctx, args) => {
        return await ctx.db.insert("media", {
            filename: args.filename,
            createdAt: args.createdAt,
            albumId: args.albumId,
            uploadedById: args.uploadedById,
            downloadUrl: args.downloadUrl,
            thumbnailUrl: args.thumbnailUrl,
            type: args.type,
            width: args.width,
            height: args.height,
            duration: args.duration,
        });
    }
});

// TODO: add comments and likes to the query later
export const getMediaForAlbum = query({
    args: {
        paginationOpts: paginationOptsValidator,
        albumId: v.id("albums"),
    }, handler: async (ctx, args) => {
        return await ctx.db.query('media')
            .withIndex('by_albumId', q => q.eq('albumId', args.albumId))
            .order('desc')
            .paginate(args.paginationOpts);
    }
});


export const deleteMedia = mutation({
    args: {
        mediaId: v.id("media"),
        profileId: v.id("profiles"),
        admin: v.optional(v.boolean()),
    }, handler: async (ctx, args) => {
        const media = await ctx.db.get(args.mediaId);
        if (!media) { throw new Error("Media not found"); }

        const canDelete = media.uploadedById === args.profileId || args.admin;;

        if (!canDelete) {
            throw new Error("You don't have permission to delete this media");
        }

        await ctx.db.delete(args.mediaId);

        return { success: true };
    }
})