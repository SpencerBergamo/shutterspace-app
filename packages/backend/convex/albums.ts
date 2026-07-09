import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import { Album } from "../types/Album";
import { api, internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { action, internalAction, internalMutation, internalQuery, mutation, query, QueryCtx } from "./_generated/server";
import {
    albumAllowsEdits,
    albumAllowsUploads,
    albumIsVisible,
    defaultExpiresAt,
    PURGE_DELAY_MS,
    rescheduleArchiveJob,
    statusAfterRestore,
} from "./lib/albumLifecycle";
import { adjustStorageUsed } from "./lib/storage";

const dateRangeArgs = v.object({
    start: v.number(),
    end: v.optional(v.number()),
    timezone: v.string(),
});

const locationArgs = v.object({
    lat: v.number(),
    lng: v.number(),
    name: v.optional(v.string()),
    address: v.optional(v.string()),
});

const albumDocValidator = v.object({
    _id: v.id('albums'),
    _creationTime: v.number(),
    hostId: v.id('profiles'),
    title: v.string(),
    description: v.optional(v.string()),
    thumbnail: v.optional(v.id('media')),
    isDynamicThumbnail: v.boolean(),
    openInvites: v.boolean(),
    dateRange: v.optional(v.object({
        start: v.number(),
        end: v.optional(v.number()),
        timezone: v.string(),
    })),
    startsAt: v.optional(v.number()),
    location: v.optional(v.object({
        lat: v.number(),
        lng: v.number(),
        name: v.optional(v.string()),
        address: v.optional(v.string()),
    })),
    status: v.union(
        v.literal('active'),
        v.literal('archived'),
        v.literal('trashed'),
    ),
    updatedAt: v.number(),
    expiresAt: v.optional(v.number()),
    scheduledArchiveId: v.optional(v.id('_scheduled_functions')),
    deletionScheduledAt: v.optional(v.number()),
    scheduledDeletionId: v.optional(v.id('_scheduled_functions')),
});

const albumPaginationResultValidator = v.object({
    page: v.array(albumDocValidator),
    isDone: v.boolean(),
    continueCursor: v.string(),
});

async function getAccessibleAlbumsForProfile(
    ctx: QueryCtx,
    profileId: Id<'profiles'>,
): Promise<Doc<'albums'>[]> {
    const memberships = await ctx.db
        .query('albumMembers')
        .withIndex('by_profileId', q => q.eq('profileId', profileId))
        .collect();

    const memberAlbums = await Promise.all(
        memberships
            .filter(m => m.status === 'active')
            .map(m => ctx.db.get(m.albumId)),
    );

    const hosted = await ctx.db
        .query('albums')
        .withIndex('by_hostId', q => q.eq('hostId', profileId))
        .collect();

    const byId = new Map<string, Doc<'albums'>>();
    for (const album of [...hosted, ...memberAlbums]) {
        if (album && album.status !== 'trashed') {
            byId.set(album._id, album);
        }
    }

    return [...byId.values()].sort((a, b) => b.updatedAt - a.updatedAt);
}


// --------------------
// Dec 23 2025 - March 2 2026
// --------------------
export const queryAlbum = query({
    args: { albumId: v.id('albums') },
    handler: async (ctx, { albumId }) => {
        const membership = await ctx.runQuery(api.albumMembers.queryMembership, { albumId });
        if (!membership || membership === 'not-a-member') return null;

        const album = await ctx.db.get(albumId);
        // ADR-0002: trashed albums are hidden from everyone.
        if (!album || !albumIsVisible(album)) return null;

        return album;
    }
});

export const queryUserAlbums = query({
    args: {
        paginationOpts: paginationOptsValidator,
    },
    returns: albumPaginationResultValidator,
    handler: async (ctx, { paginationOpts }) => {
        const profile = await ctx.runQuery(api.profile.getProfile);
        if (!profile) throw new ConvexError('No User Found');

        const allAlbums = await getAccessibleAlbumsForProfile(ctx, profile._id);
        const offset = paginationOpts.cursor ? parseInt(paginationOpts.cursor, 10) : 0;
        const page = allAlbums.slice(offset, offset + paginationOpts.numItems);
        const nextOffset = offset + paginationOpts.numItems;
        const isDone = nextOffset >= allAlbums.length;

        return {
            page,
            isDone,
            continueCursor: isDone ? '' : String(nextOffset),
        };
    },
})

export const createNewAlbum = mutation({
    args: {
        title: v.string(),
        description: v.optional(v.string()),
        members: v.optional(v.array(v.id('profiles'))),
    }, handler: async (ctx, { title, description, members }): Promise<Id<'albums'>> => {
        const profile = await ctx.runQuery(api.profile.getProfile);
        if (!profile) throw new ConvexError('No User Found');

        const albumId = await ctx.db.insert('albums', {
            hostId: profile._id,
            title,
            description,
            isDynamicThumbnail: true,
            openInvites: true,
            updatedAt: Date.now(),
            status: 'active',
        });

        // ADR-0001: the Host has NO albumMembers row — ownership lives solely in
        // albums.hostId. Only non-host members get rows.
        if (members && members.length > 0) {
            const now = Date.now();
            await Promise.all(members
                .filter((m) => m !== profile._id)
                .map((m) => ctx.db.insert('albumMembers', {
                    albumId,
                    profileId: m,
                    role: 'member',
                    status: 'active',
                    joinedAt: now,
                    updatedAt: now,
                })));
        }

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
    args: {},
    returns: v.array(albumDocValidator),
    handler: async (ctx): Promise<Album[]> => {
        const profile = await ctx.runQuery(api.profile.getProfile);
        if (!profile) throw new ConvexError('User not found');

        return await getAccessibleAlbumsForProfile(ctx, profile._id);
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

        // ADR-0001: the Host has NO albumMembers row — ownership is albums.hostId.

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
        if (!album || !albumIsVisible(album)) throw new Error('Album not found');
        if (!albumAllowsEdits(album)) throw new Error('Album is no longer accepting new members');

        // ADR-0001: the Host is never a member row.
        if (album.hostId === profileId) return;

        const now = Date.now();
        await ctx.db.insert('albumMembers', {
            albumId: album._id,
            profileId,
            role,
            status: 'active',
            joinedAt: now,
            updatedAt: now,
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
        dateRange: v.optional(dateRangeArgs),
        location: v.optional(locationArgs),
        expiresAt: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const profile = await ctx.runQuery(api.profile.getUserProfile);
        if (!profile) throw new ConvexError('No User Found');

        const role = await ctx.runQuery(api.albumMembers.queryMembership, { albumId: args.albumId });
        if (role !== 'host' && role !== 'moderator') throw new ConvexError('Not Authorized');

        const album = await ctx.db.get(args.albumId);
        if (!album) throw new ConvexError('Album not found');
        if (!albumAllowsEdits(album)) {
            throw new ConvexError('Album is read-only');
        }

        const now = Date.now();
        const patch: Partial<Doc<'albums'>> = { updatedAt: now };

        if (args.title !== undefined) patch.title = args.title;
        if (args.description !== undefined) patch.description = args.description;
        if (args.isDynamicThumbnail !== undefined) patch.isDynamicThumbnail = args.isDynamicThumbnail;
        if (args.openInvites !== undefined) patch.openInvites = args.openInvites;
        if (args.location !== undefined) patch.location = args.location;

        let expiresAt = args.expiresAt ?? album.expiresAt;
        if (args.dateRange !== undefined) {
            patch.dateRange = args.dateRange;
            patch.startsAt = args.dateRange.start;
            if (args.expiresAt === undefined) {
                expiresAt = defaultExpiresAt(args.dateRange);
            }
        }
        if (args.expiresAt !== undefined || args.dateRange !== undefined) {
            patch.expiresAt = expiresAt;
        }

        await ctx.db.patch(args.albumId, patch);

        const updated = await ctx.db.get(args.albumId);
        if (updated) {
            await rescheduleArchiveJob(ctx, args.albumId, updated, expiresAt);
        }
    },
});

/** Host-only: move album to trash and schedule a hard purge (ADR-0002). */
export const deleteAlbum = mutation({
    args: { albumId: v.id('albums') },
    handler: async (ctx, { albumId }) => {
        const role = await ctx.runQuery(api.albumMembers.queryMembership, { albumId });
        if (role !== 'host') throw new ConvexError('Only the host can delete this album');

        const album = await ctx.db.get(albumId);
        if (!album) throw new ConvexError('Album not found');
        if (album.status === 'trashed') return;

        if (album.scheduledArchiveId) {
            await ctx.scheduler.cancel(album.scheduledArchiveId);
        }
        if (album.scheduledDeletionId) {
            await ctx.scheduler.cancel(album.scheduledDeletionId);
        }

        const now = Date.now();
        const deletionScheduledAt = now + PURGE_DELAY_MS;
        const scheduledDeletionId = await ctx.scheduler.runAt(
            deletionScheduledAt,
            internal.albums.purgeAlbum,
            { albumId },
        );

        await ctx.db.patch(albumId, {
            status: 'trashed',
            deletionScheduledAt,
            scheduledDeletionId,
            scheduledArchiveId: undefined,
            updatedAt: now,
        });
    },
});

/** Host-only: cancel scheduled purge and restore a trashed album (ADR-0002). */
export const restoreAlbum = mutation({
    args: { albumId: v.id('albums') },
    handler: async (ctx, { albumId }) => {
        const role = await ctx.runQuery(api.albumMembers.queryMembership, { albumId });
        if (role !== 'host') throw new ConvexError('Only the host can restore this album');

        const album = await ctx.db.get(albumId);
        if (!album) throw new ConvexError('Album not found');
        if (album.status !== 'trashed') throw new ConvexError('Album is not in trash');

        if (album.scheduledDeletionId) {
            await ctx.scheduler.cancel(album.scheduledDeletionId);
        }

        const restoredStatus = statusAfterRestore(album);
        const now = Date.now();
        await ctx.db.patch(albumId, {
            status: restoredStatus,
            deletionScheduledAt: undefined,
            scheduledDeletionId: undefined,
            updatedAt: now,
        });

        const updated = await ctx.db.get(albumId);
        if (updated && restoredStatus === 'active') {
            await rescheduleArchiveJob(ctx, albumId, updated, updated.expiresAt);
        }
    },
});

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
            status: 'active',
        });
    },
})

