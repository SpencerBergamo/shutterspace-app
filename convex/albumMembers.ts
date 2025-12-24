import { MemberRole, Membership } from "@/src/types/Album";
import { ConvexError, v } from "convex/values";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { internalMutation, mutation, query } from "./_generated/server";


// --------------------
// DEC 23
// --------------------
export const queryMembership = query({
    args: { albumId: v.id('albums') },
    handler: async (ctx, { albumId }): Promise<MemberRole> => {
        const profile = await ctx.runQuery(api.profile.getUserProfile);
        if (!profile) throw new ConvexError("User Not Found");

        const membership = await ctx.db.query('albumMembers')
            .withIndex('by_album_profileId', q => q.eq('albumId', albumId)
                .eq('profileId', profile._id))
            .first();

        return membership?.role ?? 'not-a-member';
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

export const addMembers = mutation({
    args: {
        albumId: v.id('albums'),
        newMembers: v.array(v.id('profiles')),
    }, handler: async (ctx, { albumId, newMembers }) => {
        const album = await ctx.db.get(albumId);
        if (!album) throw new ConvexError('Album not found');

        const profile = await ctx.runQuery(api.profile.getUserProfile);
        if (!profile) throw new ConvexError('No User Found');

        // check if the user is a member of the album or if the album is open invites
        const existingMemberships = await ctx.runQuery(api.albumMembers.queryAllMemberships, { albumId });
        const memberRole = existingMemberships.find(m => m.profileId === profile._id)?.role ?? 'not-a-member';
        if (!album.openInvites && memberRole !== 'host') throw new ConvexError('Not Authorized');

        const updatedAt = Date.now();

        // update album updatedAt
        await ctx.db.patch(albumId, { updatedAt });

        // Update existing memberships
        await Promise.all(existingMemberships.map(async (m) => {
            await ctx.db.patch(m._id, { updatedAt });
        }));

        // Add new members
        return await Promise.all(newMembers.map(async (memberId) => {
            await ctx.db.insert('albumMembers', {
                albumId,
                profileId: memberId,
                role: 'member',
                joinedAt: updatedAt,
                updatedAt,
            });
        }))
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

        const membership = await ctx.db.query('albumMembers')
            .withIndex('by_album_profileId', q => q.eq('albumId', albumId)
                .eq('profileId', profile._id))
            .first();

        return membership?.role ?? 'not-a-member';
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
            v.literal('host'),
            v.literal('member'),
            v.literal('moderator'),
        ),
    }, handler: async (ctx, { albumId, profileId, role }) => {
        return await ctx.db.insert('albumMembers', {
            albumId,
            profileId,
            role,
            joinedAt: Date.now(),
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