import { MemberRole } from "@/types/Album";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { internalMutation, mutation, query } from "./_generated/server";


export const getMembership = query({
    args: {
        albumId: v.id("albums"),
    }, handler: async (ctx, { albumId }): Promise<MemberRole> => {
        const profile = await ctx.runQuery(api.profile.getProfile);
        if (!profile) throw new Error("User Not Found");

        const membership = await ctx.db.query('albumMembers')
            .withIndex('by_album_profileId', q => q.eq('albumId', albumId)
                .eq('profileId', profile._id))
            .first();

        return membership?.role ?? 'not-a-member';
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