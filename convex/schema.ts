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
        shareCode: v.optional(v.string()),
    }).index('by_firebase_uid', ['firebaseUID']),

    friendships: defineTable({
        profileId: v.id('profiles'),
        friendId: v.id('profiles'),
        status: v.union(
            v.literal('pending'),
            v.literal('accepted'),
            v.literal('blocked'),
        ),
        createdAt: v.number(),
        updatedAt: v.number(),
    }).index('by_profileId', ['profileId'])
        .index('by_pair', ['profileId', 'friendId']),

    albums: defineTable({
        hostId: v.id("profiles"),
        title: v.string(),
        description: v.optional(v.string()),
        thumbnail: v.optional(v.id('media')),
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
        deletionScheduledAt: v.optional(v.number()),
        scheduledDeletionId: v.optional(v.id('_scheduled_functions')),
    }).index('by_hostId', ['hostId'])
        .index('by_updatedAt', ['updatedAt'])
        .index('by_dateRange', ['dateRange'])
        .index('by_location', ['location'])
        .index('by_isDeleted', ['isDeleted']),

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

    inviteCodes: defineTable({
        code: v.string(), // 6-character alphanumeric code
        albumId: v.id('albums'),
        createdBy: v.id('profiles'),
        role: v.union(
            v.literal('member'),
            v.literal('moderator'),
        ),
    }).index('by_code', ['code'])
        .index('by_albumId', ['albumId']),

    media: defineTable({
        albumId: v.id("albums"),
        createdBy: v.id('profiles'),
        assetId: v.string(),
        filename: v.string(),
        identifier: v.union(
            v.object({
                type: v.literal('image'),
                imageId: v.string(),
                width: v.number(),
                height: v.number(),
            }),
            v.object({
                type: v.literal('video'),
                videoUid: v.string(),
                duration: v.number(),
                width: v.optional(v.number()),
                height: v.optional(v.number()),
            }),
        ),
        size: v.optional(v.number()),
        dateTaken: v.optional(v.string()),
        location: v.optional(v.object({
            lat: v.number(),
            lng: v.number(),
            name: v.optional(v.string()),
            address: v.optional(v.string()),
        })),
        status: v.union(
            v.literal('pending'),
            v.literal('ready'),
            v.literal('error'),
        ),
        isDeleted: v.boolean(),
    }).index("by_albumId", ["albumId"])
        .index("by_profileId", ["createdBy"])
        .index("by_videoUid", ["identifier.videoUid"])
        .index('by_isDeleted', ['isDeleted']),

    comments: defineTable({
        mediaId: v.id("media"),
        createdBy: v.id("profiles"),
        text: v.string(),
        createdAt: v.number(),
        parentCommentId: v.optional(v.id('comments')),
    }).index("by_mediaId", ["mediaId"])
        .index("by_profileId", ["createdBy"])
        .index("by_parentCommentId", ["parentCommentId"]) // for threaded replies
        .index('by_mediaId_createdAt', ['mediaId', 'createdAt']), // for chronological ordering

    likes: defineTable({
        mediaId: v.id("media"),
        profileId: v.id("profiles"),
        createdAt: v.number(), // Timestamp
    }).index("by_mediaId", ["mediaId"])
        .index("by_profileId", ["profileId"])
        .index("by_mediaId_profileId", ["mediaId", "profileId"]), // for tracking likes per media
});