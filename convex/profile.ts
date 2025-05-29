// where we make the request to the Profile convex table

import { v } from "convex/values";
import { query } from "./_generated/server";


export const getProfile = query({
    args: {
        userId: v.id('profiles')
    }, handler: async (ctx, { userId }) => {
        const profile = await ctx.db.query('profiles')
            .withIndex('by_userId', q => q.eq('userId', userId))
            .first();

        if (!profile) return null;

        return {
            id: profile._id,
            joined: new Date(profile.joined),
            authProvider: profile.authProvider,
            email: profile.email,
            avatarUrl: profile.avatarUrl,
            nickname: profile.nickname,
            storageUsage: {
                ...profile.storageUsage,
                lastCalculated: new Date(profile.storageUsage.lastCalculated)
            },
            friends: profile.friends.map(friend => ({
                ...friend,
                since: new Date(friend.since)
            })),
            blockedUsers: profile.blockedUsers.map(blocked => ({
                ...blocked,
                since: new Date(blocked.since),
            })),
        }
    }
});