import { httpRouter } from "convex/server";
import { api, internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

// ------------------------------------------------------------
// Cloudflare Images Webhook
// ------------------------------------------------------------

http.route({
    path: '/cloudflare/images-webhook',
    method: 'POST',
    handler: httpAction(async (ctx, request) => {

        const response = await request.json();
        console.log(response);

        const imageId = response.data.image.id;
        const imgStatus = response.data.image.status;

        await ctx.runMutation(internal.media.updateMediaStatus, {
            uid: imageId,
            type: 'image',
            status: imgStatus === 'success' ? 'ready' : 'error',
        });

        return new Response(null, { status: 200 });
    }),
})

// ------------------------------------------------------------
// Cloudflare Streams Webhook
// ------------------------------------------------------------

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

        await ctx.runMutation(internal.media.updateMediaStatus, {
            uid,
            type: 'video',
            status: status,
        });

        return new Response(null, { status: 200 });
    }),
});

export default http;