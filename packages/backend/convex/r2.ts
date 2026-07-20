'use node';

import {
    CopyObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ConvexError, v } from "convex/values";
import { v4 as uuidv4 } from 'uuid';
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { action, internalAction } from "./_generated/server";
import {
    CUSTOM_COVER_IMAGE_ID,
    coverObjectKey,
    galleryObjectKey,
} from "./lib/albumCover";
import { MEDIA_DELIVERY_URL_TTL_SECONDS } from "./lib/mediaDelivery";

const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

/** Mint a signed GET for a gallery image. Pure CPU; safe to call in a batch. */
export async function signGalleryImageUrl(
    albumId: Id<"albums">,
    imageId: string,
): Promise<{ url: string; expiresAt: number }> {
    const expiresAt = Date.now() + MEDIA_DELIVERY_URL_TTL_SECONDS * 1000;
    const url = await getSignedUrl(s3, new GetObjectCommand({
        Bucket: "uploads",
        Key: galleryObjectKey(albumId, imageId),
    }), { expiresIn: MEDIA_DELIVERY_URL_TTL_SECONDS });

    return { url, expiresAt };
}

export const prepareImageUpload = action({
    args: {
        albumId: v.id('albums'),
        filename: v.string(),
        contentType: v.string(),
        extension: v.string(),
        incomingSize: v.optional(v.number()),
    },
    handler: async (ctx, { albumId, filename, contentType, extension, incomingSize }): Promise<{ uploadUrl: string, imageId: string }> => {
        const membership = await ctx.runQuery(api.albumMembers.getMembership, { albumId });
        if (!membership || membership === 'not-a-member') throw new Error("Not a member of this album");

        await ctx.runQuery(internal.albums.assertAlbumAcceptsUploads, { albumId });
        await ctx.runQuery(internal.media.assertStorageWithinQuota, { incomingSize });

        const imageId = `${uuidv4()}.${extension}`;

        const uploadUrl = await getSignedUrl(s3, new PutObjectCommand({
            Bucket: "uploads",
            Key: galleryObjectKey(albumId, imageId),
            ContentType: contentType,
        }), { expiresIn: MEDIA_DELIVERY_URL_TTL_SECONDS });

        return { uploadUrl, imageId };
    }
})

export const prepareCoverUpload = action({
    args: {
        albumId: v.id('albums'),
        incomingSize: v.optional(v.number()),
    },
    handler: async (ctx, { albumId, incomingSize }): Promise<{ uploadUrl: string, imageId: string }> => {
        const membership = await ctx.runQuery(api.albumMembers.getMembership, { albumId });
        if (!membership || membership === 'not-a-member') throw new Error("Not a member of this album");

        await ctx.runQuery(internal.albums.assertAlbumAcceptsEdits, { albumId });
        await ctx.runQuery(internal.media.assertStorageWithinQuota, { incomingSize });

        const uploadUrl = await getSignedUrl(s3, new PutObjectCommand({
            Bucket: "uploads",
            Key: coverObjectKey(albumId),
            ContentType: "image/jpeg",
        }), { expiresIn: MEDIA_DELIVERY_URL_TTL_SECONDS });

        return { uploadUrl, imageId: CUSTOM_COVER_IMAGE_ID };
    },
})

export const copyCoverToGallery = internalAction({
    args: {
        albumId: v.id('albums'),
    },
    handler: async (_, { albumId }): Promise<string> => {
        const galleryImageId = `${uuidv4()}.jpg`;
        const sourceKey = coverObjectKey(albumId);
        const destKey = galleryObjectKey(albumId, galleryImageId);

        await s3.send(new CopyObjectCommand({
            Bucket: "uploads",
            CopySource: `uploads/${sourceKey}`,
            Key: destKey,
            ContentType: "image/jpeg",
            MetadataDirective: "REPLACE",
        }));

        return galleryImageId;
    },
})

export const deleteCoverObject = internalAction({
    args: { albumId: v.id('albums') },
    handler: async (_, { albumId }) => {
        await s3.send(new DeleteObjectCommand({
            Bucket: "uploads",
            Key: coverObjectKey(albumId),
        }));
    },
})

export const getImageURLInternally = internalAction({
    args: {
        albumId: v.id('albums'),
        imageId: v.string(),
    },
    returns: v.string(),
    handler: async (_, { albumId, imageId }) => {
        const { url } = await signGalleryImageUrl(albumId, imageId);
        return url;
    }
})

export const getImageURL = action({
    args: {
        albumId: v.id('albums'),
        imageId: v.string(),
    },
    returns: v.string(),
    handler: async (ctx, { albumId, imageId }): Promise<string> => {
        const membership = await ctx.runQuery(api.albumMembers.getMembership, { albumId });
        if (!membership || membership === 'not-a-member') {
            throw new ConvexError("Not a member of this album");
        }

        const { url } = await signGalleryImageUrl(albumId, imageId);
        return url;
    },
})

export const prepareAvatarUpload = action({
    args: {
        extension: v.string(),
        contentType: v.string(),
    },
    handler: async (ctx, { extension, contentType }): Promise<{ uploadUrl: string, avatarKey: string }> => {
        const profile = await ctx.runQuery(api.profile.getProfile);
        if (!profile) throw new Error("Profile not found");

        const avatarId = profile.avatarKey?.split('.')[0] ?? crypto.randomUUID();
        const avatarKey = `${avatarId}.${extension}`;

        const uploadUrl = await getSignedUrl(s3, new PutObjectCommand({
            Bucket: "avatar",
            Key: avatarKey,
            ContentType: contentType,
        }), { expiresIn: MEDIA_DELIVERY_URL_TTL_SECONDS });

        return { uploadUrl, avatarKey };
    }
})

export const getPublicObject = internalAction({
    args: { objectKey: v.string() },
    returns: v.string(),
    handler: async (_ctx, { objectKey }): Promise<string> => {
        return await getSignedUrl(s3, new GetObjectCommand({
            Bucket: "uploads",
            Key: objectKey,
        }), { expiresIn: MEDIA_DELIVERY_URL_TTL_SECONDS });
    }
})

export const deleteObject = internalAction({
    args: { objectKey: v.string() },
    handler: async (_ctx, { objectKey }) => {
        await s3.send(new DeleteObjectCommand({
            Bucket: "uploads",
            Key: objectKey,
        }))
    },
})
