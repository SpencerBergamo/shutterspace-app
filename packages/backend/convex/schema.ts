import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Transitional schema (backwards-compatible with production).
 *
 * Legacy fields stay optional so older app versions keep working while newer
 * clients use the ADR fields. Run phase-1 `backfill*` migrations after deploy,
 * then phase-2 `drop*` migrations once all users are on the new app, then
 * remove the legacy fields from this file in a follow-up PR.
 */
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
        shareCodeUpdatedAt: v.optional(v.number()),
        // ADR-0004 (new)
        storageUsedBytes: v.optional(v.number()),
        storageLimitBytes: v.optional(v.number()),
        // ADR-0004 legacy — drop via dropLegacyProfileStorageQuota
        storageQuota: v.optional(v.number()),
        isDeleted: v.optional(v.boolean()),
    }).index('by_firebase_uid', ['firebaseUID'])
        .index('by_shareCode', ['shareCode']),

    friendships: defineTable({
        members: v.optional(v.array(v.id('profiles'))),
        senderId: v.id('profiles'),
        recipientId: v.id('profiles'),
        status: v.union(
            v.literal('pending'),
            v.literal('accepted'),
            v.literal('blocked'),
            v.literal('rejected'),
        ),
        createdAt: v.optional(v.number()),
        updatedAt: v.number(),
    }).index('by_senderId', ['senderId'])
        .index('by_recipientId', ['recipientId']),

    // ADR-0002: explicit lifecycle status, epoch-ms event times + IANA timezone,
    // and a scalar `startsAt` for date-range queries.
    albums: defineTable({
        hostId: v.id("profiles"),
        title: v.string(),
        description: v.optional(v.string()),
        // Legacy pin — Phase 1: backfillAlbumCovers; Phase 2: dropAlbumThumbnails
        thumbnail: v.optional(v.id('media')),
        // Denormalized display cover (list / header / invite).
        cover: v.optional(v.union(
            v.object({
                type: v.literal('image'),
                imageId: v.string(),
                width: v.number(),
                height: v.number(),
                size: v.optional(v.number()),
                mediaId: v.optional(v.id('media')),
            }),
            v.object({
                type: v.literal('video'),
                videoUid: v.string(),
                duration: v.number(),
                width: v.optional(v.number()),
                height: v.optional(v.number()),
                mediaId: v.optional(v.id('media')),
            }),
        )),
        isDynamicThumbnail: v.boolean(),
        openInvites: v.boolean(),
        // Transitional: legacy ISO-string range OR new epoch+timezone range.
        // Phase 1 leaves strings in place (old clients); Phase 2 normalizes.
        dateRange: v.optional(v.union(
            v.object({
                start: v.string(),
                end: v.optional(v.string()),
            }),
            v.object({
                start: v.number(),
                end: v.optional(v.number()),
                timezone: v.string(),
            }),
        )),
        startsAt: v.optional(v.number()),
        location: v.optional(v.object({
            lat: v.number(),
            lng: v.number(),
            name: v.optional(v.string()),
            address: v.optional(v.string()),
        })),
        // ADR-0002 new — optional until backfillAlbumLifecycleAndTimes
        status: v.optional(v.union(
            v.literal('active'),
            v.literal('archived'),
            v.literal('trashed'),
        )),
        // ADR-0002 legacy — drop via dropLegacyAlbumLifecycleFields
        isDeleted: v.optional(v.boolean()),
        updatedAt: v.number(),
        expiresAt: v.optional(v.number()),
        scheduledArchiveId: v.optional(v.id('_scheduled_functions')),
        deletionScheduledAt: v.optional(v.number()),
        scheduledDeletionId: v.optional(v.id('_scheduled_functions')),
    }).index('by_hostId', ['hostId'])
        .index('by_updatedAt', ['updatedAt'])
        .index('by_startsAt', ['startsAt'])
        .index('by_status', ['status'])
        .searchIndex('by_title', {
            searchField: "title"
        }),

    // ADR-0001: roles are `member`/`moderator` only going forward. Host is
    // albums.hostId. Legacy `host`/`pending` roles remain allowed until
    // dropLegacyHostAlbumMemberRows.
    albumMembers: defineTable({
        albumId: v.id("albums"),
        profileId: v.id("profiles"),
        role: v.union(
            v.literal('member'),
            v.literal('moderator'),
            // Legacy (production) — remove after dropLegacyHostAlbumMemberRows
            v.literal('host'),
            v.literal('pending'),
        ),
        // ADR-0001 new — optional until backfillAlbumMemberStatus
        status: v.optional(v.union(
            v.literal('pending'),
            v.literal('active'),
        )),
        joinedAt: v.number(),
        updatedAt: v.optional(v.number()),
    }).index("by_albumId", ["albumId"])
        .index("by_profileId", ["profileId"])
        .index("by_album_profileId", ["albumId", "profileId"])
        .index("by_album_status", ["albumId", "status"]),

    inviteCodes: defineTable({
        code: v.string(), // 6-character alphanumeric code
        albumId: v.id('albums'),
        createdBy: v.id('profiles'),
        role: v.union(
            v.literal('member'),
            v.literal('moderator'),
        ),
        openInvites: v.optional(v.boolean()),
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
        // Transitional: legacy EXIF/ISO string OR epoch ms.
        dateTaken: v.optional(v.union(v.string(), v.number())),
        location: v.optional(v.object({
            lat: v.number(),
            lng: v.number(),
            name: v.optional(v.string()),
            address: v.optional(v.string()),
        })),
        // Legacy soft-delete — drop via dropLegacyAlbumLifecycleFields
        isDeleted: v.optional(v.boolean()),
        status: v.union(
            v.literal('pending'),
            v.literal('ready'),
            v.literal('error'),
        ),
    }).index("by_albumId", ["albumId"])
        .index("by_profileId", ["createdBy"])
        .index("by_videoUid", ["identifier.videoUid"]),

    comments: defineTable({
        mediaId: v.id("media"),
        createdBy: v.id("profiles"),
        text: v.string(),
        createdAt: v.number(),
        parentCommentId: v.optional(v.id('comments')),
    }).index("by_mediaId", ["mediaId"])
        .index("by_profileId", ["createdBy"])
        .index("by_parentCommentId", ["parentCommentId"])
        .index('by_mediaId_createdAt', ['mediaId', 'createdAt']),

    likes: defineTable({
        mediaId: v.id("media"),
        profileId: v.id("profiles"),
        createdAt: v.number(),
    }).index("by_mediaId", ["mediaId"])
        .index("by_profileId", ["profileId"])
        .index("by_mediaId_profileId", ["mediaId", "profileId"]),
});
