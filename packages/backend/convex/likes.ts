import { ConvexError, v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { mutation, query, QueryCtx } from "./_generated/server";
import { deriveEffectiveRole, getCurrentProfile } from "./albumMembers";
import { albumIsVisible } from "./lib/albumLifecycle";

async function requireMediaMembership(ctx: QueryCtx, mediaId: Id<"media">) {
    const profile = await getCurrentProfile(ctx);
    if (!profile) throw new ConvexError("User Not Found");

    const media = await ctx.db.get(mediaId);
    if (!media) throw new ConvexError("Media not found");

    const album = await ctx.db.get(media.albumId);
    if (!album || !albumIsVisible(album)) throw new ConvexError("Album not found");

    const role = await deriveEffectiveRole(ctx, media.albumId, profile._id);
    if (role === "not-a-member") throw new ConvexError("You are not a member of this album");

    return { profile, media };
}

/** Like count for a media plus whether the caller has liked it. */
export const getMediaLikes = query({
    args: { mediaId: v.id("media") },
    returns: v.object({ count: v.number(), likedByMe: v.boolean() }),
    handler: async (ctx, { mediaId }) => {
        const likes = await ctx.db.query("likes")
            .withIndex("by_mediaId", q => q.eq("mediaId", mediaId))
            .collect();

        const profile = await getCurrentProfile(ctx);
        const likedByMe = profile
            ? likes.some(l => l.profileId === profile._id)
            : false;

        return { count: likes.length, likedByMe };
    }
})

/**
 * ADR-0004: any member may toggle one like per media (like/unlike). Likes are
 * not moderatable — only the liker can unlike. Allowed on any album status
 * except trashed (which is hidden from everyone).
 */
export const toggleLike = mutation({
    args: { mediaId: v.id("media") },
    returns: v.object({ liked: v.boolean() }),
    handler: async (ctx, { mediaId }) => {
        const { profile } = await requireMediaMembership(ctx, mediaId);

        const existing = await ctx.db.query("likes")
            .withIndex("by_mediaId_profileId", q => q.eq("mediaId", mediaId).eq("profileId", profile._id))
            .first();

        if (existing) {
            await ctx.db.delete(existing._id);
            return { liked: false };
        }

        await ctx.db.insert("likes", {
            mediaId,
            profileId: profile._id,
            createdAt: Date.now(),
        });
        return { liked: true };
    }
})
