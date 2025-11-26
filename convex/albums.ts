import { Album } from "@/types/Album";
import { Media } from "@/types/Media";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";

export const getUserAlbums = query({
    args: {}, handler: async (ctx): Promise<Album[]> => {
        const profile = await ctx.runQuery(api.profile.getProfile);

        const memberships = await ctx.db
            .query('albumMembers')
            .withIndex('by_profileId', q => q.eq('profileId', profile._id))
            .collect();

        if (memberships.length === 0) return [];

        const docs = await Promise.all(
            memberships.map((m) => ctx.db.get(m.albumId))
        );

        const albums = docs.filter((album): album is Doc<'albums'> => album !== null);

        return albums.sort((a, b) => b.updatedAt - a.updatedAt);
    },
});

export const createAlbum = action({
    args: {
        title: v.string(),
        description: v.optional(v.string()),
        openInvites: v.boolean(),
    },
    handler: async (ctx, { title, description, openInvites }): Promise<Id<'albums'>> => {
        const profile = await ctx.runQuery(api.profile.getProfile);

        // create the alblum doc
        const albumId: Id<'albums'> = await ctx.runMutation(internal.albums.insert, { hostId: profile._id, title, description, openInvites });

        // create an invite code entry
        const code: string = await ctx.runAction(internal.crypto.generateRandomCode, { length: 10 });
        await ctx.runMutation(internal.inviteCodes.addCode, { albumId, code, createdBy: profile._id, role: 'member', openInvites });

        // create album member entry: host
        await ctx.runMutation(internal.albumMembers.addMember, {
            albumId,
            profileId: profile._id,
            role: 'host',
        });

        return albumId;
    }
})

export const joinViaInviteCode = mutation({
    args: {
        inviteCode: v.string(),
        profileId: v.id('profiles'),
    }, handler: async (ctx, { inviteCode, profileId }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error('Not authenticated');

        const invite = await ctx.db.query('inviteCodes')
            .withIndex('by_code', q => q.eq('code', inviteCode))
            .first();
        if (!invite) throw new Error('Invalid invite code');

        const role = invite.role;
        const album = await ctx.db.get(invite.albumId);
        if (!album || album.isDeleted) throw new Error('Album not found');

        await ctx.db.insert('albumMembers', {
            albumId: album._id,
            profileId,
            role,
            joinedAt: Date.now(),
        });

    },
});

export const updateAlbum = mutation({
    args: {
        albumId: v.id('albums'),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        isDynamicThumbnail: v.optional(v.boolean()),
        openInvites: v.optional(v.boolean()),
        dateRange: v.optional(v.object({
            start: v.string(),
            end: v.optional(v.string()),
        })),
        location: v.optional(v.object({
            lat: v.number(),
            lng: v.number(),
            name: v.optional(v.string()),
            address: v.optional(v.string()),
        })),
        expiresAt: v.optional(v.number()),
    }, handler: async (ctx, { albumId, ...args }) => {
        const membership = await ctx.runQuery(api.albumMembers.getMembership, { albumId });
        if (!membership || membership === 'not-a-member') throw new Error('Not authorized to update this album');

        const album = await ctx.db.get(albumId);
        if (!album) throw new Error('Album not found');

        const updates = {
            title: args.title ?? album.title,
            description: args.description ?? album.description,
            isDynamicThumbnail: args.isDynamicThumbnail ?? true,
            openInvites: args.openInvites ?? true,
            dateRange: args.dateRange ?? album.dateRange,
            location: args.location ?? album.location,
            updatedAt: Date.now(),
            expiresAt: args.expiresAt ?? album.expiresAt,
        }

        return await ctx.db.patch(albumId, updates);
    },
});

export const deleteAlbum = mutation({
    args: { albumId: v.id('albums') },
    handler: async (ctx, { albumId }) => {
        const membership = await ctx.runQuery(api.albumMembers.getMembership, { albumId });
        if (!membership || membership !== 'host') throw new Error('Not the host of this album');

        const duration = 1000 * 60 * 60 * 24 * 30; // 30 days
        const id = await ctx.scheduler.runAfter(duration, internal.albums.scheduledDeletion, { albumId });

        await ctx.db.patch(albumId, {
            isDeleted: true,
            deletionScheduledAt: Date.now() + duration,
            scheduledDeletionId: id,
        });

        return { success: true, scheduledDeletion }
    }
})

export const cancelAlbumDeletion = mutation({
    args: { albumId: v.id('albums') },
    handler: async (ctx, { albumId }) => {
        const membership = await ctx.runQuery(api.albumMembers.getMembership, { albumId });
        if (!membership || membership !== 'host') throw new Error('Not the host of this album');

        const album = await ctx.db.get(albumId);
        if (!album || !album.scheduledDeletionId) throw new Error('Album not found');

        await ctx.db.system.get(album.scheduledDeletionId);

        await ctx.scheduler.cancel(album.scheduledDeletionId);

        await ctx.db.patch(albumId, {
            isDeleted: false,
            deletionScheduledAt: undefined,
            scheduledDeletionId: undefined,
        });
    }
})

// Public Album Cover Query
export const getAlbumCover = query({
    args: { albumId: v.id('albums') },
    handler: async (ctx, { albumId }): Promise<Media | undefined> => {
        const album = await ctx.db.get(albumId);
        if (!album) throw new Error('Album not found');

        if (album.thumbnail) {
            return await ctx.db.get(album.thumbnail) ?? undefined;
        }

        return undefined;
    }
})

// --- Internal ---
export const insert = internalMutation({
    args: {
        hostId: v.id('profiles'),
        title: v.string(),
        description: v.optional(v.string()),
        openInvites: v.boolean(),
    },
    handler: async (ctx, args): Promise<Id<'albums'>> => {
        return await ctx.db.insert('albums', {
            hostId: args.hostId,
            title: args.title,
            description: args.description,
            openInvites: args.openInvites,
            updatedAt: Date.now(),
            isDynamicThumbnail: true,
            isDeleted: false,
        });
    },
})

export const getAlbumById = internalQuery({
    args: { albumId: v.id('albums') },
    handler: async (ctx, { albumId }) => {
        const album = await ctx.db.get(albumId);
        if (!album || album.isDeleted) throw new Error('Album not found');

        return album;
    },
});

export const updateThumbnail = internalMutation({
    args: {
        albumId: v.id('albums'),
        thumbnail: v.id('media'),
    }, handler: async (ctx, { albumId, thumbnail }) => {
        await ctx.db.patch(albumId, { thumbnail });
    }
});

export const scheduledDeletion = internalMutation({
    args: { albumId: v.id('albums') },
    handler: async (ctx, { albumId }) => {
        await ctx.db.delete(albumId);
    }
})