import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { action, internalMutation } from "./_generated/server";

export const createShareCode = action({
    args: {}, handler: async (ctx): Promise<string> => {
        const profile = await ctx.runQuery(api.profile.getProfile);
        if (!profile) throw new Error('Profile not found');

        const shareCode = await ctx.runAction(internal.crypto.generateRandomCode, { length: 6 });
        await ctx.runMutation(internal.shareCodes.updateShareCode, { profileId: profile._id, shareCode });

        return shareCode;
    }
})


export const updateShareCode = internalMutation({
    args: {
        profileId: v.id('profiles'),
        shareCode: v.string(),
    }, handler: async (ctx, { profileId, shareCode }) => {
        return await ctx.db.patch(profileId, { shareCode });
    }
})