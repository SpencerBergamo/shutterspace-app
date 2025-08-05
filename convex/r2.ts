import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ENDPOINT_URL = process.env.R2_ENDPOINT_URL;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.R2_BUCKET_NAME;

const s3Client = new S3Client({
    endpoint: R2_ENDPOINT_URL,
    credentials: {
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY,
    },
    region: 'auto',
});

export const generateSignedGetUrl = async (fileKey: string, expiresIn = 600): Promise<string> => {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
}

export const generateSignedPutUrl = async (fileKey: string, contentType: string, expiresIn = 300): Promise<string> => {
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
        ContentType: contentType,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
}

export default s3Client;