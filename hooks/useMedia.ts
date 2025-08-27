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
import { useCallback, useEffect, useMemo, useState } from "react";
import { useImagePicker } from "./useImagePicker";


type UseAlbumMediaResult = {
    media: DbMedia[];
    signedUrls: Record<string, string>;
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

export const useMedia = (albumId: Id<'albums'>): UseAlbumMediaResult => {
    const { profileId } = useProfile();

    const selectAssets = useImagePicker({ multiple: true, maxVideoDuration: 60 });
    const generateImageUploadURL = useAction(api.cloudflare.generateImageUploadURL);
    const generateSignedURL = useAction(api.cloudflare.generateSignedURL);
    const createMedia = useMutation(api.media.createMedia);
    const dbMedia: DbMedia[] | undefined = useQuery(api.media.getMediaForAlbum, { albumId, profileId });

    const [galleryPermission, setGalleryPermission] = useState<ImagePicker.PermissionStatus | null>(null);
    const [signedUrls, setSignedUrls] = useState<Record<string, string>>({}); // imageId -> signedURL

    useEffect(() => {
        (async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            setGalleryPermission(status);
        })();
    }, []);

    useMemo(() => {
        if (dbMedia && dbMedia.length > 0) {
            presignUrls(dbMedia.map(m => m.imageId));
        }
    }, []);

    /* 
        Public Functions
     */
    const uploadMedia = useCallback(async () => {
        const assets = await selectAssets();
        if (!assets) return;

        const { images, videos, other } = splitAssets(assets);

        await uploadImages(images);
        // await uploadVideos(videos);

    }, [albumId]);

    /* 
        Private Functions 
    */
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

                await createMedia({
                    albumId,
                    uploaderId: profileId,
                    fileType: 'image',
                    filename,
                    uploadedAt: Date.now(),
                    imageId: id,
                    size: asset.fileSize,
                    width: asset.width,
                    height: asset.height,
                });
            } catch (e) {
                console.error(e);
            }
        }));
    }, [albumId, profileId]);

    const uploadVideos = useCallback(async (videos: ImagePicker.ImagePickerAsset[]) => {

    }, []);

    const presignUrls = useCallback(async (imageIds: string[]) => {
        const signedUrls = await Promise.all(imageIds.map(async (image) => {
            const signedUrl = await generateSignedURL({ identifier: image });
            return [image, signedUrl];
        }));

        const signedUrlsMap = Object.fromEntries(signedUrls);
        setSignedUrls(prev => ({ ...prev, ...signedUrlsMap }));
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
        uploadMedia,
    }
}