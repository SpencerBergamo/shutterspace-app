'use node';

import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v } from "convex/values";
import { v4 as uuidv4 } from 'uuid';
import { api } from "./_generated/api";
import { action, internalAction } from "./_generated/server";

const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

export const prepareImageUpload = action({
    args: {
        albumId: v.id('albums'),
        filename: v.string(),
        contentType: v.string(),
    },
    handler: async (ctx, { albumId, filename, contentType }): Promise<{ uploadUrl: string, imageId: string }> => {
        const membership = await ctx.runQuery(api.albumMembers.getMembership, { albumId });
        if (!membership || membership === 'not-a-member') throw new Error("Not a member of this album");

        const imageId = `${uuidv4()}.${filename.split('.').pop()}`; // should be uuidv4 + file extension
        console.log("imageId: ", imageId);

        const uploadUrl = await getSignedUrl(s3, new PutObjectCommand({
            Bucket: "uploads",
            Key: `album/${albumId}/${imageId}`,
            ContentType: contentType,
        }), { expiresIn: 3600 });

        return { uploadUrl, imageId };
    }
})

export const getImageURL = action({
    args: {
        albumId: v.id('albums'),
        imageId: v.string(),
    },
    handler: async (ctx, { albumId, imageId }): Promise<string> => {
        const membership = await ctx.runQuery(api.albumMembers.getMembership, { albumId });
        if (!membership || membership === 'not-a-member') throw new Error("Not a member of this album");

        const url = await getSignedUrl(s3, new GetObjectCommand({
            Bucket: "uploads",
            Key: `album/${albumId}/${imageId}`,
        }), { expiresIn: 3600 });

        return url;
    },
})

export const getPublicObject = internalAction({
    args: { objectKey: v.string() },
    handler: async (ctx, { objectKey }): Promise<string> => {
        return await getSignedUrl(s3, new GetObjectCommand({
            Bucket: "uploads",
            Key: objectKey,
        }), { expiresIn: 3600 });
    }
})