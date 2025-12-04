'use node';

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { action } from "./_generated/server";

const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});


export const getUploadURL = action({
    args: {},
    handler: async () => {


        const url = await getSignedUrl(s3, new PutObjectCommand({
            Bucket: '',
            Key: '',
        }), { expiresIn: 3600 });


    },
})