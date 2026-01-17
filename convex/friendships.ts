import { Friend, Friendship } from "@/src/types/Friend";
import { ConvexError, v } from "convex/values";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

// --------------------
// New: Jan 14, 2026
// --------------------
export const getListOfFriends = query({
    args: {},
    handler: async (ctx): Promise<Friend[]> => {
        const profile = await ctx.runQuery(api.profile.getProfile);
        if (!profile) throw new ConvexError('User not found');

        const sent = await ctx.db.query('friendships')
            .withIndex('by_senderId', q => q.eq('senderId', profile._id))
            .collect();

        const received = await ctx.db.query('friendships')
            .withIndex('by_recipientId', q => q.eq('recipientId', profile._id))
            .collect();

        const combined = [...sent, ...received];
        const filtered = combined.filter(friendship => friendship.status === 'accepted');
        const listOfFriends: Friend[] = (await Promise.all(filtered.map(async (friendship) => {
            const friend = await ctx.db.get(friendship.senderId === profile._id ? friendship.recipientId : friendship.senderId);
            if (!friend) return null;

            return {
                _id: friend._id,
                nickname: friend.nickname,
                ssoAvatarUrl: friend.ssoAvatarUrl,
                avatarKey: friend.avatarKey,
            }
        }))).filter((friend) => friend !== null);

        const sortedByNickname = listOfFriends.sort((a, b) => a.nickname.localeCompare(b.nickname));

        return sortedByNickname;
    }
})

export const getAllFriendships = query({
    args: {},
    handler: async (ctx): Promise<Friendship[]> => {
        const profile = await ctx.runQuery(api.profile.getProfile);
        if (!profile) throw new ConvexError('User not found');

        const sent = await ctx.db.query('friendships')
            .withIndex('by_senderId', q => q.eq('senderId', profile._id))
            .collect();

        const received = await ctx.db.query('friendships')
            .withIndex('by_recipientId', q => q.eq('recipientId', profile._id))
            .collect();

        // Combine sent and received friendships into a single array and add direction to each friendship
        const combined = [
            ...sent.map(f => ({ ...f, direction: 'sent' as const })),
            ...received.map(f => ({ ...f, direction: 'received' as const })),
        ];

        // Sort the combined array by priority and updatedAt
        return combined.sort((a, b) => {
            const priorityMap = {
                // High priority (top)
                pending: 2,
                rejectedBy: 2,

                // Low priority (bottom)
                rejected: 0,
                blocked: 0,

                // Medium priority (middle)
                accepted: 1,
            };

            // Determine status priority for each friendship based on direction and status
            const statusA = a.direction === 'received' && a.status === 'rejected'
                ? 'rejectedBy'
                : a.direction === 'sent' && a.status === 'rejected'
                    ? 'rejected'
                    : a.status;

            const statusB = b.direction === 'received' && b.status === 'rejected'
                ? 'rejectedBy'
                : a.direction === 'sent' && a.status === 'rejected'
                    ? 'rejected'
                    : a.status;

            const priorityDiff = priorityMap[statusA] - priorityMap[statusB];

            if (priorityDiff !== 0) return priorityDiff;

            return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
        })

    }
})


// --------------------
// OLD
// --------------------

export const getFriendships = query({
    args: {}, handler: async (ctx): Promise<Friendship[]> => {
        const profile = await ctx.runQuery(api.profile.getProfile);
        if (!profile) throw new ConvexError('User not found');

        const sent = await ctx.db.query('friendships')
            .withIndex('by_senderId', q => q.eq('senderId', profile._id))
            .collect();

        const received = await ctx.db.query('friendships')
            .withIndex('by_recipientId', q => q.eq('recipientId', profile._id))
            .collect();

        const chronologicallySorted = [...sent, ...received].sort((a, b) => b.createdAt! - a.createdAt!);
        return chronologicallySorted as Friendship[];
    }
})

export const getFriendByFriendshipId = query({
    args: {
        friendshipId: v.id('friendships'),
    }, handler: async (ctx, { friendshipId }): Promise<Friend | null> => {
        const profile = await ctx.runQuery(api.profile.getProfile);
        if (!profile) return null;

        const friendship = await ctx.db.get(friendshipId);
        if (!friendship) return null;

        if (friendship.senderId !== profile._id && friendship.recipientId !== profile._id) throw new Error("You are not a part of this friendship");

        const friendId = friendship.senderId === profile._id ? friendship.recipientId : friendship.senderId;
        const friend = await ctx.db.get(friendId);
        if (!friend) return null;

        return {
            _id: friend._id,
            nickname: friend.nickname,
            ssoAvatarUrl: friend.ssoAvatarUrl,
            avatarKey: friend.avatarKey,
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