# Cloudflare R2 Storage Setup for Shutterspace

## Overview

Shutterspace uses Cloudflare R2 (S3-compatible object storage) for managing user-generated content with a dual-bucket architecture:

- **Avatar Bucket**: Public access for profile pictures
- **Uploads Bucket**: Private access for album media with signed URLs

This setup provides cost-effective storage with global CDN distribution while maintaining security through signed URLs for private content.

## CloudFlare & Environment Setup

We'll add the following variables in our `.env` for CloudFlare R2 which can be obtained from [Cloudflare R2](https://www.cloudflare.com/products/r2/):
1. R2 Dashboard → Manage R2 API Tokens
2. Create/Open storage bucket and get the endpoint url: `https://account-id.r2.cloudflarestorage.com`

```bash
# Cloudflare R2 Configuration
R2_ENDPOINT_URL=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=your_bucket_name
```

## S3 Client Setup

The app uses the AWS SDK v3 S3 client (`aws-sdk-js-vs`) configured for R2 compatibility:

```typescript
// convex/r2.ts
import { S3Client } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
    endpoint: process.env.R2_ENDPOINT_URL,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
    region: 'auto', // R2 uses 'auto' region
});
```

## Bucket Architecture

### 1. Avatar Bucket (Public Access)

**Purpose**: Store user profile pictures with immediate public access

**Key Pattern**: `avatar/<profileId>.jpg`

**Access**: Public read, no authentication required

**Use Case**: Profile pictures displayed throughout the app without generating signed URLs. This means we'll store the `key` in our convex db and construct the url endpoint client side to fetch the image data and display in-app.

**Example Implementation**:
```typescript
// Upload avatar with public ACL
await s3Client.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: `avatar/${profileId}.jpg`,
    Body: imageBuffer,
    ContentType: 'image/jpeg',
    ACL: 'public-read', // Makes the object publicly accessible
}));

// Direct URL construction
const avatarUrl = `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ENDPOINT_URL}/avatar/${profileId}.jpg`;
```

### 2. Uploads Bucket (Private Access)

**Purpose**: Store album media files with controlled access through signed URLs

**Key Patterns**:
- Images: `uploads/<albumId>/images/<mediaId>.jpg`
- Videos: `uploads/<albumId>/videos/<mediaId>.mp4`
- Thumbnails: `uploads/<albumId>/thumbnails/<mediaId>.jpg`

**Access**: Private, requires signed URLs for access

**Use Case**: For Album media, we'll store the file keys in our Convex database, but since the bucket is private, clients won't access the files directly. When the client needs read or write access, our Convex server-side functions act as the gatekeeper; they'll be used to verify the users authorization for such read & write access via album membership role, then generate a time-limited signed URL using the `generateSignedGetUrl()` and `generateSignedPutUrl()` from R2 storage.

For read access, the client receives the signed GET URL that grants temporary access (24 hours) to download the file in which the signature will be included in the fetch url. For write access, the client receives a PUT URL (5-10 minutes) that allows them to upload directly to the R2 bucket.

[**r2.ts File Implementation**](./convex/r2.ts)

## Security Considerations

1. **Avatar Bucket**: Public read access is acceptable for profile pictures
2. **Uploads Bucket**: All objects are private by default
3. **Signed URLs**: Provide time-limited access to private content
4. **Authorization**: Server-side validation ensures only album members can generate signed URLs

## Cost Optimization

- **Storage**: R2 offers competitive pricing compared to AWS S3
- **Bandwidth**: No egress fees for data retrieval
- **CDN**: Global edge locations for fast content delivery
- **Lifecycle Policies**: Consider implementing automatic deletion for old thumbnails

## Best Practices

1. **Key Naming**: Use consistent, hierarchical key structures for easy management
2. **Content Types**: Always set appropriate `ContentType` headers
3. **Error Handling**: Implement proper error handling for upload/download failures
4. **Monitoring**: Use R2 analytics to track usage and costs
5. **Backup**: Consider cross-region replication for critical data

## Troubleshooting

### Common Issues

1. **403 Forbidden**: Check API token permissions and bucket policies
2. **404 Not Found**: Verify bucket name and endpoint URL
3. **CORS Errors**: Ensure proper CORS configuration for web clients
4. **Signed URL Expired**: Increase `expiresIn` parameter for longer-lived URLs

### Debug Commands

```bash
# Test R2 connectivity
curl -H "Authorization: AWS4-HMAC-SHA256 ..." \
     "https://your-bucket.your-account-id.r2.cloudflarestorage.com/"

# List bucket contents
aws s3 ls s3://your-bucket --endpoint-url https://<account-id>.r2.cloudflarestorage.com
```

## Support Resources

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [R2 API Reference](https://developers.cloudflare.com/r2/api/)
- [S3 Compatibility Guide](https://developers.cloudflare.com/r2/api/s3/)
- [Cloudflare Community](https://community.cloudflare.com/)
