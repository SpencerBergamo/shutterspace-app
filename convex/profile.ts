// where we make the request to the Profile convex table

import { v } from "convex/values";
import { query } from "./_generated/server";


export const getProfile = query({
    args: {
        userId: v.id('profiles')
    }, handler: async (ctx, { userId }) => {
        const profile = await ctx.db.get(userId);

        if (!profile) return null;

        return {
            _id: profile._id,
            joined: profile.joined,
            authProvider: profile.authProvider,
            email: profile.email,
            avatarUrl: profile.avatarUrl,
            nickname: profile.nickname,
        }
    }
});