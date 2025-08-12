// where we make the request to the Profile convex table

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getProfile = query({
    args: {
        fuid: v.string(),
    }, handler: async (ctx, { fuid }) => {
        const session = await ctx.auth.getUserIdentity();
        if (!session) throw new Error('Unauthorized');

        return await ctx.db.query('profiles')
            .withIndex('by_firebase_uid', q => q.eq('firebaseUID', fuid))
            .first();
    }
});

export const updateProfile = mutation({
    args: {
        profileId: v.id('profiles'),
        updates: v.object({
            nickname: v.optional(v.string()),
            avatarUrl: v.optional(v.string()),
        })
    }, handler: async (ctx, { profileId, updates }) => {
        const session = await ctx.auth.getUserIdentity();
        if (!session || session.subject !== profileId) throw new Error('Unauthorized');

        const profile = await ctx.db.get(profileId);
        if (!profile) throw new Error('Profile not found');

        await ctx.db.patch(profileId, updates);
        return await ctx.db.get(profileId);
    },
})