import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

export const getAlbumMembership = query({
    args: {
        albumId: v.id('albums'),
        profileId: v.id('profiles'),
    }, handler: async (ctx, { albumId, profileId }) => {
        const membership = await ctx.db
            .query('albumMembers')
            .withIndex('by_album_profileId', q => q.eq('albumId', albumId)
                .eq('profileId', profileId))
            .first();

        return membership?.role;
    }
});

export const getUserAlbums = query({
    args: {
        profileId: v.id('profiles'),
    }, handler: async (ctx, { profileId }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not Authenticated");

        if (identity) {
            console.log("identity", identity.subject);
        }

        const memberships = await ctx.db
            .query('albumMembers')
            .withIndex('by_profileId', q => q.eq('profileId', profileId))
            .collect();

        if (memberships.length === 0) return [];

        const albums = await Promise.all(
            memberships.map((m) => ctx.db.get(m.albumId))
        );

        return albums.filter((album): album is Doc<'albums'> => album !== null)
            .sort((a, b) => b.updatedAt - a.updatedAt);
    },
});

export const createAlbum = mutation({
    args: {
        hostId: v.id('profiles'),
        title: v.string(),
        description: v.optional(v.string()),
        thumbnailFileId: v.optional(v.id('media')),
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
            thumbnailFileId: args.thumbnailFileId,
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
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        thumbnailFileId: v.optional(v.id('media')),
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
        isDeleted: v.boolean(),
    }, handler: async (ctx, { albumId, ...args }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not Authorized to Update Albums");

        const membership = await ctx.db
            .query('albumMembers')
            .withIndex('by_album_profileId', q => q.eq('albumId', albumId)
                .eq('profileId', identity.subject as Id<'profiles'>))
            .first();

        if (!membership || !['host', 'moderator'].includes(membership.role)) {
            throw new Error('Not authorized to update this album');
        }

        const updates = {
            title: args.title,
            description: args.description,
            thumbnailFileId: args.thumbnailFileId,
            isDynamicThumbnail: args.isDynamicThumbnail,
            openInvites: args.openInvites,
            dateRange: args.dateRange,
            location: args.location,
            updatedAt: Date.now(),
            expiresAt: args.expiresAt,
        }

        await ctx.db.patch(albumId, updates);

        return albumId;
    },
});

export const deleteAlbum = mutation({
    args: {
        albumId: v.id('albums'),
    }, handler: async (ctx, { albumId }) => {
        await ctx.db.delete(albumId);
    },
});