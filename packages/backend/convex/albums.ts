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
    getEffectiveStatus,
    PURGE_DELAY_MS,
    rescheduleArchiveJob,
    statusAfterRestore,
} from "./lib/albumLifecycle";
import {
    albumCoverValidator,
    coverFromMedia,
    CUSTOM_COVER_IMAGE_ID,
    isCustomCoverObject,
    patchCoverFromLatestReady,
} from "./lib/albumCover";
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
    // Legacy — until dropAlbumThumbnails
    thumbnail: v.optional(v.id('media')),
    cover: v.optional(albumCoverValidator),
    isDynamicThumbnail: v.boolean(),
    openInvites: v.boolean(),
    dateRange: v.optional(v.union(
        v.object({
            start: v.string(),
            end: v.optional(v.string()),
        }),
        v.object({
            start: v.number(),
            end: v.optional(v.number()),
            timezone: v.string(),
        }),
    )),
    startsAt: v.optional(v.number()),
    location: v.optional(v.object({
        lat: v.number(),
        lng: v.number(),
        name: v.optional(v.string()),
        address: v.optional(v.string()),
    })),
    // Optional until backfillAlbumLifecycleAndTimes
    status: v.optional(v.union(
        v.literal('active'),
        v.literal('archived'),
        v.literal('trashed'),
    )),
    // Legacy — until dropLegacyAlbumLifecycleFields
    isDeleted: v.optional(v.boolean()),
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
        if (album && albumIsVisible(album)) {
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
        openInvites: v.boolean(),
        members: v.optional(v.array(v.id('profiles'))),
    }, handler: async (ctx, { title, description, openInvites, members }): Promise<Id<'albums'>> => {
        const profile = await ctx.runQuery(api.profile.getProfile);
        if (!profile) throw new ConvexError('No User Found');

        const albumId = await ctx.db.insert('albums', {
            hostId: profile._id,
            title,
            description,
            isDynamicThumbnail: true,
            openInvites,
            updatedAt: Date.now(),
            status: 'active',
            // Dual-write for older clients still reading `isDeleted`.
            isDeleted: false,
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
        if (getEffectiveStatus(album) === 'trashed') return;

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
            isDeleted: true,
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
        if (getEffectiveStatus(album) !== 'trashed') throw new ConvexError('Album is not in trash');

        if (album.scheduledDeletionId) {
            await ctx.scheduler.cancel(album.scheduledDeletionId);
        }

        const restoredStatus = statusAfterRestore(album);
        const now = Date.now();
        await ctx.db.patch(albumId, {
            status: restoredStatus,
            isDeleted: false,
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

/**
 * Mint a signed cover URL from the denormalized album.cover.
 * Covers are publicly readable (no membership / invite gate).
 * Trashed albums still return null / not found.
 */
export const getAlbumCoverUrl = action({
    args: {
        albumId: v.id('albums'),
    },
    returns: v.union(v.string(), v.null()),
    handler: async (ctx, { albumId }): Promise<string | null> => {
        const album = await ctx.runQuery(internal.albums.getAlbumById, { albumId });
        if (!album.cover) return null;

        if (album.cover.type === 'image') {
            return await ctx.runAction(internal.r2.getPublicObject, {
                objectKey: `album/${albumId}/${album.cover.imageId}`,
            });
        }

        return await ctx.runAction(internal.cloudflare.getPublicThumbnail, {
            videoUID: album.cover.videoUid,
        });
    },
});

/**
 * After client PUTs to cover.jpg, patch album metadata.
 * Optionally CopyObject into the gallery and create a media row.
 */
export const commitCover = action({
    args: {
        albumId: v.id('albums'),
        width: v.number(),
        height: v.number(),
        size: v.optional(v.number()),
        alsoAddToAlbum: v.optional(v.boolean()),
    },
    handler: async (ctx, { albumId, width, height, size, alsoAddToAlbum }) => {
        const membership = await ctx.runQuery(api.albumMembers.getMembership, { albumId });
        if (!membership || membership === 'not-a-member') throw new Error('Not a member of this album');

        await ctx.runQuery(internal.albums.assertAlbumAcceptsEdits, { albumId });

        let mediaId: Id<'media'> | undefined;
        if (alsoAddToAlbum) {
            const galleryImageId = await ctx.runAction(internal.r2.copyCoverToGallery, { albumId });
            mediaId = await ctx.runMutation(internal.albums.insertCoverGalleryMedia, {
                albumId,
                imageId: galleryImageId,
                width,
                height,
                size,
            });
        }

        await ctx.runMutation(internal.albums.applyCustomCover, {
            albumId,
            width,
            height,
            size,
            mediaId,
        });
    },
});

/** Re-enable dynamic covers from latest ready media; delete custom cover.jpg if present. */
export const setDynamicCover = action({
    args: { albumId: v.id('albums') },
    handler: async (ctx, { albumId }) => {
        const membership = await ctx.runQuery(api.albumMembers.getMembership, { albumId });
        if (!membership || membership === 'not-a-member') throw new Error('Not a member of this album');
        if (membership !== 'host' && membership !== 'moderator') {
            throw new Error('Only the host or a moderator can change the cover mode');
        }

        await ctx.runQuery(internal.albums.assertAlbumAcceptsEdits, { albumId });

        const album = await ctx.runQuery(internal.albums.getAlbumById, { albumId });
        if (album.cover && isCustomCoverObject(album.cover)) {
            await ctx.runMutation(internal.albums.clearCustomCoverQuota, { albumId });
            await ctx.runAction(internal.r2.deleteCoverObject, { albumId });
        }

        await ctx.runMutation(internal.albums.enableDynamicCover, { albumId });
    },
});

/** Promote an existing custom cover-only object into the gallery (no re-upload). */
export const promoteCoverToMedia = action({
    args: { albumId: v.id('albums') },
    handler: async (ctx, { albumId }): Promise<Id<'media'>> => {
        const membership = await ctx.runQuery(api.albumMembers.getMembership, { albumId });
        if (!membership || membership === 'not-a-member') throw new Error('Not a member of this album');

        await ctx.runQuery(internal.albums.assertAlbumAcceptsUploads, { albumId });

        const album = await ctx.runQuery(internal.albums.getAlbumById, { albumId });
        if (!album.cover || !isCustomCoverObject(album.cover)) {
            throw new Error('Album does not have a custom cover to promote');
        }
        if (album.cover.mediaId) {
            return album.cover.mediaId;
        }

        const galleryImageId: string = await ctx.runAction(internal.r2.copyCoverToGallery, { albumId });
        const mediaId: Id<'media'> = await ctx.runMutation(internal.albums.insertCoverGalleryMedia, {
            albumId,
            imageId: galleryImageId,
            width: album.cover.width,
            height: album.cover.height,
            size: album.cover.size,
        });

        await ctx.runMutation(internal.albums.linkCoverMediaId, { albumId, mediaId });
        return mediaId;
    },
});

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

/** ADR-0002: flip `active → archived` when `expiresAt` is reached. */
export const archiveAlbumAtExpiry = internalMutation({
    args: { albumId: v.id('albums') },
    handler: async (ctx, { albumId }) => {
        const album = await ctx.db.get(albumId);
        if (!album || getEffectiveStatus(album) !== 'active') return;
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
        if (!album || getEffectiveStatus(album) !== 'trashed') return;

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

        // Cover-only / custom cover.jpg bytes.
        if (album.cover && isCustomCoverObject(album.cover)) {
            await adjustStorageUsed(ctx, album.hostId, -(album.cover.size ?? 0));
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

        if (album.cover && isCustomCoverObject(album.cover)) {
            await ctx.runAction(internal.r2.deleteCoverObject, { albumId });
        }

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
        if (!album || getEffectiveStatus(album) !== 'trashed') return null;
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

export const assertAlbumAcceptsEdits = internalQuery({
    args: { albumId: v.id('albums') },
    handler: async (ctx, { albumId }) => {
        const album = await ctx.db.get(albumId);
        if (!album || !albumIsVisible(album)) throw new Error('Album not found');
        if (!albumAllowsEdits(album)) {
            throw new Error('Album is read-only');
        }
        return album;
    },
});

export const getAlbumById = internalQuery({
    args: { albumId: v.id('albums') },
    handler: async (ctx, { albumId }) => {
        const album = await ctx.db.get(albumId);
        if (!album || getEffectiveStatus(album) === 'trashed') throw new Error('Album not found');

        return album;
    },
});

export const applyCustomCover = internalMutation({
    args: {
        albumId: v.id('albums'),
        width: v.number(),
        height: v.number(),
        size: v.optional(v.number()),
        mediaId: v.optional(v.id('media')),
    },
    handler: async (ctx, { albumId, width, height, size, mediaId }) => {
        const album = await ctx.db.get(albumId);
        if (!album) throw new Error('Album not found');

        const prev = album.cover;
        const prevCustom =
            prev && isCustomCoverObject(prev) ? (prev.size ?? 0) : 0;
        // Custom cover.jpg always occupies R2; bill it even when a gallery copy exists.
        const nextCustom = size ?? 0;
        const delta = nextCustom - prevCustom;
        if (delta !== 0) {
            await adjustStorageUsed(ctx, album.hostId, delta);
        }

        await ctx.db.patch(albumId, {
            isDynamicThumbnail: false,
            cover: {
                type: 'image',
                imageId: CUSTOM_COVER_IMAGE_ID,
                width,
                height,
                size,
                mediaId,
            },
            // Dual-write when the custom cover is also in the gallery.
            ...(mediaId ? { thumbnail: mediaId } : {}),
            updatedAt: Date.now(),
        });
    },
});

export const clearCustomCoverQuota = internalMutation({
    args: { albumId: v.id('albums') },
    handler: async (ctx, { albumId }) => {
        const album = await ctx.db.get(albumId);
        if (!album?.cover || !isCustomCoverObject(album.cover)) return;
        await adjustStorageUsed(ctx, album.hostId, -(album.cover.size ?? 0));
    },
});

export const enableDynamicCover = internalMutation({
    args: { albumId: v.id('albums') },
    handler: async (ctx, { albumId }) => {
        await ctx.db.patch(albumId, {
            isDynamicThumbnail: true,
            updatedAt: Date.now(),
        });
        await patchCoverFromLatestReady(ctx, albumId);
    },
});

export const insertCoverGalleryMedia = internalMutation({
    args: {
        albumId: v.id('albums'),
        imageId: v.string(),
        width: v.number(),
        height: v.number(),
        size: v.optional(v.number()),
    },
    handler: async (ctx, { albumId, imageId, width, height, size }): Promise<Id<'media'>> => {
        const profile = await ctx.runQuery(api.profile.getProfile);
        if (!profile) throw new Error('User Profile Not Found');

        const mediaId: Id<'media'> = await ctx.db.insert('media', {
            albumId,
            createdBy: profile._id,
            assetId: `cover-promote-${imageId}`,
            filename: CUSTOM_COVER_IMAGE_ID,
            identifier: {
                type: 'image',
                imageId,
                width,
                height,
            },
            size,
            status: 'ready',
        });

        await adjustStorageUsed(ctx, profile._id, size ?? 0);

        return mediaId;
    },
});

export const linkCoverMediaId = internalMutation({
    args: {
        albumId: v.id('albums'),
        mediaId: v.id('media'),
    },
    handler: async (ctx, { albumId, mediaId }) => {
        const album = await ctx.db.get(albumId);
        if (!album?.cover || album.cover.type !== 'image') throw new Error('No image cover');
        await ctx.db.patch(albumId, {
            cover: { ...album.cover, mediaId },
            thumbnail: mediaId,
            updatedAt: Date.now(),
        });
    },
});

export const setCoverFromMedia = internalMutation({
    args: {
        albumId: v.id('albums'),
        mediaId: v.id('media'),
        pin: v.boolean(),
    },
    handler: async (ctx, { albumId, mediaId, pin }) => {
        const media = await ctx.db.get(mediaId);
        if (!media || media.albumId !== albumId) throw new Error('Media not found');
        if (media.status !== 'ready') return;

        await ctx.db.patch(albumId, {
            cover: coverFromMedia(media),
            // Dual-write for older clients still reading `thumbnail`.
            thumbnail: mediaId,
            ...(pin ? { isDynamicThumbnail: false } : {}),
            updatedAt: Date.now(),
        });
    },
});
