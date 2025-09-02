import { useProfile } from "@/context/ProfileContext";
import { useSignedUrls } from "@/context/SignedUrlsContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { AlbumThumbnail } from "@/types/Album";
import { Media, ProcessAssetResponse, UploadURLResponse } from "@/types/Media";
import { useAction, useMutation, useQuery } from "convex/react";
import * as ImagePicker from 'expo-image-picker';
import { useCallback } from "react";

/**
 * 
 */

interface UseAlbumMediaResult {
    media: Media[];
    uploadMedia: () => Promise<void>;
}

export const useMedia = (albumId: Id<'albums'>): UseAlbumMediaResult => {
    const { profileId } = useProfile();
    const { ensureSigned } = useSignedUrls();

    const requestImageUploadURL = useAction(api.cloudflare.requestImageUploadURL);
    const requestVideoUploadURL = useAction(api.cloudflare.requestVideoUploadURL);
    const updateAlbum = useMutation(api.albums.updateAlbum);
    const dbMedia: Media[] | undefined = useQuery(api.media.getMediaForAlbum, { albumId, profileId });
    const createMedia = useMutation(api.media.createMedia).withOptimisticUpdate(
        (localStore, args) => {
            const existingMedia = localStore.getQuery(api.media.getMediaForAlbum, { albumId, profileId });
            const optimisticMedia: Media = {
                _id: args.filename as Id<'media'>,
                _creationTime: Date.now(),
                albumId,
                uploaderId: profileId,
                filename: args.filename,
                asset: args.asset,
                size: args.size,
                dateTaken: args.dateTaken,
                location: args.location,
                isDeleted: false,
            };

            localStore.setQuery(api.media.getMediaForAlbum, { albumId, profileId }, [optimisticMedia, ...existingMedia || []]);
        },
    );

    /* Media Upload */
    const uploadMedia = useCallback(async () => {
        const { assets } = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsMultipleSelection: true,
            exif: true,
            videoMaxDuration: 60,
        });

        if (!assets || assets.length === 0) return;

        const batch_size = 10;
        let newAlbumThumbnail: AlbumThumbnail | undefined;
        for (let i = 0; i < assets.length; i += batch_size) {
            const batch = assets.slice(i, i + batch_size);
            await Promise.all(batch.map(async (asset) => {
                const isLast = assets.at(-1) === asset;

                if (asset.type === 'image') {
                    const { status, result, error } = await processImage(asset);
                    if (status === 'success' && result) {
                        await createMedia({
                            albumId,
                            uploaderId: profileId,
                            filename: result.filename,
                            asset: {
                                type: 'image',
                                imageId: result.assetId,
                                width: result.width,
                                height: result.height,
                            },
                            size: result.size,
                        });

                        if (isLast) {
                            newAlbumThumbnail = {
                                type: 'image',
                                fileId: result.assetId,
                            }
                        }
                    }
                } else if (asset.type === 'video') {
                    console.log("Processing Video: ", asset.fileName);
                    const response = await processVideo(asset);
                    if (response.status === 'success' && response.result) {
                        await createMedia({
                            albumId,
                            uploaderId: profileId,
                            filename: response.result.filename,
                            asset: {
                                type: 'video',
                                videoUid: response.result.assetId,
                                duration: response.result.duration ?? 0,
                            },
                            size: response.result.size,
                        });

                        if (isLast) {
                            newAlbumThumbnail = {
                                type: 'video',
                                fileId: response.result.assetId,
                            }
                        }
                    } else {
                        console.error("processVideo failed", response.error);
                    }
                } else {
                    console.error("Type is invalid", asset.type);
                }
            }));
        }

        await updateAlbum({
            albumId,
            profileId,
            thumbnailFileId: newAlbumThumbnail,
        });
    }, [albumId, profileId, createMedia, updateAlbum]);

    const processImage = useCallback(async (image: ImagePicker.ImagePickerAsset): Promise<ProcessAssetResponse> => {
        if (image.type !== 'image') return { status: 'error', error: 'Invalid image type', result: null };

        try {
            const filename = image.fileName || new Date().getTime() + Math.random().toString(36).substring(2, 15);
            const uploadUrlResponse: UploadURLResponse = await requestImageUploadURL({ albumId, profileId, filename: filename });

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
                headers: {},
                body: form,
            });

            if (!imgResponse.ok) {
                console.error(`Failed to upload image ${imgResponse.status} - ${imgResponse.statusText}`);
                return { status: 'error', error: 'Failed to upload image', result: null };
            }

            ensureSigned({ type: 'image', id, albumId, profileId });
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
    }, [albumId, requestImageUploadURL, ensureSigned, profileId]);

    const processVideo = useCallback(async (video: ImagePicker.ImagePickerAsset): Promise<ProcessAssetResponse> => {
        if (video.type !== 'video') {
            console.error("Invalid video type", video.type);
            return { status: 'error', error: 'Invalid video type', result: null };
        };

        try {
            console.log("Processing Video: ", video.fileName);
            const filename = video.fileName || new Date().getTime() + Math.random().toString(36).substring(2, 15);
            const uploadUrlResponse = await requestVideoUploadURL({ albumId, profileId, filename: filename });

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
                headers: {
                    // Don't set Content-Type - let fetch set it automatically with boundary
                },
                body: form,
            });

            if (!videoResponse.ok) {
                console.error(`Failed to upload video ${videoResponse.status} - ${videoResponse.statusText}`);
                return { status: 'error', error: 'Failed to upload video', result: null };
            }

            ensureSigned({ type: 'video', id: uid, albumId, profileId });
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
    }, [albumId, requestVideoUploadURL, ensureSigned, profileId]);

    return {
        media: dbMedia || [],
        uploadMedia,
    }
}

