import { Friend } from "@/types/Friend";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

export const getFriends = query({
    args: {},
    handler: async (ctx, _args): Promise<Friend[]> => {
        const profile = await ctx.runQuery(api.profile.getProfile);

        const friendships = await ctx.db.query('friendships')
            .withIndex('by_profileId', q => q.eq('profileId', profile._id))
            .collect();

        const friends = await Promise.all(friendships.map(async (friend) => {
            const doc = await ctx.db.get(friend.friendId);
            if (!doc) return;

            return {
                _id: doc._id,
                friendshipId: friend._id,
                nickname: doc.nickname,
            }
        }));

        return friends.filter((friend): friend is Friend => friend !== undefined);
    }
})

export const sendFriendRequest = mutation({
    args: {
        friendId: v.id('profiles'),
    },
    handler: async (ctx, { friendId }): Promise<Id<'friendships'>> => {
        const profile = await ctx.runQuery(api.profile.getProfile);

        return await ctx.db.insert('friendships', {
            profileId: profile._id,
            friendId: friendId,
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
    handler: async (ctx, { friendshipId, status }): Promise<void> => {
        const profile = await ctx.runQuery(api.profile.getProfile);

        const friendship = await ctx.db.get(friendshipId);
        if (!friendship) throw new Error('Friendship does not exist')

        if (friendship.friendId !== profile._id) throw new Error("You did not send this friend request");

        return await ctx.db.patch(friendshipId, {
            status: status ?? 'accepted',
        });
    }
})

export const removeFriend = mutation({
    args: {
        friendId: v.id('profiles'),
    },
    handler: async (ctx, { friendId }): Promise<void> => {

        const profile = await ctx.runQuery(api.profile.getProfile);
        const friendship = await ctx.db.query('friendships')
            .withIndex('by_pair', q => q.eq('profileId', profile._id).eq('friendId', friendId))
            .first();

        if (!friendship) throw new Error('Friendship does not exist');

        return await ctx.db.delete(friendship._id);
    }
})