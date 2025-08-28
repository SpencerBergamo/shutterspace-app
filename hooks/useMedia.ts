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
import { useCallback, useEffect, useRef, useState } from "react";
import { useImagePicker } from "./useImagePicker";


interface UseAlbumMediaResult {
    media: DbMedia[];
    getSignedURL: (dbMedia: DbMedia) => Promise<string | undefined>;
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

export const useMedia = (albumId: Id<'albums'>): UseAlbumMediaResult => {
    const { profileId } = useProfile();

    const selectAssets = useImagePicker({ multiple: true, maxVideoDuration: 60 });
    const generateImageUploadURL = useAction(api.cloudflare.generateImageUploadURL);
    const generateVideoUploadURL = useAction(api.cloudflare.generateVideoUploadURL);
    const generateSignedURL = useAction(api.cloudflare.generateSignedURL);
    const createMedia = useMutation(api.media.createMedia);
    const dbMedia: DbMedia[] | undefined = useQuery(api.media.getMediaForAlbum, { albumId, profileId });

    const signedRef = useRef<Map<string, SignedEntry>>(new Map());
    const inFlight = useRef<Set<string>>(new Set());
    const [, forceTick] = useState(0);
    const bump = () => forceTick(tick => (tick + 1) % 1000000);

    const parseExpiresAt = (url: string) => {
        try {
            const u = new URL(url);
            const exp = u.searchParams.get('exp');
            if (!exp) return 0;
            const ts = Number.isNaN(+exp) ? new Date(exp).getTime() : parseInt(exp, 10);
            return Number.isFinite(ts) ? ts : 0;
        } catch { return 0; }
    }

    const getTypeAndId = (dbMedia: DbMedia) => {
        const type = dbMedia.asset.type;
        const id = type === 'image' ? dbMedia.asset.imageId : dbMedia.asset.videoUid;
        return { type, id };
    }

    const isExpired = (entry?: SignedEntry) => {
        if (!entry) return true;
        return entry.expiresAt < Date.now();
    };

    const ensureSigned = useCallback(async (id: string, type: 'image' | 'video') => {
        const existing = signedRef.current.get(id);
        if (existing && !isExpired(existing)) return existing.url;

        if (inFlight.current.has(id)) return;
        inFlight.current.add(id);

        try {
            if (type === 'image') {
                const url = await generateSignedURL({ identifier: id });
                const expiresAt = parseExpiresAt(url);
                signedRef.current.set(id, { url, expiresAt });
                bump();
            } else if (type === 'video') {
                throw new Error("Not implemented");
            }
        } catch (e) {
            // Swallow: UI can retry on demand
        } finally {
            inFlight.current.delete(id);
        }
    }, [generateSignedURL]);

    const prefetchSigned = useCallback(async (media: DbMedia[]) => {
        const todo = media.filter(m => {
            const { id } = getTypeAndId(m);
            const e = signedRef.current.get(id);
            return !e || isExpired(e);
        });

        if (todo.length === 0) return;
        await Promise.all(todo.map(m => {
            const { type, id } = getTypeAndId(m);
            return ensureSigned(id, type);
        }));
    }, [ensureSigned]);

    useEffect(() => {
        if (!dbMedia || dbMedia.length === 0) return;
        prefetchSigned(dbMedia);
    }, [dbMedia, prefetchSigned]);

    const getSignedURL = useCallback(async (dbMedia: DbMedia) => {
        const { type, id } = getTypeAndId(dbMedia);

        const e = signedRef.current.get(id);
        if (!e || isExpired(e)) {
            ensureSigned(id, type);
            return undefined;
        }
        return e.url;
    }, [ensureSigned]);

    // Media Upload Processes
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
        getSignedURL,
        uploadMedia,
    }
}