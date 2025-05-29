import { v } from "convex/values";
import { query } from "./_generated/server";

export const getMediaComments = query({
    args: { mediaId: v.id("media") },
    handler: async (ctx, args) => {
        return await ctx.db.query("comments")
            .withIndex("by_mediaId", q => q.eq("mediaId", args.mediaId))
            .order("desc")
            .collect();
    }
})