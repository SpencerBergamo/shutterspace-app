import { ConvexError, v } from "convex/values";
import { MemberRole, Membership } from "../types/Album";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { internalMutation, MutationCtx, mutation, query, QueryCtx } from "./_generated/server";
import { albumAllowsEdits } from "./lib/albumLifecycle";


// --------------------
// ADR-0001 helpers
// --------------------

/**
 * Load the authenticated caller's profile directly from the DB. Avoids
 * `ctx.runQuery(api.profile...)` so helper modules don't create a circular
 * dependency on the generated `api` types.
 */
export async function getCurrentProfile(ctx: QueryCtx | MutationCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db.query('profiles')
        .withIndex('by_firebase_uid', q => q.eq('firebaseUID', identity.user_id as string))
        .first();
}

/**
 * Derive a profile's effective role in an album (ADR-0001).
 *
 * The Host is the single owner, stored only as `albums.hostId` (no `albumMembers`
 * row), so Host status is derived here. `pending` memberships do not grant access
 * and resolve to `not-a-member`. Returns the persisted role (`member`/`moderator`)
 * for active members.
 */
export async function deriveEffectiveRole(
    ctx: QueryCtx | MutationCtx,
    albumId: Id<'albums'>,
    profileId: Id<'profiles'>,
): Promise<MemberRole> {
    const album = await ctx.db.get(albumId);
    if (!album) return 'not-a-member';
    if (album.hostId === profileId) return 'host';

    const membership = await ctx.db.query('albumMembers')
        .withIndex('by_album_profileId', q => q.eq('albumId', albumId)
            .eq('profileId', profileId))
        .first();

    if (!membership) return 'not-a-member';

    // Dual-read: legacy role:'host' / role:'pending' still present until phase-2 drop.
    const legacyRole = membership.role as string;
    if (legacyRole === 'host') return 'host';
    if (legacyRole === 'pending' || membership.status === 'pending') return 'not-a-member';
    if (membership.status !== undefined && membership.status !== 'active') return 'not-a-member';

    if (legacyRole === 'member' || legacyRole === 'moderator') {
        return legacyRole;
    }
    return 'not-a-member';
}


// --------------------
// DEC 23
// --------------------
export const queryMembership = query({
    args: { albumId: v.id('albums') },
    handler: async (ctx, { albumId }): Promise<MemberRole> => {
        const profile = await ctx.runQuery(api.profile.getUserProfile);
        if (!profile) throw new ConvexError("User Not Found");

        return await deriveEffectiveRole(ctx, albumId, profile._id);
    }
});

export const queryAllMemberships = query({
    args: { albumId: v.id('albums') },
    handler: async (ctx, { albumId }): Promise<Membership[]> => {
        const session = await ctx.auth.getUserIdentity();
        if (!session) throw new ConvexError("Not Authenticated");

        return await ctx.db.query('albumMembers').withIndex('by_albumId', q => q.eq('albumId', albumId)).collect();
    }
});

export const addNewMember = mutation({
    args: {
        albumId: v.id('albums'),
        memberId: v.id('profiles'),
    }, handler: async (ctx, { albumId, memberId }) => {
        const album = await ctx.db.get(albumId);
        if (!album) throw new ConvexError("Album not found");

        const membership = await ctx.runQuery(api.albumMembers.getMembership, { albumId });
        if (!album.openInvites && membership !== 'host' && membership !== 'moderator') throw new ConvexError("Not authorized");



    }
})

export const addMembers = mutation({
    args: {
        albumId: v.id('albums'),
        newMembers: v.array(v.id('profiles')),
    }, handler: async (ctx, { albumId, newMembers }) => {
        const album = await ctx.db.get(albumId);
        if (!album) throw new ConvexError('Album not found');
        if (!albumAllowsEdits(album)) throw new ConvexError('Album is read-only');

        const profile = await ctx.runQuery(api.profile.getUserProfile);
        if (!profile) throw new ConvexError('No User Found');

        // ADR-0001: Host is derived from hostId. Host/Moderator may always add;
        // ordinary members only when the album allows open invites.
        const role = await deriveEffectiveRole(ctx, albumId, profile._id);
        if (role === 'not-a-member') throw new ConvexError('Not Authorized');
        if (!album.openInvites && role !== 'host' && role !== 'moderator') throw new ConvexError('Not Authorized');

        const now = Date.now();
        await ctx.db.patch(albumId, { updatedAt: now });

        // Add new members (skip the Host and anyone already in the album).
        return await Promise.all(newMembers.map(async (memberId) => {
            if (memberId === album.hostId) return null;

            const existing = await ctx.db.query('albumMembers')
                .withIndex('by_album_profileId', q => q.eq('albumId', albumId)
                    .eq('profileId', memberId))
                .first();
            if (existing) return existing._id;

            return await ctx.db.insert('albumMembers', {
                albumId,
                profileId: memberId,
                role: 'member',
                status: 'active',
                joinedAt: now,
                updatedAt: now,
            });
        }));
    }
})

// --------------------
// OLD
// --------------------
export const getMembership = query({
    args: {
        albumId: v.id("albums"),
    }, handler: async (ctx, { albumId }): Promise<MemberRole> => {
        const profile = await ctx.runQuery(api.profile.getUserProfile);
        if (!profile) throw new ConvexError("User Not Found");

        return await deriveEffectiveRole(ctx, albumId, profile._id);
    }
})

export const getMemberships = query({
    args: { albumId: v.id('albums') },
    handler: async (ctx, { albumId }): Promise<Membership[]> => {
        const membership = await ctx.runQuery(api.albumMembers.getMembership, { albumId });
        if (!membership || membership === 'not-a-member') throw new Error('You are not a member of this album');

        return await ctx.db.query('albumMembers')
            .withIndex('by_albumId', q => q.eq('albumId', albumId))
            .collect();
    }
})

export const addMember = internalMutation({
    args: {
        albumId: v.id("albums"),
        profileId: v.id("profiles"),
        role: v.union(
            v.literal('member'),
            v.literal('moderator'),
        ),
        status: v.optional(v.union(
            v.literal('pending'),
            v.literal('active'),
        )),
    }, handler: async (ctx, { albumId, profileId, role, status }) => {
        const now = Date.now();
        return await ctx.db.insert('albumMembers', {
            albumId,
            profileId,
            role,
            status: status ?? 'active',
            joinedAt: now,
            updatedAt: now,
        });
    }
})

export const leaveAlbum = mutation({
    args: { albumId: v.id('albums') },
    handler: async (ctx, { albumId }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not Authenticated");
        const profileId = identity.user_id as Id<'profiles'>;

        const membership = await ctx.db.query('albumMembers')
            .withIndex('by_album_profileId', q => q.eq('albumId', albumId)
                .eq('profileId', profileId))
            .first();

        if (!membership) throw new Error("You are not a member of this album");
        await ctx.db.delete(membership._id);
    }
})

export const removeMember = mutation({
    args: { albumId: v.id('albums') },
    handler: async (ctx, { albumId }) => {

    }
})
