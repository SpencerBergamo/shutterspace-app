import { httpRouter } from "convex/server";
import { api } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

/*

- the webhook notification url must include the protocol (http:// or https://)
curl -X POST --header 'Authorization: Bearer <API_TOKEN>' \
https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/stream/webhook \
--data '{"notificationUrl":"<WEBHOOK_NOTIFICATION_URL>"}'

=> 200 OK
{
  "result": {
    "notificationUrl": "http://www.your-service-webhook-handler.com",
    "modified": "2019-01-01T01:02:21.076571Z"
    "secret": "85011ed3a913c6ad5f9cf6c5573cc0a7"
  },
  "success": true,
  "errors": [],
  "messages": []
}

- when the video on your acount finishes processing, you will receive a POST request notification with 
information about the video. The status field indicates whether the video processing finished successfully.

{
    "uid": "dd5d531a12de0c724bd1275a3b2bc9c6",
    "readyToStream": true,
    "status": {
      "state": "ready"
    },
    "meta": {},
    "created": "2019-01-01T01:00:00.474936Z",
    "modified": "2019-01-01T01:02:21.076571Z",
}

 */

// ------------------------------------------------------------
// Cloudflare Images Webhook
// ------------------------------------------------------------
export const imagesWebhook = httpAction(async (ctx, request) => {
    const data = await request.json();
    console.log("data: ", data);
    return new Response(null, { status: 200 });
});

http.route({
    path: '/cloudflare/images-webhook',
    method: 'POST',
    handler: imagesWebhook,
});



// ------------------------------------------------------------
// Cloudflare Streams Webhook
// ------------------------------------------------------------
export const streamsWebhook = httpAction(async (ctx, request) => {
    const data = await request.json();
    console.log("data: ", data);

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

    let uploadStatus: 'pending' | 'uploading' | 'success' | 'error';
    if (payload.status.state === 'ready') {
        uploadStatus = 'success';
    } else if (payload.status.state === 'error') {
        uploadStatus = 'error';
    } else {
        uploadStatus = 'uploading';
    }

    console.log("uploadStatus: ", uploadStatus);

    await ctx.runMutation(api.media.updateMediaUploadStatusByVideoUid, {
        videoUid: uid,
        status: uploadStatus,
    });

    return new Response(null, { status: 200 });
});

http.route({
    path: '/cloudflare/streams-webhook',
    method: 'POST',
    handler: streamsWebhook,
});

export default http;