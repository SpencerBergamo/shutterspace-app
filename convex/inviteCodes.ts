import { InviteContent } from "@/types/Invites";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { action, internalMutation, internalQuery } from "./_generated/server";

export const createInvite = action({
    args: {
        albumId: v.id('albums'),
        createdBy: v.id('profiles'),
        role: v.union(
            v.literal('member'),
            v.literal('moderator'),
        ),
    }, handler: async (ctx, { albumId, createdBy, role }): Promise<Id<'inviteCodes'>> => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error('Not authenticated');

        const membership = await ctx.runQuery(api.albums.getMembership, {
            albumId: albumId,
            profileId: createdBy,
        });
        if (!membership) throw new Error('You are not a member of this album');

        const isHost = membership === 'host';
        const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 3; // 3 days

        const code = await ctx.runAction(internal.crypto.generateInviteCode, {});

        return await ctx.runMutation(internal.inviteCodes.create, {
            code,
            albumId,
            createdBy,
            expiresAt,
            role: isHost ? role : 'member',
        });

    },
});

export const openInvite = action({
    args: { code: v.string() },
    handler: async (ctx, { code }): Promise<InviteContent> => {
        const invite = await ctx.runQuery(internal.inviteCodes.getInvite, { code });
        if (!invite) throw new Error('Invalid invite code');

        const album = await ctx.runQuery(internal.albums.getAlbumById, { albumId: invite.albumId });
        if (!album || album.isDeleted) throw new Error('Album may have been deleted');

        const profile = await ctx.runQuery(internal.profile.getProfileById, { profileId: invite.createdBy });
        if (!profile) throw new Error('Profile not found');

        let coverUrl: string | undefined;
        if (album.thumbnail) {
            const media = await ctx.runQuery(api.media.getMediaById, { mediaId: album.thumbnail });
            if (media) {
                const type = media.identifier.type;
                if (type === 'image') {
                    coverUrl = await ctx.runAction(internal.cloudflare.imageDeliveryURL, {
                        imageId: media.identifier.imageId,
                        expires: invite.expiresAt,
                    });
                } else if (type === 'video') {
                    const videoUID = media.identifier.videoUid;
                    const token = await ctx.runAction(internal.cloudflare.videoPlaybackToken, {
                        videoUID: videoUID,
                        expires: invite.expiresAt,
                    });
                    coverUrl = `https://customer-${process.env.CLOUDFLARE_CUSTOMER_CODE}.cloudflarestream.com/${videoUID}/thumbnails/thumbnail.jpg?token=${token}`;
                }
            }
        }

        return {
            _id: invite._id,
            _creationTime: invite._creationTime,
            code: invite.code,
            albumId: invite.albumId,
            createdBy: invite.createdBy,
            expiresAt: invite.expiresAt,
            role: invite.role,
            sender: profile.nickname,
            avatarUrl: undefined,
            title: album.title,
            description: album.description,
            coverUrl: coverUrl,
            dateRange: album.dateRange,
            location: album.location,
            message: undefined,
        }
    },
});

// --- Internal ---

export const create = internalMutation({
    args: {
        code: v.string(),
        albumId: v.id('albums'),
        createdBy: v.id('profiles'),
        expiresAt: v.number(),
        role: v.union(
            v.literal('member'),
            v.literal('moderator'),
        ),
    }, handler: async (ctx, { code, albumId, createdBy, expiresAt, role }): Promise<Id<'inviteCodes'>> => {
        return await ctx.db.insert('inviteCodes', {
            code,
            albumId,
            createdBy,
            expiresAt,
            role,
        });
    },
});

export const expire = internalMutation({
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

export const getInvite = internalQuery({
    args: { code: v.string() },
    handler: async (ctx, { code }) => {
        const invite = await ctx.db.query('inviteCodes')
            .withIndex('by_code', q => q.eq('code', code))
            .first();
        if (!invite || invite.expiresAt < Date.now()) throw new Error('Invite code has expired');

        return invite;
    },
});