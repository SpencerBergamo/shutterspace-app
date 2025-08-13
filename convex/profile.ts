import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import s3Client from "./r2";

export const getProfile = query({
    args: {
        fuid: v.string(),
    }, handler: async (ctx, { fuid }) => {
        const session = await ctx.auth.getUserIdentity();
        if (!session) throw new Error('Unauthorized');

        return await ctx.db.query('profiles')
            .withIndex('by_firebase_uid', q => q.eq('firebaseUID', fuid))
            .first();
    }
});

export const updateProfile = mutation({
    args: {
        profileId: v.id('profiles'),
        nickname: v.optional(v.string()),
        base64: v.optional(v.string()),
    }, handler: async (ctx, { profileId, nickname, base64 }) => {
        const session = await ctx.auth.getUserIdentity();
        if (!session || session.subject !== profileId) throw new Error('Unauthorized');

        const profile = await ctx.db.get(profileId);
        if (!profile) throw new Error('Profile not found');

        let updates: { nickname?: string, avatarKey?: string } = {};

        if (base64) {
            const buffer = Buffer.from(base64, 'base64');
            const avatarKey = `avatar/${profile._id}.jpg`;

            try {
                await s3Client.send(new PutObjectCommand({
                    Bucket: process.env.R2_AVATAR_BUCKET,
                    Key: avatarKey,
                    Body: buffer,
                    ContentType: 'image/jpeg',
                    ACL: 'public-read',
                }));

                updates = { nickname, avatarKey }

            } catch (e) {
                console.error('R2 upload failed', e);
                throw new Error('Failed to upload avatar to R2');
            }
        } else {
            updates = { nickname }
        }

        await ctx.db.patch(profileId, updates);
        return await ctx.db.get(profileId);
    },
})