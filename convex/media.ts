import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createMedia = mutation({
    args: {
        albumId: v.id("albums"),
        uploadedById: v.id("profiles"),
        cloudinaryId: v.string(),
        mediaType: v.union(v.literal("image"), v.literal("video")),
        uploadedAt: v.number(),
    }, handler: async (ctx, args) => {
        const membership = await ctx.db.query("albumMembers").withIndex("by_album_profileId", (q) => q.eq("albumId", args.albumId).eq("profileId", args.uploadedById)).first();

        if (!membership) {
            throw new Error("You are not a member of this album");
        }

        const mediaId = await ctx.db.insert("media", {
            albumId: args.albumId,
            uploadedById: args.uploadedById,
            cloudinaryId: args.cloudinaryId,
            mediaType: args.mediaType,
            uploadedAt: args.uploadedAt,
        });

        return mediaId;
    }
});

export const getMediaForAlbum = query({
    args: {
        albumId: v.id("albums"),
        cursor: v.optional(v.string()),
        limit: v.optional(v.number()),
    }, handler: async (ctx, args) => {
        const limit = args.limit ?? 100;
        const cursor = args.cursor ? JSON.parse(args.cursor) : undefined;

        const media = await ctx.db
            .query('media')
            .withIndex('by_albumId', q => q.eq('albumId', args.albumId))
            .order('desc')
            .take(limit + 1);

        const hasMore = media.length > limit;

        const nextCursor = hasMore ? JSON.stringify({
            lastId: media[limit]._id,
            lastUploadedAt: media[limit].uploadedAt,
        }) : null;

        return {
            media: media,
            nextCursor,
            hasMore,
        }
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

        // is user host of media?
        const canDelete = media.uploadedById === args.profileId;

        // we'll now check if user is moderator of album
        if (!canDelete) {
            const membership = await ctx.db.query("albumMembers")
                .withIndex("by_album_profileId", q => q.eq('albumId', media.albumId)
                    .eq("profileId", args.profileId))
                .first();

            if (!membership || (membership.role !== "host" && membership.role !== "moderator")) {
                throw new Error("You don't have permission to delete this media");
            }
        }
        const comments = await ctx.db.query("comments").withIndex("by_mediaId", q => q.eq("mediaId", args.mediaId)).collect();

        const likes = await ctx.db.query("likes").withIndex("by_mediaId", q => q.eq("mediaId", args.mediaId)).collect();

        const reactions = await ctx.db.query("reactions").withIndex("by_mediaId", q => q.eq("mediaId", args.mediaId)).collect();

        await Promise.all([
            ...comments.map((comment => ctx.db.delete(comment._id))),
            ...likes.map((like => ctx.db.delete(like._id))),
            ...reactions.map((reaction => ctx.db.delete(reaction._id))),
        ]);

        await ctx.db.delete(args.mediaId);

        return { success: true };
    }
})