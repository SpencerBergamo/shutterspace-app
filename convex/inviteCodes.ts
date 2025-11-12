import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { action, internalMutation, internalQuery } from "./_generated/server";

export const generateInvite = action({
    args: {}, handler: async (ctx, args) => {

        // get identity

        // get media

        // use media to generate cover url

        // insert invite code 

        const code = await ctx.runAction(internal.crypto.generateInviteCode, {});

    },
})

export const expireInviteCode = internalMutation({
    args: {
        inviteCodeId: v.id('inviteCodes'),
    },
    handler: async (ctx, args) => {

        await ctx.db.patch(args.inviteCodeId, {
            expiresAt: 0,
            code: 'expired',
        });
    },
});

export const createInviteCode = internalMutation({
    args: {
        albumId: v.id('albums'),
        createdBy: v.id('profiles'),
        role: v.union(
            v.literal('member'),
            v.literal('moderator'),
        ),
        expiresAt: v.number(),
        code: v.string(),
    },
    handler: async (ctx, args): Promise<Id<'inviteCodes'>> => {
        const inviteCodeId = await ctx.db.insert('inviteCodes', {
            code: args.code,
            albumId: args.albumId,
            createdBy: args.createdBy,
            expiresAt: args.expiresAt,
            role: args.role,
        });

        await ctx.scheduler.runAfter(
            args.expiresAt - Date.now(),
            internal.inviteCodes.expireInviteCode, { inviteCodeId }
        );

        return inviteCodeId;
    }
});

export const getInvite = internalQuery({
    args: {
        inviteCode: v.string(),
    },
    handler: async (ctx, { inviteCode }) => {
        const invite = await ctx.db.query('inviteCodes')
            .withIndex('by_code', q => q.eq('code', inviteCode))
            .first();
        if (!invite) throw new Error('Invalid invite code');

        return invite;
    }
})