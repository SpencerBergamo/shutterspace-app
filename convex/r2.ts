import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';


const s3Client = new S3Client({
    endpoint: process.env.R2_ENDPOINT_URL,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
    region: 'auto',
});

export const generateSignedGetUrl = async (bucket: string, fileKey: string, expiresIn = 600): Promise<string> => {
    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: fileKey,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
}

export const generateSignedPutUrl = async (bucket: string, fileKey: string, contentType: string, expiresIn = 300): Promise<string> => {
    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: fileKey,
        ContentType: contentType,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
}

export default s3Client;