export const deleteAlbumDoc = internalMutation({
    args: { albumId: v.id('albums') },
    handler: async (ctx, { albumId }) => {
        await ctx.db.delete(albumId);
    }
})

/** ADR-0002: flip `active → archived` when `expiresAt` is reached. */
export const archiveAlbumAtExpiry = internalMutation({
    args: { albumId: v.id('albums') },
    handler: async (ctx, { albumId }) => {
        const album = await ctx.db.get(albumId);
        if (!album || album.status !== 'active') return;
        if (album.expiresAt !== undefined && Date.now() < album.expiresAt) return;

        await ctx.db.patch(albumId, {
            status: 'archived',
            scheduledArchiveId: undefined,
            updatedAt: Date.now(),
        });
    },
});

/** Hard-delete all Convex docs for a trashed album (called after R2/Stream purge). */
export const purgeAlbumDocs = internalMutation({
    args: { albumId: v.id('albums') },
    handler: async (ctx, { albumId }) => {
        const album = await ctx.db.get(albumId);
        if (!album || album.status !== 'trashed') return;

        const media = await ctx.db.query('media')
            .withIndex('by_albumId', q => q.eq('albumId', albumId))
            .collect();

        for (const m of media) {
            const comments = await ctx.db.query('comments')
                .withIndex('by_mediaId', q => q.eq('mediaId', m._id))
                .collect();
            for (const c of comments) await ctx.db.delete(c._id);

            const likes = await ctx.db.query('likes')
                .withIndex('by_mediaId', q => q.eq('mediaId', m._id))
                .collect();
            for (const l of likes) await ctx.db.delete(l._id);

            // ADR-0004: purge frees the owner's storage too.
            await adjustStorageUsed(ctx, m.createdBy, -(m.size ?? 0));
            await ctx.db.delete(m._id);
        }

        const members = await ctx.db.query('albumMembers')
            .withIndex('by_albumId', q => q.eq('albumId', albumId))
            .collect();
        for (const m of members) await ctx.db.delete(m._id);

        const invites = await ctx.db.query('inviteCodes')
            .withIndex('by_albumId', q => q.eq('albumId', albumId))
            .collect();
        for (const i of invites) await ctx.db.delete(i._id);

        await ctx.db.delete(albumId);
    },
});

