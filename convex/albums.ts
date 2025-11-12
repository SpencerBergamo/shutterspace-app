import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { internalMutation, mutation, query } from "./_generated/server";

export const getMembership = query({
    args: {
        albumId: v.id('albums'),
        profileId: v.id('profiles'),
    }, handler: async (ctx, { albumId, profileId }) => {
        const membership = await ctx.db
            .query('albumMembers')
            .withIndex('by_album_profileId', q => q.eq('albumId', albumId)
                .eq('profileId', profileId))
            .unique();

        return membership?.role;
    }
});

export const getUserAlbums = query({
    args: {
        profileId: v.id('profiles'),
    }, handler: async (ctx, { profileId }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not Authenticated");

        const memberships = await ctx.db
            .query('albumMembers')
            .withIndex('by_profileId', q => q.eq('profileId', profileId))
            .collect();

        if (memberships.length === 0) return [];

        const docs = await Promise.all(
            memberships.map((m) => ctx.db.get(m.albumId))
        );

        const albums = docs.filter((album): album is Doc<'albums'> => album !== null);

        return albums.sort((a, b) => b.updatedAt - a.updatedAt);
    },
});

export const getViaInviteCode = query({
    args: {
        inviteCode: v.string()
    },
    handler: async (ctx, { inviteCode }) => {
        const invite = await ctx.db.query('inviteCodes')
            .withIndex('by_code', q => q.eq('code', inviteCode))
            .first();
        if (!invite) throw new Error('Invalid invite code');

        const album = await ctx.db.get(invite.albumId);
        if (!album || album.isDeleted) throw new Error('Album not found');

        return album;
    },
});

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
})

export const getPublicAlbumInfo = query({
    args: {
        albumId: v.id('albums'),
    }, handler: async (ctx, args) => {
        const album = await ctx.db.get(args.albumId);
        if (!album || album.isDeleted) throw new Error('Album not found');

        return {
            _id: album._id,
            hostId: album.hostId,
            title: album.title,
            description: album.description,
            thumbnail: album.thumbnail,
            dateRange: album.dateRange,
            location: album.location,
            expiresAt: album.expiresAt,
        }
    }
})

export const createAlbum = mutation({
    args: {
        hostId: v.id('profiles'),
        title: v.string(),
        description: v.optional(v.string()),
        thumbnail: v.optional(v.id('media')),
        isDynamicThumbnail: v.boolean(),
        openInvites: v.boolean(),
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
    }, handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const albumId = await ctx.db.insert('albums', {
            hostId: args.hostId,
            title: args.title,
            description: args.description,
            thumbnail: args.thumbnail,
            isDynamicThumbnail: args.isDynamicThumbnail,
            openInvites: args.openInvites,
            dateRange: args.dateRange,
            location: args.location,
            updatedAt: Date.now(),
            expiresAt: args.expiresAt,
            isDeleted: false,
        });

        await ctx.db.insert('albumMembers', {
            albumId,
            profileId: args.hostId,
            role: 'host',
            joinedAt: Date.now(),
        });

        return albumId;
    },
});

export const updateAlbum = mutation({
    args: {
        albumId: v.id('albums'),
        profileId: v.id('profiles'),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        thumbnail: v.optional(v.id('media')),
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
        isDeleted: v.optional(v.boolean()),
    }, handler: async (ctx, { albumId, profileId, ...args }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not Authorized to Update Albums");

        const membership = await ctx.db
            .query('albumMembers')
            .withIndex('by_album_profileId', q => q.eq('albumId', albumId)
                .eq('profileId', profileId as Id<'profiles'>))
            .first();

        if (!membership || !['host', 'moderator'].includes(membership.role)) {
            throw new Error('Not authorized to update this album');
        }

        const album = await ctx.db.get(albumId);
        if (!album) throw new Error('Album not found');

        const updates = {
            title: args.title ?? album.title,
            description: args.description ?? album.description,
            thumbnail: args.thumbnail ?? album.thumbnail,
            isDynamicThumbnail: args.isDynamicThumbnail ?? true,
            openInvites: args.openInvites ?? true,
            dateRange: args.dateRange ?? album.dateRange,
            location: args.location ?? album.location,
            updatedAt: Date.now(),
            expiresAt: args.expiresAt ?? album.expiresAt,
            isDeleted: args.isDeleted ?? false,
        }

        await ctx.db.patch(albumId, updates);

        return albumId;
    },
});

export const updateThumbnail = internalMutation({
    args: {
        albumId: v.id('albums'),
        thumbnail: v.id('media'),
    }, handler: async (ctx, { albumId, thumbnail }) => {
        await ctx.db.patch(albumId, { thumbnail });
    }
})

export const deleteAlbum = mutation({
    args: {
        albumId: v.id('albums'),
    }, handler: async (ctx, { albumId }) => {
        await ctx.db.delete(albumId);
    },
});