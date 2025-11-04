"use node";

import { v } from 'convex/values';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { internal } from './_generated/api';
import { Id } from './_generated/dataModel';
import { action } from './_generated/server';

/**
 * @file crypto.ts - nodejs crypto helper functions
 */

export const verifyWebhookSig = action({
    args: {
        signatureHeader: v.string(),
        rawBody: v.string(),
    }, handler: async (ctx, args) => {
        const { signatureHeader, rawBody } = args;

        const sigMap: Record<string, string> = {};
        for (const part of signatureHeader.split(',')) {
            const [key, value] = part.split('=');
            sigMap[key] = value;
        }
        const timestamp = sigMap["time"];
        const signature = sigMap["sig1"];

        if (!timestamp || !signature) {
            console.error("Invalid Signature Header format: ", signatureHeader);
            return { valid: false };
        }

        const toleranceMs = 5 * 60 * 1000;
        if (Math.abs(Date.now() - Number(timestamp) * 1000) > toleranceMs) {
            console.error("Timestamp is too old or too far into the future");
            return { valid: false };
        }

        // Compute the expected HMAC.
        const secret = process.env.CLOUDFLARE_STREAMS_WEBHOOK_SECRET;
        const expected = crypto.createHmac('sha256', secret)
            .update(`${timestamp}.${rawBody}`)
            .digest('hex');

        // Finally, we'll compare the expected signature with the actual signature. We use a constant-time comparison to avoid timing attacks.
        // If we use '===' instead, an attacker could craft a malicious payload that takes longer to process, which could leak sensitive information.
        // timingSafeEqual is a constant-time comparison function that ensures the comparison is not affected by the length of the input.
        const valid = crypto.timingSafeEqual(
            Buffer.from(expected, "hex"),
            Buffer.from(signature, "hex")
        );

        return valid;
    }
});

export const generateInviteCode = action({
    args: {
        albumId: v.id('albums'),
        createdBy: v.id('profiles'),
        role: v.union(
            v.literal('member'),
            v.literal('moderator'),
        ),
    },
    handler: async (ctx, args): Promise<Id<'inviteCodes'>> => {

        const expiresAt = Date.now() + 1000 * 60 * 60 * 24; // 3 days
        const code = crypto.createHash('sha256').update(uuidv4()).digest('base64url');

        return await ctx.runMutation(internal.inviteCodes.createInviteCode, {
            ...args,
            expiresAt,
            code,
        });
    }
})