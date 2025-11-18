import { Invitation } from "@/types/Invites";
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

        const membership = await ctx.runQuery(api.albumMembers.getMembership, { albumId });
        if (!membership || membership !== 'host') throw new Error('Not the host of this album');

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
        if (!membership || membership !== 'host') throw new Error('Not the host of this album');

        const inviteCode = await ctx.db.query('inviteCodes')
            .withIndex('by_albumId', q => q.eq('albumId', albumId))
            .first();

        if (!inviteCode) throw new Error('No invite code found');

        return inviteCode.code;
    }
})

export const openInvite = action({
    args: { code: v.string() },
    handler: async (ctx, { code }): Promise<Invitation> => {
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
                    });
                } else if (type === 'video') {
                    const videoUID = media.identifier.videoUid;
                    const token = await ctx.runAction(internal.cloudflare.videoPlaybackToken, {
                        videoUID: videoUID,
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

export const acceptInvite = mutation({
    args: {
        inviteCodeId: v.id('inviteCodes'),
    },
    handler: async (ctx, args) => {
        const invite = await ctx.db.get(args.inviteCodeId);
        if (!invite) throw new Error('Invite code not found');

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