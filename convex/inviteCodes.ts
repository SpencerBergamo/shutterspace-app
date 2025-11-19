import { Invitation } from "@/types/Invites";
import { MediaIdentifier } from "@/types/Media";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";


export const createInvite = action({
    args: {
        albumId: v.id('albums'),
    }, handler: async (ctx, { albumId }): Promise<string> => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error('Not authenticated');
        const profileId = identity.user_id as Id<'profiles'>;

        const code = await ctx.runAction(internal.crypto.generateInviteCode, { length: 10 });

        await ctx.runMutation(internal.inviteCodes.insert, {
            code,
            albumId,
            createdBy: profileId,
            role: 'member',
        });

        return code;
    },
});

export const getInviteCode = query({
    args: { albumId: v.id('albums') },
    handler: async (ctx, { albumId }): Promise<string> => {
        const membership = await ctx.runQuery(api.albumMembers.getMembership, { albumId });
        if (!membership) throw new Error('Not a member of this album');

        const inviteCode = await ctx.db.query('inviteCodes')
            .withIndex('by_albumId', q => q.eq('albumId', albumId))
            .first();

        if (!inviteCode) throw new Error('No invite code found');

        return inviteCode.code;
    }
})

export const openInvite = query({
    args: { code: v.string() },
    handler: async (ctx, { code }): Promise<Invitation> => {
        const invite = await ctx.db.query('inviteCodes')
            .withIndex('by_code', q => q.eq('code', code))
            .first();
        if (!invite) throw new Error('Invalid invite code');

        const album = await ctx.db.get(invite.albumId);
        if (!album || album.isDeleted) throw new Error('Album not found or deleted');

        const sender = await ctx.db.get(invite.createdBy);
        if (!sender) throw new Error('Sender\'s profile not found');

        let albumCover: MediaIdentifier | undefined;
        if (album.thumbnail) {
            const media = await ctx.db.get(album.thumbnail);
            albumCover = media?.identifier ?? undefined;
        }

        return {
            sender: sender.nickname,
            avatarUrl: undefined,
            title: album.title,
            description: album.description,
            cover: albumCover,
            role: invite.role,
            dateRange: album.dateRange,
            location: album.location,
            message: undefined,
        }
    }
})

export const acceptInvite = mutation({
    args: {
        code: v.string(),
    },
    handler: async (ctx, { code }) => {
        const invite = await ctx.db.query('inviteCodes')
            .withIndex('by_code', q => q.eq('code', code))
            .first();
        if (!invite) throw new Error('Invalid invite code');

        const profile = await ctx.runQuery(api.profile.getProfile);
        if (!profile) throw new Error('Profile not found');

        await ctx.db.insert('albumMembers', {
            albumId: invite.albumId,
            profileId: profile._id,
            role: invite.role,
            joinedAt: Date.now(),
        });
    }
})

// --- Internal ---

export const insert = internalMutation({
    args: {
        code: v.string(),
        albumId: v.id('albums'),
        createdBy: v.id('profiles'),
        role: v.union(
            v.literal('member'),
            v.literal('moderator'),
        ),
    }, handler: async (ctx, { code, albumId, createdBy, role }): Promise<Id<'inviteCodes'>> => {
        return await ctx.db.insert('inviteCodes', {
            code,
            albumId,
            createdBy,
            role,
        });
    },
});


export const getInvite = internalQuery({
    args: { code: v.string() },
    handler: async (ctx, { code }) => {
        const invite = await ctx.db.query('inviteCodes')
            .withIndex('by_code', q => q.eq('code', code))
            .first();

        return invite;
    },
});