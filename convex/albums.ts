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

        return membership?.role || null;
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

        const albums = await Promise.all(
            memberships.map((m) => ctx.db.get(m.albumId))
        );

        return albums.filter((album): album is Doc<'albums'> => album !== null)
            .sort((a, b) => b.updatedAt - a.updatedAt);
    },
});

export const createAlbum = mutation({
    args: {
        title: v.string(),
        description: v.optional(v.string()),
        openInvites: v.optional(v.boolean()),
        permanentCover: v.optional(v.string()),
        eventDetails: v.optional(v.object({
            date: v.optional(v.number()),
            time: v.optional(v.string()),
            location: v.optional(v.string()),
        })),
    }, handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not Authorized to Create Albums");

        const userId = identity.subject as Id<'profiles'>;

        const albumId = await ctx.db.insert('albums', {
            title: args.title,
            description: args.description,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            hostId: userId,
            joinCode: '',
            openInvites: args.openInvites ?? true,
            permanentCover: args.permanentCover,
            eventDetails: args.eventDetails,
        });

        await ctx.db.insert('albumMembers', {
            albumId,
            profileId: userId,
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
        openInvites: v.optional(v.boolean()),
        permanentCover: v.optional(v.string()),
        eventDetails: v.optional(v.object({
            date: v.optional(v.number()),
            time: v.optional(v.string()),
            location: v.optional(v.string()),
        })),
    }, handler: async (ctx, { albumId, ...updates }) => {
        // const identity = await ctx.auth.getUserIdentity();
        // if (!identity) throw new Error("Not authenticated");

        // // check if any updates were passed
        // if (Object.keys(updates).length === 0) return null;

        // // verify user can update album
        // const album = await ctx.db.get(albumId);
        // if (!album) throw new Error("Album was not found.");

        // const membership = await ctx.db
        //     .query('albumMembers')
        //     .withIndex('by_album_profileId', q => q.eq('albumId', albumId)
        //         .eq('profileId', identity.subject as Id<'profiles'>))
        //     .first();

        // if (!membership || !['host', 'moderator'].includes(membership.role)) {
        //     throw new Error('Not authorized to update this album');
        // }

        await ctx.db.patch(albumId, {
            ...updates,
            updatedAt: Date.now(),
        });

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