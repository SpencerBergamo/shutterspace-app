import { useProfile } from "@/context/ProfileContext";
import { useSignedUrls } from "@/context/SignedUrlsContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { DbMedia, Media, OptimisticMedia, ProcessAssetResponse, UploadURLResponse } from "@/types/Media";
import { useAction, useMutation, useQuery } from "convex/react";
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from "react";
import { useImagePicker } from "./useImagePicker";

/**
 * 
 * 
 * @constant {signedUrls} - tracks the signed urls for the ids
 * 
 * @constant {prefetch} - prefetches the signatures for the media. This will check to see
 * if the signature is already in the cache and not expired. If it's not, it will call [ensureSigned]
 * to generate a new signature and add it to the cache.
 * 
 * @constant {ensureSigned} - double check the signature doesnt exist or is expired before continueing
 * the request for a new signature. 
 * 
 * @constant {signedUrls} - manage signed urls of both media types in a map keyed by the id. Uses [SignedEntry]
 * to manage the url and expiry of the signed url.
 * @type {SignedEntry} - a type to manage image (signed urls) and video (signed tokens)
 * @type {TypeAndID} - a type and id for the media to make it easy to identify the type of media. The
 * type of media ('image' or 'video') specifies which id to use (id or uid, respectively).
 */


interface UseAlbumMediaResult {
    media: Media[];
    getType: (dbMedia: DbMedia) => TypeAndID;
    renderImageURL: (dbMedia: DbMedia) => Promise<string | undefined>;
    renderVideoURL: (dbMedia: DbMedia) => Promise<string | undefined>;
    uploadMedia: () => Promise<void>;
}


// export type SignedEntry = { url: string; expiresAt: number; }
type TypeAndID = { type: 'image' | 'video'; id: string; }

// Video Stream -> https://customer-<customer_id>.cloudflarestream.com/<signed_token>/

