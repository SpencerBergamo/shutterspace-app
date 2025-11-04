import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { internalMutation } from "./_generated/server";

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
        code: v.string(),
        expiresAt: v.number(),

    },
    handler: async (ctx, args): Promise<Id<'inviteCodes'>> => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error('Unauthorized');

        const membership = await ctx.runQuery(api.albums.getAlbumMembership, {
            albumId: args.albumId,
            profileId: args.createdBy,
        });
        if (!membership) throw new Error('Unauthorized');

        const isHost = membership === 'host';

        const inviteCodeId = await ctx.db.insert('inviteCodes', {
            code: args.code,
            albumId: args.albumId,
            createdBy: args.createdBy,
            expiresAt: args.expiresAt,
            role: isHost ? args.role : 'member'
        });

        await ctx.scheduler.runAfter(
            args.expiresAt - Date.now(),
            internal.inviteCodes.expireInviteCode, { inviteCodeId }
        );

        return inviteCodeId;
    }
});