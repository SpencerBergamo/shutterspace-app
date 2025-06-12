import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    profiles: defineTable({
        joined: v.number(),
        authProvider: v.union(v.literal("email"), v.literal("google"), v.literal("apple")),
        email: v.string(),
        avatarUrl: v.string(),
        nickname: v.string(),
    }),

    friendships: defineTable({
        userId: v.id('profiles'),
        friendId: v.id('profiles'),
        status: v.union(
            v.literal('pending'),
            v.literal('accepted'),
            v.literal('blocked'),
        ),
        createdAt: v.number(),
        updatedAt: v.number(),
    }).index('by_userId', ['userId'])
        .index('by_friendId', ['friendId'])
        .index('by_user_and_status', ['userId', 'friendId', 'status'])
        .index('by_pair', ['userId', 'friendId'])
        .index('by_pair_reverse', ['friendId', 'userId']),

    albums: defineTable({
        title: v.string(),
        description: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
        hostId: v.id("profiles"),
        joinCode: v.string(),
        openInvites: v.boolean(),
        permanentCover: v.optional(v.string()),
        eventDetails: v.optional(v.object({
            date: v.optional(v.number()),
            time: v.optional(v.string()),
            location: v.optional(v.string()),
        })),
        expiresAt: v.optional(v.number()),
    }).index("by_joinCode", ["joinCode"]),

    albumMembers: defineTable({
        albumId: v.id("albums"),
        profileId: v.id("profiles"),
        role: v.union(v.literal('member'), v.literal('moderator'), v.literal('host')),
        joinedAt: v.number(),
    }).index("by_albumId", ["albumId"])
        .index("by_profileId", ["profileId"])
        .index("by_album_profileId", ["albumId", "profileId"]),

    media: defineTable({
        filename: v.string(),
        createdAt: v.number(),
        albumId: v.id("albums"),
        uploadedById: v.id("profiles"),
        downloadUrl: v.string(),
        thumbnailUrl: v.string(),
        type: v.union(v.literal("image"), v.literal("video")),
        width: v.number(),
        height: v.number(),
        duration: v.optional(v.number()),
    }).index("by_albumId", ["albumId"])
        .index("by_profileId", ["uploadedById"]),

    comments: defineTable({
        mediaId: v.id("media"),
        profileId: v.id("profiles"),
        text: v.string(),
        createdAt: v.number(),
        parentCommentId: v.optional(v.id('comments')),
    }).index("by_mediaId", ["mediaId"])
        .index("by_profileId", ["profileId"])
        .index("by_parentCommentId", ["parentCommentId"]) // for threaded replies
        .index('by_mediaId_createdAt', ['mediaId', 'createdAt']), // for chronological ordering

    likes: defineTable({
        mediaId: v.id("media"),
        profileId: v.id("profiles"),
        createdAt: v.number(), // Timestamp
    })
        .index("by_mediaId", ["mediaId"])
        .index("by_profileId", ["profileId"])
        .index("by_mediaId_profileId", ["mediaId", "profileId"]), // for tracking likes per media
});