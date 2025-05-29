"use node";
/**
 * Generates an HMAC SHA-256 signature using Web Crypto API
 * @param {string} payload - the data to sign
 * @param {string} secret - the secret key to use for the signing
 * @returns {Promise<string>} - promise resolving to hex-encoded signature
 * 
 * 1. client needs to upload: your user in the RN app selects a file they want to upload.
 * 2. client asks your backend for a signature: the rn app makes an api call to your
 *    convex function [generateUploadSignature] for example. 
 * 3. you backend generates the signature (using its secret key): you convex function, which
 *    securely holds your CloudinaryAPI secret, uses that secret andt he intended upload params
 *    (like upload preset and a timestampe) to generate the signature (just a SHA-256).  this is done
 *    using the Cloudinary algorithm (api_sign_request utility)
 * 4. your backend sends the signature to the client: your convex function returns the gen-signature 
 *    to the rn app
 * 5. client uses the signature to upload to cloudinary.
 * 6. cloudinary verifies the signature (using its secret). 
 * 
 * So most important, the signature should be generated in Convex so that's why we have this
 * cloudinary.ts file -- to generate a signature on the backend with the protected CloudinaryAPI
 * secret. 
 */

import { v2 as cloudinary } from 'cloudinary';
import { v } from "convex/values";
import { api } from './_generated/api';
import { Id } from './_generated/dataModel';
import { action } from "./_generated/server";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

export const generateSignatures = action({
    args: {
        albumId: v.id("albums"),
        numberOfSignatures: v.number(),
        uploadPreset: v.string(),
    }, handler: async (ctx, { albumId, numberOfSignatures, uploadPreset }) => {
        // gets the authenticated user from our convex/firebase setup -> @/hooks/useConvexAuthFromFirebase.ts
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not Authenticated");

        const uid = identity.subject;

        // check membership status
        // const membership = await ctx.db.query("albumMembers")
        // .withIndex("by_album_profileId", q => q.eq("albumId", args.albumId).eq("profileId", uid)).first();

        // i can use runQuery(internal.[...]) to execute another convex query from within the current function :)
        // you can call ctx.runQuery or ctx.runMutation when you need to encapsulate specific logic in a separate function
        // for organization, reusability, and security. 
        const isMember = await ctx.runQuery(api.albumMembers.isMember, {
            albumId: albumId,
            profileId: uid as Id<'profiles'>,
        });

        if (!isMember) throw new Error("Not a member of this album");

        const signatures = [];
        const baseFolder = `${albumId}/`;

        for (let i = 0; i < numberOfSignatures; i++) {
            const timestamp = Math.round(Date.now() / 1000);

            const paramsToSign: Record<string, any> = {
                timestamp,
                upload_preset: uploadPreset,
                folder: baseFolder,
                resource_type: 'auto', // automatically detect image/video
                allowed_formats: 'jpg,jpeg,png,heic,webp,mp4,mov,m4v,3pg', //restrict file types
                // max_file_size: 10485760, // 10mb limit
                transformation: 'f_auto,q_auto', // automatic format & quality optimization
                metaData: true, // store EXIF data
                faces: true, // enable face detection
            };

            const signature = cloudinary.utils.api_sign_request(
                paramsToSign,
                apiSecret as string
            );

            signatures.push({
                signature: signature,
                timestamp: timestamp,
            });
        }

        return {
            signatures: signatures,
            apiKey: apiKey,
            cloudName: cloudName,
            uploadPreset: uploadPreset,
            folder: baseFolder,
        }
    }
});

// specifically for profile avatars
export const generateProfileSignature = action({
    args: {
        profileId: v.id('profiles'),
    }, handler: async (ctx, { profileId }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not Authenticated");

        const uid = identity.subject;

        if (uid !== profileId) throw new Error("Unauthorized to update this profile avatar");

        const uploadPreset = 'shutterspace-profile'
        const timestamp = Math.round(Date.now() / 1000);
        const baseFolder = `${profileId}/`; // i already setup base folder to profiles/

        /// i already setup folder on Cloudinary upload_preset dashboard do i need to define here as well? 
        /// what if i want dynamic folder structures?
        const paramsToSign: Record<string, any> = {
            timestamp,
            upload_preset: uploadPreset,
            folder: baseFolder,
            resource_type: 'image',
            allowed_formats: 'jpg,jpeg,png,heic,webp',
            transformation: 'c_fill,w_400,h_400,g_face', // square crop with face detection
            metaData: true,
            faces: true,
        };

        const signature = cloudinary.utils.api_sign_request(
            paramsToSign,
            apiSecret as string,
        );

        return {
            signature,
            timestamp,
            apiKey,
            cloudName,
            uploadPreset: uploadPreset,
            folder: baseFolder,
        }
    }
})