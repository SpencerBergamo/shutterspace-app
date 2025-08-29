/**
 * @title useMedia
 * @description A hook for managing media upload and display for an album
 * 
 * @function uploadMedia 
 * @description References the selectAssets hook, splits the assets into images and videos, then processes the upload 
 * of each group sequentially.
 */

import { useProfile } from "@/context/ProfileContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { DbMedia } from "@/types/Media";
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
 */


interface UseAlbumMediaResult {
    media: DbMedia[];
    signedUrls: Map<string, SignedEntry>;
    getType: (dbMedia: DbMedia) => TypeAndID;
    renderSignature: (dbMedia: DbMedia) => Promise<string | undefined>;
    uploadMedia: () => Promise<void>;
}

interface SplitAssets {
    images: ImagePicker.ImagePickerAsset[];
    videos: ImagePicker.ImagePickerAsset[];
    other: ImagePicker.ImagePickerAsset[];
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

type SignedEntry = { url: string; expiresAt: number; }
type TypeAndID = { type: 'image' | 'video'; id: string; }

// Video Stream -> https://customer-<customer_id>.cloudflarestream.com/<signed_token>/

export const useMedia = (albumId: Id<'albums'>): UseAlbumMediaResult => {
    const { profileId } = useProfile();

    const selectAssets = useImagePicker({ multiple: true, maxVideoDuration: 60 });
    const createMedia = useMutation(api.media.createMedia);
    const dbMedia: DbMedia[] | undefined = useQuery(api.media.getMediaForAlbum, { albumId, profileId });

    // Signatures
    const generateImageUploadURL = useAction(api.cloudflare.generateImageUploadURL);
    const generateSignedImageURL = useAction(api.cloudflare.generateSignedImageURL);
    const generateVideoUploadURL = useAction(api.cloudflare.generateVideoUploadURL);
    const generateVideoToken = useAction(api.cloudflare.generateVideoToken);
    const [signedUrls, setSignedUrls] = useState<Map<string, SignedEntry>>(new Map());

    const parseExpiry = (url: string) => {
        try {
            const u = new URL(url);
            const exp = u.searchParams.get('exp');
            if (!exp) return 0;
            const seconds = Number.isNaN(+exp) ? new Date(exp).getTime() : parseInt(exp, 10);
            return seconds * 1000;
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

    const isExpired = (entry?: SignedEntry) => {
        if (!entry) return null;
        return entry.expiresAt < Date.now();
    }

    const ensureSigned = useCallback(async (id: string, type: 'image' | 'video') => {
        const existing = signedUrls.get(id);
        if (existing && !isExpired(existing)) return existing.url;

        // in flight?
        // if (inFlight.current.has(id)) return;
        // inFlight.current.add(id);

        try {
            if (type === 'image') {
                const url = await generateSignedImageURL({ identifier: id });
                const expiresAt = parseExpiry(url);
                setSignedUrls(prev => {
                    const newMap = new Map(prev);
                    newMap.set(id, { url, expiresAt });
                    return newMap;
                });
            } else if (type === 'video') {
                // 

            } else {
                throw new Error("Invalid type: " + type);
            }


        } catch (e) {
            console.error(e);
        } finally {
            // inFlight.current.delete(id);
        }
    }, [generateSignedImageURL, generateVideoToken, signedUrls]);

    const prefetch = useCallback(async (media: DbMedia[]) => {
        const withTypeAndID: TypeAndID[] = media.map(m => {
            const { type, id } = getType(m);
            return { type, id };
        });

        const todo = withTypeAndID.filter(m => {
            const e = signedUrls.get(m.id);
            return !e || isExpired(e);
        });

        if (todo.length === 0) return;
        await Promise.all(todo.map(m => {
            return ensureSigned(m.id, m.type);
        }))

    }, [ensureSigned]);

    const renderSignature = useCallback(async (dbMedia: DbMedia) => {
        const { type, id } = getType(dbMedia);
        const e = signedUrls.get(id);

        if (!e || isExpired(e)) {
            return await ensureSigned(id, type);
        }

        return e.url;
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

    function splitAssets(assets: ImagePicker.ImagePickerAsset[]): SplitAssets {
        const images = assets.filter(asset => asset.type === 'image');
        const videos = assets.filter(asset => asset.type === 'video');
        const other = assets.filter(asset => asset.type !== 'image' && asset.type !== 'video');

        return { images, videos, other };
    }

    return {
        media: dbMedia ?? [],
        signedUrls,
        getType,
        renderSignature,
        uploadMedia,
    }
}

