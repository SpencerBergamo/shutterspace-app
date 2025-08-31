import { useProfile } from "@/context/ProfileContext";
import { useSignedUrls } from "@/context/SignedUrlsContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { DbMedia } from "@/types/Media";
import { useAction, useMutation, useQuery } from "convex/react";
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect } from "react";
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
    media: DbMedia[];
    getType: (dbMedia: DbMedia) => TypeAndID;
    renderImageURL: (dbMedia: DbMedia) => Promise<string | undefined>;
    renderVideoURL: (dbMedia: DbMedia) => Promise<string | undefined>;
    uploadMedia: () => Promise<void>;
}

interface UploadURLResponse {
    result: {
        id: string;
        uploadURL: string;
    };
    success: boolean;
    errors: string[];
    messages: string[];
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

    // Signatures
    const generateImageUploadURL = useAction(api.cloudflare.generateImageUploadURL);
    const generateSignedImageURL = useAction(api.cloudflare.generateSignedImageURL);
    const generateVideoUploadURL = useAction(api.cloudflare.generateVideoUploadURL);
    const generateVideoToken = useAction(api.cloudflare.generateVideoToken);
    // const [signedUrls, setSignedUrls] = useState<Map<string, SignedEntry>>(new Map());
    // const inFlight = useRef<Set<string>>(new Set());

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
                ? `https://customer-${process.env.CLOUDFLARE_CUSTOMER_CODE}.cloudflarestream.com/${cached}/thumbnails/thumbnail.jpg`
                : cached;
        }

        const ensured = await ensureSigned(id, type);
        if (!ensured) {
            console.warn('renderImageURL returned undefined for', id);
            return "https://placehold.co/600x400";
        }

        return type === 'video'
            ? `https://customer-${process.env.CLOUDFLARE_CUSTOMER_CODE}.cloudflarestream.com/${ensured}/thumbnails/thumbnail.jpg`
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
        const assets = await selectAssets();
        if (!assets) return;

        const { images, videos, other } = splitAssets(assets);

        await uploadImages(images);
        // await uploadVideos(videos);

    }, [albumId]);

    const uploadImages = useCallback(async (images: ImagePicker.ImagePickerAsset[]) => {
        return await Promise.all(images.map(async (asset) => {
            if (asset.type !== 'image') return; // double check this

            try {
                const filename = asset.fileName || new Date().getTime() + Math.random().toString(36).substring(2, 15);
                const uploadUrlResponse: UploadURLResponse = await generateImageUploadURL({ filename: filename });

                if (!uploadUrlResponse.success) {
                    console.error(uploadUrlResponse.errors.join(", "), '\n', uploadUrlResponse.messages.join(", "));
                    return;
                }

                const { id, uploadURL } = uploadUrlResponse.result;
                const form = new FormData();
                form.append('file', {
                    uri: asset.uri,
                    name: filename,
                    type: asset.mimeType || 'image/jpeg',
                } as unknown as Blob);

                const imgResponse = await fetch(uploadURL, {
                    method: 'POST',
                    body: form,
                });

                if (!imgResponse.ok) {
                    console.error(`Failed to upload image ${imgResponse.status} - ${imgResponse.statusText}`);
                    return;
                }

                // Debugging
                // const jsonImgResponse = await imgResponse.json();
                // console.log("Image Response: ", jsonImgResponse);

                const media = await createMedia({
                    albumId,
                    uploaderId: profileId,
                    filename,
                    asset: {
                        type: 'image',
                        imageId: id,
                        width: asset.width,
                        height: asset.height,
                    },
                    size: asset.fileSize,
                });

                ensureSigned(id, 'image');
            } catch (e) {
                console.error(e);
            }
        }));
    }, [albumId, profileId]);

    const uploadVideos = useCallback(async (videos: ImagePicker.ImagePickerAsset[]) => {
        return await Promise.all(videos.map(async (asset) => {
            if (asset.type !== 'video') return;

            try {
                const filename = asset.fileName || new Date().getTime() + Math.random().toString(36).substring(2, 15);
                const uploadUrlResponse = await generateVideoUploadURL({ filename: filename });

                if (!uploadUrlResponse.success) {
                    throw new Error(`Video Upload URL Generation Failed: ${uploadUrlResponse.errors.join(", ")} ${uploadUrlResponse.messages.join(", ")}`);
                }

                const { uid, uploadURL } = uploadUrlResponse.result;
                const form = new FormData();
                form.append('file', {
                    uri: asset.uri,
                    name: filename,
                    type: asset.mimeType || 'video/mp4',
                } as unknown as Blob);

                const videoResponse = await fetch(uploadURL, {
                    method: 'POST',
                    body: form,
                });

                if (!videoResponse.ok) {
                    throw new Error(`Failed to upload video ${videoResponse.status} - ${videoResponse.statusText}`);
                }

                // Debugging
                const jsonVideoResponse = await videoResponse.json();
                console.log("Video Response: ", jsonVideoResponse);

                await createMedia({
                    albumId,
                    uploaderId: profileId,
                    filename,
                    asset: {
                        type: 'video',
                        videoUid: uid,
                        duration: asset.duration ?? 0,
                        width: asset.width,
                        height: asset.height,
                    },
                    size: asset.fileSize,
                });
            } catch (e) {
                console.error(e);
            }
        }));

    }, []);

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
        media: dbMedia ?? [],
        getType,
        renderImageURL,
        renderVideoURL,
        uploadMedia,
    }
}

