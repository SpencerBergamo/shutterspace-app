import { useProfile } from "@/context/ProfileContext";
import { useSignedUrls } from "@/context/SignedUrlsContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { AlbumThumbnail } from "@/types/Album";
import { DbMedia, Media, ProcessAssetResponse, TypeAndID, UploadURLResponse } from "@/types/Media";
import { useAction, useMutation, useQuery } from "convex/react";
import * as ImagePicker from 'expo-image-picker';
import { useCallback } from "react";

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
    uploadMedia: () => Promise<void>;
}


// export type SignedEntry = { url: string; expiresAt: number; }


// Video Stream -> https://customer-<customer_id>.cloudflarestream.com/<signed_token>/

export const useMedia = (albumId: Id<'albums'>): UseAlbumMediaResult => {
    const { profileId } = useProfile();
    const { ensureSigned } = useSignedUrls();

    const createMedia = useMutation(api.media.createMedia).withOptimisticUpdate(
        (localStore, args) => {
            const existingMedia = localStore.getQuery(api.media.getMediaForAlbum, { albumId, profileId });
            const optimisticMedia: DbMedia = {
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

    const dbMedia: DbMedia[] | undefined = useQuery(api.media.getMediaForAlbum, { albumId, profileId });
    // const [optimisticMedia, setOptimisticMedia] = useState<OptimisticMedia[]>([]);

    // Signatures
    const requestImageUploadURL = useAction(api.cloudflare.requestImageUploadURL);
    const requestImageDeliveryURL = useAction(api.cloudflare.requestImageDeliveryURL);
    const requestVideoUploadURL = useAction(api.cloudflare.requestVideoUploadURL);
    const requestVideoPlaybackToken = useAction(api.cloudflare.requestVideoPlaybackToken);
    const updateAlbum = useMutation(api.albums.updateAlbum);

    // const media = useCallback(() => {
    //     return [
    //         ...(optimisticMedia as OptimisticMedia[] || []),
    //         ...(dbMedia as DbMedia[] || []),
    //     ] as Media[];
    // }, [dbMedia, optimisticMedia]);

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

        // const newOptimisticMedia: OptimisticMedia[] = [];
        // for (const asset of assets) {
        //     const filename = asset.fileName || new Date().getTime() + Math.random().toString(36).substring(2, 15);

        //     newOptimisticMedia.push({
        //         _id: filename,
        //         albumId,
        //         uploaderId: profileId,
        //         filename: filename,
        //         size: asset.fileSize,
        //         isDeleted: false,
        //         file: asset,
        //         type: asset.type === 'video' ? 'video' : 'image',
        //         status: 'pending',
        //     });
        // }
        // setOptimisticMedia(prev => [...prev, ...newOptimisticMedia]);

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
        media: dbMedia || [],
        uploadMedia,
    }
}

