import { Friend, Friendship } from "@/src/types/Friend";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

export const getFriendships = query({
    args: {}, handler: async (ctx): Promise<Friendship[]> => {
        const profile = await ctx.runQuery(api.profile.getProfile);
        if (!profile) return [];

        const sent = await ctx.db.query('friendships')
            .withIndex('by_senderId', q => q.eq('senderId', profile._id))
            .collect();

        const received = await ctx.db.query('friendships')
            .withIndex('by_recipientId', q => q.eq('recipientId', profile._id))
            .collect();

        return [...sent, ...received];
    }
})

export const getFriendByFriendshipId = query({
    args: {
        friendshipId: v.id('friendships'),
    }, handler: async (ctx, { friendshipId }): Promise<Friend | null> => {
        const profile = await ctx.runQuery(api.profile.getProfile);
        if (!profile) return null;

        const friendship = await ctx.db.get(friendshipId);
        if (!friendship) throw new Error('Friendship does not exist');

        if (friendship.senderId !== profile._id && friendship.recipientId !== profile._id) throw new Error("You are not a part of this friendship");

        const friendId = friendship.senderId === profile._id ? friendship.recipientId : friendship.senderId;
        const friend = await ctx.db.get(friendId);
        if (!friend) throw new Error('Friend does not exist');

        return {
            _id: friend._id,
            nickname: friend.nickname,
        }

    }
})

export const sendFriendRequest = mutation({
    args: {
        friendId: v.id('profiles'),
    },
    handler: async (ctx, { friendId }): Promise<Id<'friendships'> | null> => {
        const profile = await ctx.runQuery(api.profile.getProfile);
        if (!profile) return null;

        return await ctx.db.insert('friendships', {
            senderId: profile._id,
            recipientId: friendId,
            status: 'pending',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    }
});

export const acceptFriendRequest = mutation({
    args: {
        friendshipId: v.id('friendships'),
        status: v.optional(v.union(
            v.literal('accepted'),
            v.literal('blocked'),
        )),
    },
    handler: async (ctx, { friendshipId, status }) => {
        const profile = await ctx.runQuery(api.profile.getProfile);
        if (!profile) return null;

        const friendship = await ctx.db.get(friendshipId);
        if (!friendship) return null;

        if (friendship.recipientId !== profile._id) return null;

        await ctx.db.patch(friendshipId, {
            status: status ?? 'accepted',
        });
    }
})

export const removeFriend = mutation({
    args: {
        friendshipId: v.id('friendships'),
    },
    handler: async (ctx, { friendshipId }) => {
        const profile = await ctx.runQuery(api.profile.getProfile);
        if (!profile) return null;

        const friendship = await ctx.db.get(friendshipId);
        if (!friendship) return null;

        if (friendship.senderId !== profile._id && friendship.recipientId !== profile._id) return null;

        await ctx.db.patch(friendshipId, {
            status: 'rejected',
            updatedAt: Date.now(),
        });
    }
})

export const blockFriend = mutation({
    args: {
        friendshipId: v.id('friendships'),
    },
    handler: async (ctx, { friendshipId }) => {
        const profile = await ctx.runQuery(api.profile.getProfile);
        if (!profile) return null;

        const friendship = await ctx.db.get(friendshipId);
        if (!friendship) return null;

        if (friendship.senderId !== profile._id && friendship.recipientId !== profile._id) return null;

        await ctx.db.patch(friendshipId, {
            status: 'blocked',
            updatedAt: Date.now(),
        });
    }
});