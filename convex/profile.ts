// where we make the request to the Profile convex table

import { v } from "convex/values";
import { query } from "./_generated/server";

export const getProfile = query({
    args: {
        firebaseUID: v.string(),
    }, handler: async (ctx, { firebaseUID }) => {
        return await ctx.db.query('profiles')
            .withIndex('by_firebase_uid', q => q.eq('firebaseUID', firebaseUID))
            .first();

        // if (!profile) return null;

        // return {
        //     _id: profile._id,
        //     joined: profile.joined,
        //     authProvider: profile.authProvider,
        //     email: profile.email,
        //     avatarUrl: profile.avatarUrl,
        //     nickname: profile.nickname,
        // }
    }
});