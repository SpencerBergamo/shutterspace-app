// where we make the request to the Profile convex table

import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";


export const getProfile = query({
    args: {
        userId: v.string()
    }, handler: async (ctx, { userId }) => {
        const profile = await ctx.db.get(userId as Id<'profiles'>);

        if (!profile) return null;

        return {
            _id: profile._id,
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