/** ADR-0002: purge backing assets then delete all Convex docs. */
export const purgeAlbum = internalAction({
    args: { albumId: v.id('albums') },
    handler: async (ctx, { albumId }) => {
        const album = await ctx.runQuery(internal.albums.getTrashedAlbum, { albumId });
        if (!album) return;

        const media = await ctx.runQuery(internal.media.listMediaForAlbum, { albumId });
        for (const m of media) {
            if (m.identifier.type === 'image') {
                await ctx.runAction(internal.r2.deleteObject, {
                    objectKey: `album/${albumId}/${m.identifier.imageId}`,
                });
            } else if (m.identifier.type === 'video') {
                await ctx.runAction(internal.cloudflare.deleteVideo, {
                    videoUID: m.identifier.videoUid,
                });
            }
        }

        await ctx.runMutation(internal.albums.purgeAlbumDocs, { albumId });
    },
});

export const getTrashedAlbum = internalQuery({
    args: { albumId: v.id('albums') },
    handler: async (ctx, { albumId }) => {
        const album = await ctx.db.get(albumId);
        if (!album || album.status !== 'trashed') return null;
        return album;
    },
});

/** Used by upload actions to enforce archived read-only (ADR-0002). */
export const assertAlbumAcceptsUploads = internalQuery({
    args: { albumId: v.id('albums') },
    handler: async (ctx, { albumId }) => {
        const album = await ctx.db.get(albumId);
        if (!album || !albumIsVisible(album)) throw new Error('Album not found');
        if (!albumAllowsUploads(album)) {
            throw new Error('Album is archived and no longer accepts uploads');
        }
        return album;
    },
});

export const getAlbumById = internalQuery({
    args: { albumId: v.id('albums') },
    handler: async (ctx, { albumId }) => {
        const album = await ctx.db.get(albumId);
        if (!album || album.status === 'trashed') throw new Error('Album not found');

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
