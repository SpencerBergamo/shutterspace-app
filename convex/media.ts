import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createMedia = mutation({
    args: {
        albumId: v.id("albums"),
        uploadedById: v.id("profiles"),
        uploadedAt: v.number(),
        filename: v.string(),
        downloadUrl: v.string(),
        type: v.union(v.literal("image"), v.literal("video")),
        width: v.number(),
        height: v.number(),
        duration: v.optional(v.number()),
    }, handler: async (ctx, args) => {
        const membership = await ctx.db
            .query("albumMembers")
            .withIndex("by_album_profileId", (q) => q.eq("albumId", args.albumId)
                .eq("profileId", args.uploadedById))
            .first();

        if (!membership) {
            throw new Error("You are not a member of this album");
        }

        const mediaId = await ctx.db.insert("media", {
            albumId: args.albumId,
            uploadedById: args.uploadedById,
            filename: args.filename,
            downloadUrl: args.downloadUrl,
            type: args.type,
            width: args.width,
            height: args.height,
            duration: args.duration,
            uploadedAt: args.uploadedAt,
        });

        return mediaId;
    }
});

// TODO: add comments and likes to the query later
export const getMediaForAlbum = query({
    args: {
        albumId: v.id("albums"),
        pagination: paginationOptsValidator,
    }, handler: async (ctx, { albumId, pagination }) => {
        const media = await ctx.db.query('media')
            .withIndex('by_albumId', q => q.eq('albumId', albumId))
            .order('desc')
            .paginate(pagination);

        return media;
    }
});

/// I think i would prefer to collect the entire media object than to separate the queries?
/// how does convex order documents in descending order?

export const getByAlbumId = query({
    args: {
        albumId: v.id("albums"),
    },
    handler: async (ctx, args) => {
        const media = await ctx.db.query("media").withIndex("by_albumId", (q) => q.eq("albumId", args.albumId)).order("desc").collect();

        return media;
    }
});

export const deleteMedia = mutation({
    args: {
        mediaId: v.id("media"),
        profileId: v.id("profiles"),
    }, handler: async (ctx, args) => {
        const media = await ctx.db.get(args.mediaId);
        if (!media) { throw new Error("Media not found"); }

        const canDelete = media.uploadedById === args.profileId;

        if (!canDelete) {
            throw new Error("You don't have permission to delete this media");
        }

        await ctx.db.delete(args.mediaId);

        return { success: true };
    }
})