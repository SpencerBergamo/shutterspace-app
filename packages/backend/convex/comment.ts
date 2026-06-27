import { ConvexError, v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { mutation, query, QueryCtx } from "./_generated/server";
import { deriveEffectiveRole, getCurrentProfile } from "./albumMembers";
import { albumIsVisible } from "./lib/albumLifecycle";

/**
 * Resolve the media, its (visible) album, and the caller's effective role.
 * Throws if not authenticated, media/album missing, album trashed, or caller
 * is not an active member (ADR-0004 social actions require membership).
 */
async function requireMediaMembership(ctx: QueryCtx, mediaId: Id<"media">) {
    const profile = await getCurrentProfile(ctx);
    if (!profile) throw new ConvexError("User Not Found");

    const media = await ctx.db.get(mediaId);
    if (!media) throw new ConvexError("Media not found");

    const album = await ctx.db.get(media.albumId);
    if (!album || !albumIsVisible(album)) throw new ConvexError("Album not found");

    const role = await deriveEffectiveRole(ctx, media.albumId, profile._id);
    if (role === "not-a-member") throw new ConvexError("You are not a member of this album");

    return { profile, media, album, role };
}

export const getMediaComments = query({
    args: { mediaId: v.id("media") },
    handler: async (ctx, args) => {
        return await ctx.db.query("comments")
            .withIndex("by_mediaId_createdAt", q => q.eq("mediaId", args.mediaId))
            .order("desc")
            .collect();
    }
})

/**
 * ADR-0004: any active album member may comment on any media, including in
 * archived albums. Threading is one level only (a reply may not have a parent
 * that is itself a reply).
 */
export const addComment = mutation({
    args: {
        mediaId: v.id("media"),
        text: v.string(),
        parentCommentId: v.optional(v.id("comments")),
    },
    handler: async (ctx, { mediaId, text, parentCommentId }) => {
        const trimmed = text.trim();
        if (trimmed.length === 0) throw new ConvexError("Comment cannot be empty");
        if (trimmed.length > 2000) throw new ConvexError("Comment is too long");

        const { profile } = await requireMediaMembership(ctx, mediaId);

        if (parentCommentId) {
            const parent = await ctx.db.get(parentCommentId);
            if (!parent || parent.mediaId !== mediaId) throw new ConvexError("Parent comment not found");
            // One level of threading only (ADR-0004).
            if (parent.parentCommentId) throw new ConvexError("Replies cannot be nested further");
        }

        return await ctx.db.insert("comments", {
            mediaId,
            createdBy: profile._id,
            text: trimmed,
            createdAt: Date.now(),
            parentCommentId,
        });
    }
})

/**
 * ADR-0004: the author may delete their own comment; a Moderator or Host may
 * delete any comment (flat content moderation, consistent with media).
 * Deleting a top-level comment also removes its direct replies.
 */
export const deleteComment = mutation({
    args: { commentId: v.id("comments") },
    handler: async (ctx, { commentId }) => {
        const comment = await ctx.db.get(commentId);
        if (!comment) return;

        const { profile, role } = await requireMediaMembership(ctx, comment.mediaId);

        const isAuthor = comment.createdBy === profile._id;
        const isModeratorOrHost = role === "host" || role === "moderator";
        if (!isAuthor && !isModeratorOrHost) {
            throw new ConvexError("You don't have permission to delete this comment");
        }

        // Remove direct replies when deleting a top-level comment.
        if (!comment.parentCommentId) {
            const replies = await ctx.db.query("comments")
                .withIndex("by_parentCommentId", q => q.eq("parentCommentId", commentId))
                .collect();
            for (const reply of replies) await ctx.db.delete(reply._id);
        }

        await ctx.db.delete(commentId);
    }
})