export const useMedia = (albumId: Id<'albums'>): UseAlbumMediaResult => {
    const { profileId } = useProfile();
    const { getSignedUrl, setSignedUrl } = useSignedUrls();

    const selectAssets = useImagePicker({ multiple: true, maxVideoDuration: 60 });
    const createMedia = useMutation(api.media.createMedia);
    const dbMedia: DbMedia[] | undefined = useQuery(api.media.getMediaForAlbum, { albumId, profileId });
    const [optimisticMedia, setOptimisticMedia] = useState<OptimisticMedia[]>([]);

    // Signatures
    const generateImageUploadURL = useAction(api.cloudflare.generateImageUploadURL);
    const generateSignedImageURL = useAction(api.cloudflare.generateSignedImageURL);
    const generateVideoUploadURL = useAction(api.cloudflare.generateVideoUploadURL);
    const generateVideoToken = useAction(api.cloudflare.generateVideoToken);

    const media = useCallback(() => {
        return [
            ...(optimisticMedia as OptimisticMedia[] || []),
            ...(dbMedia as DbMedia[] || []),
        ] as Media[];
    }, [dbMedia, optimisticMedia]);

    const parseExpiry = (url: string): number => {
        if (!url || url.trim() === '') return 0;
        try {
            const u = new URL(url);
            const exp = u.searchParams.get('exp');
            if (!exp) return 0;

            const seconds = parseInt(exp, 10);
            if (Number.isNaN(seconds)) return 0;
            return seconds * 1000; // convert to milliseconds
        } catch (e) {
            console.error("Error parsing expiry: ", url, e);
            return 0;
        }
    }

    const getType = (dbMedia: DbMedia): TypeAndID => {
        const type = dbMedia.asset.type;
        const id = type === 'image' ? dbMedia.asset.imageId : dbMedia.asset.videoUid;
        return { type, id };
    }

    const ensureSigned = useCallback(async (id: string, type: 'image' | 'video'): Promise<string | undefined> => {
        const existing = getSignedUrl(id);
        console.log("ensureSigned existing: ", existing);
        if (existing) return existing;

        try {
            console.log("Calling API for Signed URL");
            if (type === 'image') {
                const url = await generateSignedImageURL({ identifier: id });
                const expiresAt = parseExpiry(url);
                const ttlMs = Math.max(expiresAt - Date.now(), 1000); // duration until expires at
                setSignedUrl(id, url, ttlMs);
                return url;
            } else if (type === 'video') {
                const token = await generateVideoToken({ videoUID: id });
                console.log("Video Token: ", token);
                const ttlMs = 24 * 60 * 60 * 1000; // duration until expires at 24 hours
                setSignedUrl(id, token, ttlMs);
                return token;
            }
        } catch (e) {
            console.error(e);
        }

        return undefined;
    }, [generateSignedImageURL, generateVideoToken, getSignedUrl, setSignedUrl]);

    const prefetch = useCallback(async (media: DbMedia[]) => {
        const withTypeAndID: TypeAndID[] = media.map(m => {
            const { type, id } = getType(m);
            return { type, id };
        });

        const todo = withTypeAndID.filter(m => {
            const existing = getSignedUrl(m.id);
            return !existing;
        });

        if (todo.length === 0) return;
        await Promise.all(todo.map(m => {
            return ensureSigned(m.id, m.type);
        }))

    }, [ensureSigned]);

    const renderImageURL = useCallback(async (dbMedia: DbMedia) => {
        const { type, id } = getType(dbMedia);

        const cached = getSignedUrl(id);
        if (cached) {
            console.log("\nrenderImageURL cached: ", cached);
            return type === 'video'
                ? `https://customer-${process.env.CLOUDFLARE_CUSTOMER_CODE}.cloudflarestream.com/${cached}/thumbnails/thumbnail.png`
                : cached;
        }

        const ensured = await ensureSigned(id, type);
        if (!ensured) {
            console.warn('renderImageURL returned undefined for', id);
            return "https://placehold.co/600x400";
        }

        return type === 'video'
            ? `https://customer-${process.env.CLOUDFLARE_CUSTOMER_CODE}.cloudflarestream.com/${ensured}/thumbnails/thumbnail.png`
            : ensured;
    }, [ensureSigned]);

    const renderVideoURL = useCallback(async (dbMedia: DbMedia) => {
        const { type, id } = getType(dbMedia);
        if (type !== 'video') return renderImageURL(dbMedia);

        const base = `https://customer-${process.env.CLOUDFLARE_CUSTOMER_CODE}.cloudflarestream.com`;
        let url = getSignedUrl(id);

        if (!url) { url = await ensureSigned(id, type); }

        if (!url) return undefined;

        return `${base}/${url}/manifest/video.m3u8`;
    }, [ensureSigned]);

    useEffect(() => {
        if (!dbMedia || dbMedia.length === 0) return;
        prefetch(dbMedia);
    }, [dbMedia, prefetch]);

    /* Media Upload */
    const uploadMedia = useCallback(async () => {
        // const assets = await selectAssets();
        const { assets } = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsMultipleSelection: true,
            exif: true,
            videoMaxDuration: 60,
        });

        if (!assets || assets.length === 0) return;
        console.log("Assets: ", assets.length);

        for (const asset of assets) {
            const filename = asset.fileName || new Date().getTime() + Math.random().toString(36).substring(2, 15);

            setOptimisticMedia(prev => [...prev, {
                _id: filename,
                albumId,
                uploaderId: profileId,
                filename: filename,
                size: asset.fileSize,
                isDeleted: false,
                file: asset,
                type: asset.type === 'video' ? 'video' : 'image',
                status: 'pending',
            }]);
        }

        return;

        // const batch_size = 10;
        // for (let i = 0; i < optimisticMedia.length; i += batch_size) {
        //     const batch = optimisticMedia.slice(i, i + batch_size);
        //     await Promise.all(batch.map(async (optMedia) => {
        //         if (optMedia.type === 'image') {
        //             const response = await processImage(optMedia.file);
        //             if (response.status === 'success' && response.result) {
        //                 await createMedia({
        //                     albumId,
        //                     uploaderId: profileId,
        //                     filename: response.result.filename,
        //                     asset: {
        //                         type: 'image',
        //                         imageId: response.result.assetId,
        //                         width: response.result.width,
        //                         height: response.result.height,
        //                     },
        //                     size: response.result.size,
        //                 });
        //             }
        //         } else if (optMedia.type === 'video') {
        //             console.log("Processing Video: ", optMedia.file.fileName);
        //             const response = await processVideo(optMedia.file);
        //             if (response.status === 'success' && response.result) {
        //                 await createMedia({
        //                     albumId,
        //                     uploaderId: profileId,
        //                     filename: response.result.filename,
        //                     asset: {
        //                         type: 'video',
        //                         videoUid: response.result.assetId,
        //                         duration: response.result.duration ?? 0,
        //                     },
        //                     size: response.result.size,
        //                 });
        //             }
        //         }
        //     }));
        // }
    }, [albumId, profileId]);

    const processImage = useCallback(async (image: ImagePicker.ImagePickerAsset): Promise<ProcessAssetResponse> => {
        if (image.type !== 'image') return { status: 'error', error: 'Invalid image type', result: null };

        try {
            const filename = image.fileName || new Date().getTime() + Math.random().toString(36).substring(2, 15);
            const uploadUrlResponse: UploadURLResponse = await generateImageUploadURL({ filename: filename });

            if (!uploadUrlResponse.success) {
                console.error(uploadUrlResponse.errors.join(", "), '\n', uploadUrlResponse.messages.join(", "));
                return { status: 'error', error: 'Upload URL Generation Failed', result: null };
            }

            const { id, uploadURL } = uploadUrlResponse.result;
            const form = new FormData();
            form.append('file', {
                uri: image.uri,
                name: filename,
                type: image.mimeType || 'image/jpeg',
            } as unknown as Blob);

            const imgResponse = await fetch(uploadURL, {
                method: 'POST',
                body: form,
            });

            if (!imgResponse.ok) {
                console.error(`Failed to upload image ${imgResponse.status} - ${imgResponse.statusText}`);
                return { status: 'error', error: 'Failed to upload image', result: null };
            }

            ensureSigned(id, 'image');
            return {
                status: 'success',
                result: {
                    filename,
                    size: image.fileSize,
                    type: 'image',
                    assetId: id,
                    width: image.width,
                    height: image.height,
                }
            };
        } catch (e) {
            console.error(e);
            return { status: 'error', error: 'Failed to upload image', result: null };
        }
    }, [albumId, generateImageUploadURL, ensureSigned, profileId]);

    const processVideo = useCallback(async (video: ImagePicker.ImagePickerAsset): Promise<ProcessAssetResponse> => {
        if (video.type !== 'video') return { status: 'error', error: 'Invalid video type', result: null };

        try {
            const filename = video.fileName || new Date().getTime() + Math.random().toString(36).substring(2, 15);
            const uploadUrlResponse = await generateVideoUploadURL({ filename: filename });

            if (!uploadUrlResponse.success) {
                console.error(uploadUrlResponse.errors.join(", "), '\n', uploadUrlResponse.messages.join(", "));
                return { status: 'error', error: 'Upload URL Generation Failed', result: null };
            }

            const { uid, uploadURL } = uploadUrlResponse.result;
            const form = new FormData();
            form.append('file', {
                uri: video.uri,
                name: filename,
                type: video.mimeType || 'video/mp4',
            } as unknown as Blob);

            const videoResponse = await fetch(uploadURL, {
                method: 'POST',
                body: form,
            });

            if (!videoResponse.ok) {
                console.error(`Failed to upload video ${videoResponse.status} - ${videoResponse.statusText}`);
                return { status: 'error', error: 'Failed to upload video', result: null };
            }

            // Debugging
            const jsonVideoResponse = await videoResponse.json();
            console.log("Video Response: ", jsonVideoResponse);

            ensureSigned(uid, 'video');
            return {
                status: 'success',
                result: {
                    filename,
                    size: video.fileSize,
                    type: 'video',
                    assetId: uid,
                    duration: video.duration ?? 0,
                    width: video.width,
                    height: video.height,
                }
            };
        } catch (e) {
            console.error(e);
            return { status: 'error', error: 'Failed to upload video', result: null };
        }
    }, [albumId, generateVideoUploadURL, ensureSigned, profileId]);

    function splitAssets(assets: ImagePicker.ImagePickerAsset[]): {
        images: ImagePicker.ImagePickerAsset[];
        videos: ImagePicker.ImagePickerAsset[];
        other: ImagePicker.ImagePickerAsset[];
    } {
        const images = assets.filter(asset => asset.type === 'image');
        const videos = assets.filter(asset => asset.type === 'video');
        const other = assets.filter(asset => asset.type !== 'image' && asset.type !== 'video');

        return { images, videos, other };
    }

    return {
        media: media(),
        getType,
        renderImageURL,
        renderVideoURL,
        uploadMedia,
    }
}

