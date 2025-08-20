import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    profiles: defineTable({
        firebaseUID: v.string(),
        joined: v.number(),
        authProvider: v.union(
            v.literal("email"),
            v.literal("google"),
            v.literal("apple"),
        ),
        email: v.string(),
        nickname: v.string(),
        avatarKey: v.optional(v.string()), // R2 key for public avatars: 'avatars/{profile._id}.jpg'
        ssoAvatarUrl: v.optional(v.string()), // URL for SSO avatars
    }).index('by_firebase_uid', ['firebaseUID']),

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
        hostId: v.id("profiles"),
        title: v.string(),
        description: v.optional(v.string()),
        thumbnailFileId: v.optional(v.id('media')),
        isDynamicThumbnail: v.boolean(),
        openInvites: v.boolean(),
        dateRange: v.optional(v.object({
            start: v.string(),
            end: v.optional(v.string()),
        })),
        location: v.optional(v.object({
            lat: v.number(),
            lng: v.number(),
            name: v.optional(v.string()),
            address: v.optional(v.string()),
        })),
        updatedAt: v.number(),
        expiresAt: v.optional(v.number()),
        isDeleted: v.boolean(),
    }),

    albumMembers: defineTable({
        albumId: v.id("albums"),
        profileId: v.id("profiles"),
        role: v.union(
            v.literal('member'),
            v.literal('moderator'),
            v.literal('host'),
        ),
        joinedAt: v.number(),
    }).index("by_albumId", ["albumId"])
        .index("by_profileId", ["profileId"])
        .index("by_album_profileId", ["albumId", "profileId"]),

    joinCodes: defineTable({
        albumId: v.id('albums'),
        expiresAt: v.optional(v.number()),
    }),

    media: defineTable({
        albumId: v.id("albums"),
        uploaderId: v.id('profiles'),
        fileType: v.union(v.literal('image'), v.literal('video')), // image/jpg, video/mp4, etc.
        originalFilename: v.string(),
        uploadedAt: v.number(),

        size: v.optional(v.number()),
        width: v.optional(v.number()),
        height: v.optional(v.number()),
        duration: v.optional(v.number()),
        dateTaken: v.optional(v.string()),

        location: v.optional(v.object({
            lat: v.number(),
            lng: v.number(),
            name: v.optional(v.string()),
            address: v.optional(v.string()),
        })),

        isDeleted: v.boolean(),
    }).index("by_albumId", ["albumId"])
        .index("by_profileId", ["uploaderId"]),

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