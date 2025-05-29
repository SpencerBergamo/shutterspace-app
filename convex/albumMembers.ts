import { v } from "convex/values";
import { query } from "./_generated/server";

export const isMember = query({
    args: {
        albumId: v.id("albums"),
        profileId: v.id("profiles"),
    }, handler: async (ctx, { albumId, profileId }) => {
        const member = await ctx.db.query("albumMembers")
            .withIndex("by_album_profileId", q => q.eq("albumId", albumId).eq("profileId", profileId))
            .first();

        return !!member;
    }
})