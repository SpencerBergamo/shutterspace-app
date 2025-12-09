import { Profile } from "@/src/types/Profile";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { internalQuery, mutation, query } from "./_generated/server";

export const createProfile = mutation({
    args: {
        nickname: v.optional(v.string()),
        authProvider: v.union(
            v.literal('email'),
            v.literal('google'),
            v.literal('apple'),
        ),
    }, handler: async (ctx, args) => {
        const session = await ctx.auth.getUserIdentity();
        if (!session) throw new Error('Unauthorized');

        const fuid = session.user_id as string;
        const email = session.email as string;

        return await ctx.db.insert('profiles', {
            firebaseUID: fuid,
            joined: Date.now(),
            authProvider: args.authProvider,
            email: email,
            nickname: args.nickname ?? email.split('@')[0],
        })
    }
})

export const getProfile = query({
    args: {}, handler: async (ctx): Promise<Profile | null> => {
        const session = await ctx.auth.getUserIdentity();
        if (!session) throw new Error('Unauthorized');

        const fuid = session.user_id as string;

        const profile = await ctx.db.query('profiles')
            .withIndex('by_firebase_uid', q => q.eq('firebaseUID', fuid))
            .first();

        // if (!profile) throw new Error('Profile not found');

        return profile;
    }
});

export const updateProfile = mutation({
    args: {
        nickname: v.optional(v.string())
    }, handler: async (ctx, { nickname }) => {
        const profile = await ctx.runQuery(api.profile.getProfile);
        if (!profile) return;

        await ctx.db.patch(profile._id, {
            nickname: nickname,
        });
    },
});

export const getUserByShareCode = query({
    args: { code: v.string() },
    handler: async (ctx, { code }) => {
        const profile = await ctx.db.query('profiles')
            .withIndex('by_shareCode', q => q.eq('shareCode', code))
            .first();

        if (!profile) return null;

        return {
            _id: profile._id,
            nickname: profile.nickname,
        };
    }
})

export const deleteProfile = mutation({
    args: {}, handler: async (ctx) => {
        const profile = await ctx.runQuery(api.profile.getProfile);
        if (!profile) throw new Error('Profile not found');

        await ctx.db.delete(profile._id);
    }
})

// --- Internal ---

export const getPublicProfile = internalQuery({
    args: { profileId: v.id('profiles') },
    handler: async (ctx, { profileId }) => {
        const profile = await ctx.db.get(profileId);
        if (!profile) throw new Error('Profile not found');

        return profile;
    },
})