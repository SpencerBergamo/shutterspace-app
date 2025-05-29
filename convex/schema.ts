import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    profiles: defineTable({
        userId: v.string(),
        joined: v.number(),
        authProvider: v.union(v.literal("email"), v.literal("google"), v.literal("apple")),
        email: v.string(),
        avatarUrl: v.string(),
        nickname: v.string(),
        storageUsage: v.object({
            total: v.number(),
            limit: v.number(),
            lastCalculated: v.number(),
        }),
        friends: v.array(
            v.object({
                id: v.string(),
                status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected")),
                since: v.number(),
            })
        ),
        blockedUsers: v.array(
            v.object({
                id: v.string(),
                since: v.number(),
                reason: v.optional(v.string()),
            })
        ),
    }).index("by_userId", ["userId"]),

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
        albumId: v.id("albums"),
        uploadedById: v.id("profiles"),
        cloudinaryId: v.string(),
        mediaType: v.union(v.literal("image"), v.literal("video")),
        uploadedAt: v.number(),

    }).index("by_albumId", ["albumId"])
        .index("by_profileId", ["uploadedById"]),

    comments: defineTable({
        mediaId: v.id("media"),
        profileId: v.id("profiles"),
        text: v.string(),
        createdAt: v.number(),
    }).index("by_mediaId", ["mediaId"])
        .index("by_profileId", ["profileId"]),

    likes: defineTable({
        mediaId: v.id("media"),
        profileId: v.id("profiles"),
        createdAt: v.number(), // Timestamp
    })
        .index("by_mediaId", ["mediaId"])
        .index("by_profileId", ["profileId"])
        // Ensure a user can only like a piece of media once
        .index("by_mediaId_profileId", ["mediaId", "profileId"]),

    reactions: defineTable({
        mediaId: v.id("media"),
        profileId: v.id("profiles"),
        emoji: v.string(), // Store the emoji as a string
        createdAt: v.number(), // Timestamp
    })
        .index("by_mediaId", ["mediaId"])
        .index("by_profileId", ["profileId"]),
});