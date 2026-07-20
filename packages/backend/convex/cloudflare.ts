"use node";

import axios from "axios";
import { ConvexError, v } from "convex/values";
import crypto from "crypto";
import { api, internal } from "./_generated/api";
import { action, internalAction } from "./_generated/server";
import { MEDIA_DELIVERY_URL_TTL_SECONDS } from "./lib/mediaDelivery";

const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const UPLOAD_BASE_URL = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}`;
const DELIVERY_BASE_URL = `https://customer-${process.env.CLOUDFLARE_CUSTOMER_CODE}.cloudflarestream.com`;

export type StreamDeliveryKind = "thumbnail" | "playback";

/** Mint a signed Stream delivery URL. Pure CPU; safe to call in a batch. */
export async function signStreamDeliveryUrl(
    videoUID: string,
    kind: StreamDeliveryKind,
): Promise<{ url: string; expiresAt: number }> {
    const token = await constructSig(videoUID);
    const expiresAt = Date.now() + MEDIA_DELIVERY_URL_TTL_SECONDS * 1000;
    const path = kind === "thumbnail"
        ? "thumbnails/thumbnail.jpg"
        : "manifest/video.m3u8";

    return {
        url: `${DELIVERY_BASE_URL}/${token}/${path}`,
        expiresAt,
    };
}

export const prepareVideoUpload = action({
    args: {
        albumId: v.id('albums'),
        filename: v.string(),
        incomingSize: v.optional(v.number()),
    },
    handler: async (ctx, { albumId, filename, incomingSize }): Promise<{ uploadURL: string, uid: string }> => {
        const membership = await ctx.runQuery(api.albumMembers.getMembership, { albumId });
        if (!membership || membership === 'not-a-member') throw new ConvexError("Not a member of this album");

        await ctx.runQuery(internal.albums.assertAlbumAcceptsUploads, { albumId });
        await ctx.runQuery(internal.media.assertStorageWithinQuota, { incomingSize });

        const url = `${UPLOAD_BASE_URL}/stream/direct_upload`;
        const response = await axios.post(url, {
            maxDurationSeconds: 60,
            requireSignedURLs: true,
            meta: { name: filename },
        }, {
            headers: {
                Authorization: `Bearer ${API_TOKEN}`,
            }
        })

        if (!response.data || response.status !== 200) {
            console.warn("Cloudflare video upload error: ", response.data);
            throw new ConvexError("Invalid response");
        };

        const { uploadURL, uid }: { uploadURL: string, uid: string } = response.data.result;
        return { uploadURL, uid };
    },
})

export const getVideoThumbnailURL = action({
    args: {
        albumId: v.id('albums'),
        videoUID: v.string(),
    },
    returns: v.string(),
    handler: async (ctx, { albumId, videoUID }): Promise<string> => {
        const membership = await ctx.runQuery(api.albumMembers.getMembership, { albumId });
        if (!membership || membership === 'not-a-member') throw new ConvexError('Unauthorized');

        const { url } = await signStreamDeliveryUrl(videoUID, "thumbnail");
        return url;
    }
});

export const getVideoPlaybackURL = action({
    args: {
        albumId: v.id('albums'),
        videoUID: v.string(),
    },
    returns: v.string(),
    handler: async (ctx, { albumId, videoUID }): Promise<string> => {
        const membership = await ctx.runQuery(api.albumMembers.getMembership, { albumId });
        if (!membership || membership === 'not-a-member') throw new ConvexError('Unauthorized');

        const { url } = await signStreamDeliveryUrl(videoUID, "playback");
        return url;
    }
});

export const getPublicThumbnail = internalAction({
    args: { videoUID: v.string() },
    returns: v.string(),
    handler: async (_ctx, { videoUID }): Promise<string> => {
        const { url } = await signStreamDeliveryUrl(videoUID, "thumbnail");
        return url;
    }
})

export const deleteVideo = internalAction({
    args: { videoUID: v.string() },
    handler: async (_ctx, { videoUID }) => {
        const url = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/stream/${videoUID}`;
        await axios.delete(url, {
            headers: {
                Authorization: `Bearer ${API_TOKEN}`,
            }
        }).catch(e => {
            console.error('Failed to delete video from Cloudflare Stream', e);
            throw new ConvexError('Failed to delete video');
        });
    }
})

async function constructSig(videoUID: string) {
    const base64PEM = process.env.CLOUDFLARE_STREAM_PEM;
    const keyID = process.env.CLOUDFLARE_STREAM_KEY_ID;

    if (!base64PEM || !keyID) throw new ConvexError('Missing PEM or Key ID');

    const pem = Buffer.from(base64PEM, 'base64').toString('utf8');
    const expiresIn = Math.floor(Date.now() / 1000) + MEDIA_DELIVERY_URL_TTL_SECONDS;

    const header = {
        alg: 'RS256',
        kid: keyID,
    };

    const payload = {
        sub: videoUID,
        kid: keyID,
        exp: expiresIn,
    };

    const b64url = (buf: Buffer): string => {
        return buf
            .toString('base64')
            .replace(/=/g, "")
            .replace(/\+/g, "-")
            .replace(/\//g, "_");
    }

    const encodedHeader = b64url(Buffer.from(JSON.stringify(header)));
    const encodedPayload = b64url(Buffer.from(JSON.stringify(payload)));
    const signingInput = `${encodedHeader}.${encodedPayload}`;

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signingInput);
    const signatureBuffer = signer.sign(pem);
    const signature = b64url(signatureBuffer);

    return `${signingInput}.${signature}`;
}
