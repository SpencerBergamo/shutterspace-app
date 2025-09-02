"use node";

import { v } from "convex/values";
import crypto from 'crypto';
import { api } from "./_generated/api";
import { action } from "./_generated/server";

const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const BASE_URL = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}`;

/**
 * @function requestImageUploadURL
 * @description This function is used to request a upload URL for a single image.
 * @param {string} albumId - the ID of the album to request access to.
 * @param {string} profileId - the ID of the profile to request access to.
 * @param {string} filename - the name of the image file will be added to the metadata.
 * @returns {Promise<ImageDirectUploadURLResponse>} - a promise resolving to the upload URL, success status, errors, and messages.
 */
export const requestImageUploadURL = action({
    args: {
        albumId: v.id('albums'),
        profileId: v.id('profiles'),
        filename: v.string(),
    }, handler: async (ctx, { albumId, profileId, filename }) => {
        const identity = await ctx.auth.getUserIdentity();

        const membership = await ctx.runQuery(api.albums.getAlbumMembership, {
            albumId,
            profileId,
        });

        if (!membership || !identity) throw new Error('Unauthorized');

        const url = `${BASE_URL}/images/v2/direct_upload`;
        const form = new FormData();
        form.append('requireSignedURLs', 'true');
        form.append('metadata', JSON.stringify({ filename }));
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${API_TOKEN}`,
            },
            body: form,
        });

        if (!response.ok) {
            throw new Error("UploadURL Gen Failed: " + response.status + response.statusText);
        }

        return await response.json();
    },
});

/**
 * @function requestVideoUploadURL
 * @description This function is used to request a upload URL for a single video.
 * @param {string} albumId - the ID of the album to request access to.
 * @param {string} profileId - the ID of the profile to request access to.
 * @param {string} filename - the name of the video file will be added to the metadata.
 * @returns {Promise<VideoDirectUploadURLResponse>} - a promise resolving to the upload URL, success status, errors, and messages.
 */
