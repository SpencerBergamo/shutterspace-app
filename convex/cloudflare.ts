"use node";

import axios from "axios";
import { v } from "convex/values";
import crypto from 'crypto';
import { api } from "./_generated/api";
import { action, internalAction } from "./_generated/server";

const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const BASE_URL = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}`;

/**
 * ------------------------------------------------------------
 * Action: Request Image Upload URL
 * 
 * @function requestImageUploadURL
 * @description This function is used to request a upload URL for a single image.
 * @param {string} albumId - the ID of the album to request access to.
 * @param {string} profileId - the ID of the profile to request access to.
 * @param {string} filename - the name of the image file will be added to the metadata.
 * @returns {Promise<ImageDirectUploadURLResponse>} - a promise resolving to the upload URL, success status, errors, and messages.
 * 
 * @reference https://developers.cloudflare.com/images/image-upload/direct-upload/
 * 
 * ------------------------------------------------------------
 */
export const requestImageUploadURL = internalAction({
    args: {
        filename: v.string(),
    }, handler: async (_ctx, { filename }) => {

        const url = `${BASE_URL}/images/v2/direct_upload`;
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
})

/**
 * ------------------------------------------------------------
 * Internal Action: Request Video Upload URL
 * 
 * @function requestVideoUploadURL
 * @description This function is used to request a upload URL for a single video.
 * @param {string} albumId
 * @param {string} profileId
 * @param {string} filename - the name of the video file will be added to the metadata.
 * @returns {Promise<VideoDirectUploadURLResponse>} 
 * 
 * @reference https://developers.cloudflare.com/stream/direct-upload/
 * 
 * ------------------------------------------------------------
 */
export const requestVideoUploadURL = internalAction({
    args: {
        filename: v.string(),
    }, handler: async (_ctx, { filename }) => {
        const url = `${BASE_URL}/stream/direct_upload`
        const form = new FormData();
        form.append('maxDurationSeconds', '60');
        form.append('requireSignedURLs', 'true');
        form.append('meta', JSON.stringify({ filename }));

        const response = await axios.post(url, form, {
            headers: {
                Authorization: `Bearer ${API_TOKEN}`,
            }
        });

        return response.data;
    }
});

/** 
 * ------------------------------------------------------------
 * Action: Request Image Delivery URL
 * 
 * @function requestImageDeliveryURL
 * @description This function is used to request a signed image URL for a given image ID.
 * @param {string} albumId - the ID of the album to request access to.
 * @param {string} profileId - the ID of the profile to request access to.
 * @param {string} imageId - the cloudflareID associated with the draft image.
 * @returns {Promise<string>}
 * 
 * @reference https://developers.cloudflare.com/images/image-delivery/secure-image-delivery/
 * 
 * ------------------------------------------------------------
 */
export const requestImageDeliveryURL = action({
    args: {
        albumId: v.id('albums'),
        profileId: v.id('profiles'),
        imageId: v.string(), // image_id
    }, handler: async (ctx, { albumId, profileId, imageId }) => {
        const identity = await ctx.auth.getUserIdentity();

        const membership = await ctx.runQuery(api.albums.getAlbumMembership, {
            albumId,
            profileId,
        });

        if (!membership || !identity) throw new Error('Unauthorized');

        const sigKey = process.env.CLOUDFLARE_IMAGE_SIG_TOKEN;
        const accountHash = process.env.CLOUDFLARE_ACCOUNT_HASH;

        const expiry = Math.floor(Date.now() / 1000) + 60 * 60 * 24;

        const path = `/${accountHash}/${imageId}/public?exp=${expiry}`;

        const sig = crypto.createHmac('sha256', sigKey).update(path).digest('hex');

        return `https://imagedelivery.net${path}&sig=${sig}`;
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

        const base64PEM = process.env.CLOUDFLARE_STREAM_PEM;
        const keyID = process.env.CLOUDFLARE_STREAM_KEY_ID;

        if (!base64PEM || !keyID) throw new Error('Missing PEM or Key ID');

        const pem = Buffer.from(base64PEM, 'base64').toString('utf8');
        const expiresIn = Math.floor(Date.now() / 1000) + 60 * 60 * 6; // 6 hours

        const header = {
            alg: 'RS256',
            typ: 'JWT', //new
            kid: keyID,
        };

        const payload = {
            sub: videoUID,
            exp: expiresIn,
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

        console.log(`Signed Video Token: ${message}.${signature}`);
        return `${message}.${signature}`;
    }
});

/**
 * @param videoUID @function issueSignedVideoToken
 * @description This function is used to issue a signed video token for a given video UID.
 * @param {string} videoUID - the UID of the video to issue a signed token for.
 * @returns {Promise<string>} - a promise resolving to the signed video token.
 * 
 * @reference https://developers.cloudflare.com/stream/viewing-videos/securing-your-stream/#step-2-generate-tokens-using-the-key
 */
// async function issueSignedVideoToken(videoUID: string): Promise<string> {
//     const base64PEM = process.env.CLOUDFLARE_STREAM_PEM;
//     const keyID = process.env.CLOUDFLARE_STREAM_KEY_ID;

//     if (!base64PEM || !keyID) throw new Error('Missing PEM or Key ID');

//     const pem = Buffer.from(base64PEM, 'base64').toString('utf8');
//     const expiresIn = Math.floor(Date.now() / 1000) + 60 * 60 * 6; // 6 hours

//     const header = {
//         alg: 'RS256',
//         typ: 'JWT', //new
//         kid: keyID,
//     };

//     const payload = {
//         sub: videoUID,
//         exp: expiresIn,
//     };

//     const encode = (obj: any) => {
//         const json = JSON.stringify(obj);
//         return Buffer.from(json)
//             .toString('base64')
//             .replace(/=/g, "")
//             .replace(/\+/g, "-")
//             .replace(/\//g, "_");
//     };

//     const encodedHeader = encode(header);
//     const encodedPayload = encode(payload);
//     const message = `${encodedHeader}.${encodedPayload}`;

//     const signer = crypto.createSign('RSA-SHA256');
//     signer.update(message);
//     signer.end();

//     const signatureToBuffer = signer.sign(pem, 'base64');
//     const signature = signatureToBuffer
//         .replace(/=/g, "")
//         .replace(/\+/g, "-")
//         .replace(/\//g, "_");

//     // console.log(`Signed Video Token: ${message}.${signature}`);
//     return `${message}.${signature}`;
// };

// ------------------------------------------------------------
// Internal Action: Upload File
// ------------------------------------------------------------

export const uploadFile = internalAction({
    args: {
        uploadURL: v.string(),
        uri: v.string(),
        filename: v.string(),
        mimeType: v.string(),
    }, handler: async (_ctx, { uploadURL, uri, filename, mimeType }) => {

        const form = new FormData();
        form.append('file', {
            uri,
            filename,
            mimeType,
        } as any);

        const response = await axios.post(uploadURL, form);

        return response.status;
    }
});