"use node";

import axios from "axios";
import { v } from "convex/values";
import crypto from 'crypto';
import { api } from "./_generated/api";
import { action, internalAction } from "./_generated/server";

const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const UPLOAD_BASE_URL = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}`;
const DELIVERY_BASE_URL = `https://customer-${process.env.CLOUDFLARE_CUSTOMER_CODE}.cloudflarestream.com`;

export const prepareVideoUpload = action({
    args: {
        albumId: v.id('albums'),
        filename: v.string(),
    },
    handler: async (ctx, { albumId, filename }): Promise<{ uploadURL: string, uid: string }> => {
        const membership = await ctx.runQuery(api.albumMembers.getMembership, { albumId });
        if (!membership || membership === 'not-a-member') throw new Error("Not a member of this album");

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
            throw new Error("Invalid response");
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
    handler: async (ctx, { albumId, videoUID }): Promise<string> => {
        const membership = await ctx.runQuery(api.albumMembers.getMembership, { albumId });
        if (!membership || membership === 'not-a-member') throw new Error('Unauthorized');

        const token = await constructSig(videoUID);

        return `${DELIVERY_BASE_URL}/${token}/thumbnails/thumbnail.jpg`;
    }
});

export const getVideoPlaybackURL = action({
    args: {
        albumId: v.id('albums'),
        videoUID: v.string(),
    },
    handler: async (ctx, { albumId, videoUID }): Promise<string> => {
        const membership = await ctx.runQuery(api.albumMembers.getMembership, { albumId });
        if (!membership || membership === 'not-a-member') throw new Error('Unauthorized');

        const token = await constructSig(videoUID);

        return `${DELIVERY_BASE_URL}/${token}/manifest/video.m3u8`;
    }
});

// ------------ Internal ------------

export const getPublicThumbnail = internalAction({
    args: { videoUID: v.string() },
    handler: async (ctx, { videoUID }): Promise<string> => {
        const token = await constructSig(videoUID);
        return `${DELIVERY_BASE_URL}/${token}/thumbnails/thumbnail.jpg`;
    }
})

export const deleteVideo = internalAction({
    args: { videoUID: v.string() },
    handler: async (ctx, { videoUID }) => {
        const url = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/stream/${videoUID}`;
        await axios.delete(url, {
            headers: {
                Authorization: `Bearer ${API_TOKEN}`,
            }
        }).catch(e => {
            console.error('Failed to delete video from Cloudflare Stream', e);
            throw new Error('Failed to delete video');
        });
    }
})

async function constructSig(videoUID: string) {
    const base64PEM = process.env.CLOUDFLARE_STREAM_PEM;
    const keyID = process.env.CLOUDFLARE_STREAM_KEY_ID;

    if (!base64PEM || !keyID) throw new Error('Missing PEM or Key ID');

    const pem = Buffer.from(base64PEM, 'base64').toString('utf8');
    const expiresIn = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour

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