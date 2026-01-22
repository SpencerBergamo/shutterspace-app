import { httpRouter } from "convex/server";
import { api, internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
    path: '/cloudflare/streams-webhook',
    method: 'POST',
    handler: httpAction(async (ctx, request) => {
        const signatureHeader = request.headers.get("Webhook-Signature");
        const rawBody = await request.text();
        if (!signatureHeader || !rawBody) {
            return new Response("Invalid Signature", { status: 400 });
        }

        const valid = await ctx.runAction(api.crypto.verifyWebhookSig, {
            signatureHeader,
            rawBody,
        });
        if (!valid) {
            return new Response("Invalid Signature", { status: 400 });
        }

        const payload = JSON.parse(rawBody);
        const uid = payload.uid;
        if (!uid) return new Response("Missing UID", { status: 400 });

        const statusResponse = payload.status.state;
        const status = statusResponse === 'ready' ? 'ready' : 'error';

        await ctx.runMutation(internal.media.updateMediaVideoStatus, {
            videoUid: uid,
            status: status,
        });

        return new Response(null, { status: 200 });
    }),
});

export default http;