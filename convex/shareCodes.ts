import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { action, internalMutation } from "./_generated/server";

export const create = action({
    args: {}, handler: async (ctx): Promise<string> => {
        const profile = await ctx.runQuery(api.profile.getProfile);
        const shareCode = profile.shareCode;
        if (shareCode) return shareCode;

        const newCode = await ctx.runAction(internal.crypto.generateRandomCode, { length: 6 });
        await ctx.runMutation(internal.shareCodes.update, { profileId: profile._id, shareCode: newCode });
        return newCode;
    }
})

// --- Internal ---

export const update = internalMutation({
    args: {
        profileId: v.id('profiles'),
        shareCode: v.string(),
    }, handler: async (ctx, { profileId, shareCode }) => {
        return await ctx.db.patch(profileId, { shareCode });
    }
})