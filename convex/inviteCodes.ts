import { Invitation } from "@/src/types/Invites";
import { MediaIdentifier } from "@/src/types/Media";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { internalMutation, mutation, query } from "./_generated/server";

export const getInviteCode = query({
    args: { albumId: v.id('albums') },
    handler: async (ctx, { albumId }): Promise<string | undefined> => {
        const membership = await ctx.runQuery(api.albumMembers.getMembership, { albumId });
        if (!membership) throw new Error('Not a member of this album');

        const invite = await ctx.db.query('inviteCodes')
            .withIndex('by_albumId', q => q.eq('albumId', albumId))
            .first();

        return invite?.code;
    }
})

export const openInvite = query({
    args: { code: v.string() },
    handler: async (ctx, { code }): Promise<Invitation | null> => {
        const invite = await ctx.db.query('inviteCodes')
            .withIndex('by_code', q => q.eq('code', code))
            .first();
        if (!invite) return null;

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
            albumId: album._id,
            sender: sender.nickname,
            ssoAvatarUrl: sender.ssoAvatarUrl,
            avatarKey: sender.avatarKey,
            title: album.title,
            description: album.description,
            cover: albumCover,
            role: invite.role,
            created: album._creationTime,
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

        const openInvites = invite.openInvites ?? true;
        const role = openInvites ? invite.role : 'pending';

        await ctx.db.insert('albumMembers', {
            albumId: invite.albumId,
            profileId: profile._id,
            role,
            joinedAt: Date.now(),
        });
    }
})

// // --- Internal ---

export const addCode = internalMutation({
    args: {
        code: v.string(),
        createdBy: v.id('profiles'),
        albumId: v.id('albums'),
        role: v.union(
            v.literal('member'),
            v.literal('moderator'),
        ),
        openInvites: v.boolean(),
    }, handler: async (ctx, { code, createdBy, albumId, role, openInvites }): Promise<Id<'inviteCodes'>> => {
        return await ctx.db.insert('inviteCodes', {
            code,
            albumId,
            createdBy,
            role,
            openInvites,
        });
    },
});