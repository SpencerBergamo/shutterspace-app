"use node";

import axios from "axios";
import { v } from "convex/values";
import crypto from 'crypto';
import { api, internal } from "./_generated/api";
import { action, internalAction } from "./_generated/server";

const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const UPLOAD_BASE_URL = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}`;
const DELIVERY_BASE_URL = `https://customer-${process.env.CLOUDFLARE_CUSTOMER_CODE}.cloudflarestream.com`;


// ------------------------------------------------------------
// UploadURLs
// ------------------------------------------------------------

export const requestImageUploadURL = internalAction({
    args: {
        filename: v.string(),
    }, handler: async (_ctx, { filename }) => {

        const url = `${UPLOAD_BASE_URL}/images/v2/direct_upload`;
        const form = new FormData();
        form.append('requireSignedURLs', 'true');
        form.append('metadata', JSON.stringify({ filename }));

        const response = await axios.post(url, form, {
            headers: {
                Authorization: `Bearer ${API_TOKEN}`,
            }
        });

        return response.data;
    }
});

export const requestVideoUploadURL = internalAction({
    args: {
        filename: v.string(),
    }, handler: async (_ctx, { filename }) => {
        try {
            const url = `${UPLOAD_BASE_URL}/stream/direct_upload`;

            const response = await axios.post(url, {
                maxDurationSeconds: 60,
                requireSignedURLs: true,
                meta: { name: filename },
            }, {
                headers: {
                    Authorization: `Bearer ${API_TOKEN}`
                }
            });

            if (!response.data || response.status !== 200) {
                console.warn("Cloudflare video upload error: ", response.data);
                throw new Error("Invalid response");
            };

            return response.data;
        } catch (e) {
            if (axios.isAxiosError(e)) {
                console.error("Cloudflare video upload error: ", e.response?.data);
            }
            throw e;
        }
    }
});

// ------------------------------------------------------------
// Cloudflare Delivery URLs/Tokens
// ------------------------------------------------------------

export const requestImageURL = action({
    args: {
        albumId: v.id('albums'),
        imageId: v.string(), // image_id
    }, handler: async (ctx, { albumId, imageId }): Promise<string> => {
        const membership = await ctx.runQuery(api.albumMembers.getMembership, { albumId });
        if (!membership || membership === 'not-a-member') throw new Error('Unauthorized');

        return await ctx.runAction(internal.cloudflare.imageDeliveryURL, { imageId });
    }
});

export const requestVideoThumbnailURL = action({
    args: {
        albumId: v.id('albums'),
        videoUID: v.string(),
    },
    handler: async (ctx, { albumId, videoUID }): Promise<string> => {
        const membership = await ctx.runQuery(api.albumMembers.getMembership, { albumId });
        if (!membership || membership === 'not-a-member') throw new Error('Unauthorized');

        try {
            const token = await ctx.runAction(internal.cloudflare.videoPlaybackToken, { videoUID });

            return `${DELIVERY_BASE_URL}/${videoUID}/thumbnails/thumbnail.jpg?time=2s&token=${token}`;

        } catch (e) {
            throw e
        }
    }
});

export const requestVideoPlaybackURL = action({
    args: {
        albumId: v.id('albums'),
        videoUID: v.string(),
    },
    handler: async (ctx, { albumId, videoUID }): Promise<string> => {
        const membership = await ctx.runQuery(api.albumMembers.getMembership, { albumId });
        if (!membership || membership === 'not-a-member') throw new Error('Unauthorized');

        const token = await ctx.runAction(internal.cloudflare.videoPlaybackToken, { videoUID });

        return `${DELIVERY_BASE_URL}/${token}/manifest/video.mp4`;
    }
});

export const requestAlbumCoverURL = action({
    args: {
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
    },
    handler: async (ctx, { identifier }): Promise<string> => {

        const type = identifier.type;
        const cloudflareId = type === 'video' ? identifier.videoUid : identifier.imageId;

        // Generate the appropriate URL based on media type
        if (type === 'image') {
            // Use a longer expiry for public album covers (24 hours)
            return await ctx.runAction(internal.cloudflare.imageDeliveryURL, {
                imageId: cloudflareId,
                expires: Math.floor(Date.now() / 1000) + 60 * 60 * 24
            });
        } else if (type === 'video') {
            const token = await ctx.runAction(internal.cloudflare.videoPlaybackToken, {
                videoUID: cloudflareId,
                expires: Math.floor(Date.now() / 1000) + 60 * 60 * 24
            });
            return `${DELIVERY_BASE_URL}/${cloudflareId}/thumbnails/thumbnail.jpg?token=${token}`;
        }

        throw new Error('Unsupported media type');
    },
})

// ------------------------------------------------------------
// Internal Actions
// ------------------------------------------------------------

export const imageDeliveryURL = internalAction({
    args: {
        imageId: v.string(),
        expires: v.optional(v.number()),
    },
    handler: async (_ctx, { imageId, expires }): Promise<string> => {
        const sigKey = process.env.CLOUDFLARE_IMAGE_SIG_TOKEN;
        const accountHash = process.env.CLOUDFLARE_ACCOUNT_HASH;

        const expiry = expires ?? Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour

        const path = `/${accountHash}/${imageId}/public?exp=${expiry}`;

        const sig = crypto.createHmac('sha256', sigKey).update(path).digest('hex');

        return `https://imagedelivery.net${path}&sig=${sig}`;
    }
});

export const videoPlaybackToken = internalAction({
    args: {
        videoUID: v.string(),
        expires: v.optional(v.number()),
    },
    handler: async (_ctx, { videoUID, expires }) => {
        const base64PEM = process.env.CLOUDFLARE_STREAM_PEM;
        const keyID = process.env.CLOUDFLARE_STREAM_KEY_ID;

        if (!base64PEM || !keyID) throw new Error('Missing PEM or Key ID');

        const pem = Buffer.from(base64PEM, 'base64').toString('utf8');
        const expiresIn = expires ?? Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour

        const header = {
            alg: 'RS256',
            typ: 'JWT', //new
            kid: keyID,
        };

        const payload = {
            sub: videoUID,
            exp: expiresIn,
            thumbnail: true,
        };

        const encode = (obj: any) => {
            const json = JSON.stringify(obj);
            return Buffer.from(json)
                .toString('base64')
                .replace(/=/g, "")
                .replace(/\+/g, "-")
                .replace(/\//g, "_");
        };

        const encodedHeader = encode(header);
        const encodedPayload = encode(payload);
        const message = `${encodedHeader}.${encodedPayload}`;

        const signer = crypto.createSign('RSA-SHA256');
        signer.update(message);
        signer.end();

        const signatureToBuffer = signer.sign(pem, 'base64');
        const signature = signatureToBuffer
            .replace(/=/g, "")
            .replace(/\+/g, "-")
            .replace(/\//g, "_");

        return `${message}.${signature}`;
    },
});

