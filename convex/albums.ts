import { Album } from "@/src/types/Album";
import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import { api, internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";


// --------------------
// Dec 23 2025
// --------------------
export const queryAlbum = query({
    args: { albumId: v.id('albums') },
    handler: async (ctx, { albumId }) => {
        const membership = await ctx.runQuery(api.albumMembers.queryMembership, { albumId });
        if (!membership || membership === 'not-a-member') return null;

        return await ctx.db.get(albumId);
    }
});

export const queryPaginatedAlbums = query({
    args: {
        albumId: v.id('albums'),
        page: paginationOptsValidator,
    }, handler: async () => {

    }
})

export const createNewAlbum = mutation({
    args: {
        title: v.string(),
        description: v.optional(v.string()),
    }, handler: async (ctx, { title, description }): Promise<Id<'albums'>> => {
        const profile = await ctx.runQuery(api.profile.getProfile);
        if (!profile) throw new ConvexError('No User Found');

        const albumId = await ctx.db.insert('albums', {
            hostId: profile._id,
            title,
            description,
            isDynamicThumbnail: true,
            openInvites: true,
            updatedAt: Date.now(),
            isDeleted: false,
        });

        await ctx.db.insert('albumMembers', {
            albumId,
            profileId: profile._id,
            role: 'host',
            joinedAt: Date.now(),
        })

        return albumId;
    }
});

export const createAlbumInviteCode = action({
    args: { albumId: v.id('albums') }, handler: async (ctx, { albumId }) => {
        const profile = await ctx.runQuery(api.profile.getUserProfile);
        const membership = await ctx.runQuery(api.albumMembers.getMembership, { albumId });

        if (!profile || !membership || membership === 'not-a-member') throw new ConvexError("Not Authorized");




    }
})

// --------------------
// OLD
// --------------------
export const getUserAlbums = query({
    args: {}, handler: async (ctx): Promise<Album[]> => {
        const profile = await ctx.runQuery(api.profile.getProfile);
        if (!profile) throw new ConvexError('User not found');

        // get memberships the user has
        const memberships = await ctx.db
            .query('albumMembers')
            .withIndex('by_profileId', q => q.eq('profileId', profile._id))
            .collect();
        if (memberships.length === 0) return [];

        // get album docs for each membership
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
    handler: async (ctx, { title, description, openInvites }): Promise<Id<'albums'> | null> => {
        const profile = await ctx.runQuery(api.profile.getProfile);
        if (!profile) return null;

        // create the alblum doc
        const albumId: Id<'albums'> = await ctx.runMutation(internal.albums.createAlbumDoc, { hostId: profile._id, title, description, openInvites });

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
    }, handler: async (ctx, { albumId, title, description }) => {
        const profile = await ctx.runQuery(api.profile.getUserProfile);
        if (!profile) throw new ConvexError('No User Found');

        const albumMemberships = await ctx.runQuery(api.albumMembers.queryAllMemberships, { albumId });
        const memberRole = albumMemberships.find(m => m.profileId === profile._id)?.role ?? 'not-a-member';
        if (!memberRole || (memberRole !== 'host' && memberRole !== 'moderator')) throw new ConvexError('Not Authorized');

        const album = await ctx.db.get(albumId);
        if (!album) throw new ConvexError('Album not found');

        const updates = {
            title: title ?? album.title,
            description: description ?? album.description,
            updatedAt: Date.now(),
        }

        await Promise.all(albumMemberships.map(async (m) => {
            await ctx.db.patch(m._id, {
                updatedAt: updates.updatedAt,
            })
        }));

        return await ctx.db.patch(albumId, updates);
    },
});

// Public API for deleting an album and all its media
export const deleteAlbum = action({
    args: { albumId: v.id('albums') },
    handler: async (ctx, { albumId }) => {
        const membership = await ctx.runQuery(api.albumMembers.getMembership, { albumId });
        if (!membership || membership !== 'host') throw new Error('Not the host of this album');

        const profile = await ctx.runQuery(api.profile.getProfile);
        if (!profile) throw new Error('Profile not found');

        const media = await ctx.runQuery(api.media.getMediaForAlbum, { albumId });

        for (const m of media) {
            const canDelete = membership === 'host' || membership === 'moderator' || m.createdBy === profile._id;
            if (!canDelete) throw new Error('You don\'t have permission to delete this media');

            // Delete the Media object
            await ctx.runMutation(internal.media.deleteMediaDoc, { mediaId: m._id });

            // Delete the file from R2 or Cloudflare Stream
            if (m.identifier.type === 'image') {
                await ctx.runAction(internal.r2.deleteObject, { objectKey: `album/${albumId}/${m.identifier.imageId}` });
            } else if (m.identifier.type === 'video') {
                await ctx.runAction(internal.cloudflare.deleteVideo, { videoUID: m.identifier.videoUid })
            }
        }

        await ctx.runMutation(internal.albums.deleteAlbumDoc, { albumId });

    }
})

export const getAlbumCover = action({
    args: {
        albumId: v.id('albums'),
        identifier: v.union(
            v.object({
                type: v.literal('image'),
                imageId: v.string(),
                width: v.number(),
                height: v.number(),
            }),
            v.object({
                type: v.literal('video'),
                videoUid: v.string(),
                duration: v.number(),
                width: v.optional(v.number()),
                height: v.optional(v.number()),
            }),
        ),
    },
    handler: async (ctx, { albumId, identifier }): Promise<string> => {
        const type = identifier.type;

        if (type === 'image') {
            const imageId = identifier.imageId;

            return await ctx.runAction(internal.r2.getPublicObject, {
                objectKey: `album/${albumId}/${imageId}`
            })
        } else if (type === 'video') {
            return await ctx.runAction(internal.cloudflare.getPublicThumbnail, {
                videoUID: identifier.videoUid
            });
        }

        throw new Error('Unsupported media type');
    },
})

// --- Internal ---
export const createAlbumDoc = internalMutation({
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

export const deleteAlbumDoc = internalMutation({
    args: { albumId: v.id('albums') },
    handler: async (ctx, { albumId }) => {
        await ctx.db.delete(albumId);
    }
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