export const requestVideoUploadURL = action({
    args: {
        albumId: v.id('albums'),
        profileId: v.id('profiles'),
        filename: v.string(),
    }, handler: async (ctx, { albumId, profileId, filename }) => {
        const identity = await ctx.auth.getUserIdentity();
        const membership = await ctx.runQuery(api.albums.getAlbumMembership, {
            albumId,
            profileId,
        });

        if (!membership || !identity) throw new Error('Unauthorized');

        const url = `${BASE_URL}/stream/direct_upload`
        // const form = new FormData();
        // form.append('maxDurationSeconds', '60');
        // form.append('requireSignedURLs', 'true');
        // form.append('meta', JSON.stringify({ filename }));
        const body = JSON.stringify({
            maxDurationSeconds: 60,
            requireSignedURLs: true,
            meta: { filename: filename },
        })

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${API_TOKEN}`,
            },
            body,
        });

        if (!response.ok) {
            const text = await response.text();
            console.error("Response Text: ", text);
            throw new Error("UploadURL Gen Failed: " + response.status + response.statusText);
        }

        const data = await response.json();
        console.log("Response: ", data);

        return data;
    }
});


/**
 * @function requestImageDeliveryURL
 * @description This function is used to request a signed image URL for a given image ID.
 * @param {string} albumId - the ID of the album to request access to.
 * @param {string} profileId - the ID of the profile to request access to.
 * @param {string} identifier - the ID of the image to request access to.
 * @param {string} variant - the variant of the image to request access to.
 * @returns {Promise<string>} - a promise resolving to the signed image URL.
 */
export const requestImageDeliveryURL = action({
    args: {
        albumId: v.id('albums'),
        profileId: v.id('profiles'),
        identifier: v.string(), // image_id
        variant: v.optional(v.string()), // variant name
    }, handler: async (ctx, { albumId, profileId, identifier, variant }) => {
        const identity = await ctx.auth.getUserIdentity();

        const membership = await ctx.runQuery(api.albums.getAlbumMembership, {
            albumId,
            profileId,
        });

        if (!membership || !identity) throw new Error('Unauthorized');

        return issueSignedImageURL(identifier);
    }
});

/**
 * @function requestVideoPlaybackToken
 * @description This function is used to request a signed video token for a given video UID.
 * @param {string} albumId - the ID of the album to request access to.
 * @param {string} profileId - the ID of the profile to request access to.
 * @param {string} videoUID - the UID of the video to request access to.
 * @returns {Promise<string>} - a promise resolving to the signed video token.
 */
export const requestVideoPlaybackToken = action({
    args: {
        albumId: v.id('albums'),
        profileId: v.id('profiles'),
        videoUID: v.string(),
    }, handler: async (ctx, { albumId, profileId, videoUID }) => {
        const identity = await ctx.auth.getUserIdentity();
        const membership = await ctx.runQuery(api.albums.getAlbumMembership, {
            albumId,
            profileId,
        });

        if (!membership || !identity) throw new Error('Unauthorized');

        return issueSignedVideoToken(videoUID);
    }
});

/** 
 * @function issueSignedImageURL
 * @description This function is used to issue a signed image URL for a given identifier.
 * @param {string} identifier - the identifier of the image to issue a signed URL for.
 * @returns {Promise<string>} - a promise resolving to the signed image URL.
 */
async function issueSignedImageURL(identifier: string): Promise<string> {
    const sigKey = process.env.CLOUDFLARE_IMAGE_SIG_TOKEN;
    const accountHash = process.env.CLOUDFLARE_ACCOUNT_HASH;

    const expiry = Math.floor(Date.now() / 1000) + 60 * 60 * 24;

    const path = `/${accountHash}/${identifier}/public?exp=${expiry}`;

    const sig = crypto.createHmac('sha256', sigKey).update(path).digest('hex');

    return `https://imagedelivery.net${path}&sig=${sig}`;
}

/**
 * @param videoUID @function issueSignedVideoToken
 * @description This function is used to issue a signed video token for a given video UID.
 * @param {string} videoUID - the UID of the video to issue a signed token for.
 * @returns {Promise<string>} - a promise resolving to the signed video token.
 * 
 * @reference https://developers.cloudflare.com/stream/viewing-videos/securing-your-stream/#step-2-generate-tokens-using-the-key
 */
async function issueSignedVideoToken(videoUID: string): Promise<string> {
    const pem = process.env.CLOUDFLARE_STREAM_PEM;
    const keyID = process.env.CLOUDFLARE_STREAM_KEY_ID;
    const expiresIn = Math.floor(Date.now() / 1000) + 60 * 60 * 24; // 1 day

    if (!pem || !keyID) throw new Error('Missing PEM or Key ID');

    const header = {
        alg: 'RS256',
        kid: keyID,
    };

    const payload = {
        sub: videoUID,
        exp: expiresIn,
    };

    const encode = (obj: any) => {
        return Buffer.from(JSON.stringify(obj), "utf8")
            .toString('base64')
            .replace(/=/g, "")
            .replace(/\+/g, "-")
            .replace(/\//g, "_");
    };

    const token = `${encode(header)}.${encode(payload)}`;

    try {
        const signer = crypto.createSign('RSA-SHA256');
        signer.update(token);
        signer.end();

        const signature = signer.sign(pem);
        const signatureB64 = signature
            .toString('base64')
            .replace(/=/g, "")
            .replace(/\+/g, "-")
            .replace(/\//g, "_");

        return `${token}.${signatureB64}`;
    } catch (e) {
        console.error("PEM Key format check: ", {
            hasPrivateKeyHeader: pem.includes('-----BEGIN PRIVATE KEY-----'),
            hasRSAHeader: pem.includes('-----BEGIN RSA PRIVATE KEY-----'),
            keyLength: pem.length,
            firstLine: pem.split('\n')[0]
        });

        throw new Error('issueSignedVideoToken FAIL: ' + e);
    }
}