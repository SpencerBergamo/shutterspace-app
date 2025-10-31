import { useMediaCache } from "@/context/MediaCacheContext";
import { useProfile } from "@/context/ProfileContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { DbMedia, Media } from "@/types/Media";
import { validateAsset } from "@/utils/mediaFactory";
import axios from "axios";
import { useAction, useMutation, useQuery } from "convex/react";
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useMemo, useState } from "react";


type InFlightUploadStatus = 'pending' | 'ready' | 'error';

interface InFlightUpload {
    asset: ImagePicker.ImagePickerAsset;
    status: InFlightUploadStatus;
    mediaId?: Id<'media'>; // Track the created media document ID
    identifier?: string; // Track the imageId or videoUid for matching
}

interface UseMediaResult {
    media: Media[];
    selectAndUpload: () => Promise<void>;
}

export const useMedia = (albumId: Id<'albums'>): UseMediaResult => {
    const { profileId } = useProfile();
    const { cachedMedia, cacheMediaInBackground } = useMediaCache();

    const requestImageUploadURL = useAction(api.cloudflare.requestImageUploadURL);
    const requestVideoUploadURL = useAction(api.cloudflare.requestVideoUploadURL);
    const updateAlbum = useMutation(api.albums.updateAlbum);
    const dbMedia: DbMedia[] | undefined = useQuery(api.media.getMediaForAlbum, { albumId, profileId }) ?? [];
    const createMedia = useMutation(api.media.createMedia);

    const [inFlightUploads, setInFlightUploads] = useState<Record<Id<'albums'>, InFlightUpload[]>>({});

    const addInFlightUpload = useCallback((asset: ImagePicker.ImagePickerAsset, status: InFlightUploadStatus, mediaId?: Id<'media'>, identifier?: string) => {
        // setInFlightUploads(prev => [...prev, { asset, status, mediaId, identifier }]);
        setInFlightUploads(prev => ({
            ...prev,
            [albumId]: [...(prev[albumId] || []), { asset, status, mediaId, identifier }],
        }))
    }, [albumId]);

    const updateInFlightUpload = useCallback((asset: ImagePicker.ImagePickerAsset, updates: Partial<InFlightUpload>) => {
        setInFlightUploads(prev => ({
            ...prev,
            [albumId]: prev[albumId].map(upload =>
                upload.asset === asset ? { ...upload, ...updates } : upload
            ),
        }))
    }, [albumId]);

    const removeInFlightUpload = useCallback((asset: ImagePicker.ImagePickerAsset) => {
        setInFlightUploads(prev => ({
            ...prev,
            [albumId]: prev[albumId].filter(upload => upload.asset !== asset),
        }))
    }, [albumId]);

    const media: Media[] = useMemo(() => {
        if (!dbMedia) return [];

        const albumInFlightUploads = inFlightUploads[albumId] || [];

        return dbMedia.map(dbMediaItem => {
            switch (dbMediaItem.status) {
                case 'pending':
                    const matchingInFlightUpload = albumInFlightUploads.find(upload => upload.mediaId === dbMediaItem._id);

                    return {
                        ...dbMediaItem,
                        uri: matchingInFlightUpload?.asset.uri ?? undefined,
                        error: false,
                    }
                case 'error':
                    return {
                        ...dbMediaItem,
                        error: true,
                    } as Media;
                case 'ready':
                    const uri = cachedMedia.find(m => m.mediaId === dbMediaItem._id)?.uri ?? undefined;

                    if (!uri) {
                        cacheMediaInBackground(dbMediaItem, profileId);
                    }

                    return {
                        ...dbMediaItem,
                        uri,
                        error: false,
                    } as Media;

                default:
                    return {
                        ...dbMediaItem,
                    } as Media;

            }
        });

    }, [dbMedia, inFlightUploads, cachedMedia, cacheMediaInBackground, albumId, profileId]);

    const uploadImage = useCallback(async (image: ImagePicker.ImagePickerAsset, isLast: boolean) => {
        if (image.type !== 'image') return;

        try {
            const { props, error } = validateAsset(image);
            if (!props || error) return;

            const uploadUrlResponse = await requestImageUploadURL({ albumId, profileId, filename: props.filename });
            if (!uploadUrlResponse.success) return;

            const { id, uploadURL } = uploadUrlResponse.result;

            // Add to inFlightUploads with identifier for tracking
            addInFlightUpload(image, 'pending', undefined, id);

            // Create the media document in Convex
            const mediaId = await createMedia({
                albumId,
                uploaderId: profileId,
                filename: props.filename,
                identifier: {
                    type: 'image',
                    imageId: id,
                    width: image.width,
                    height: image.height,
                },
                size: props.size,
            });

            // Update inFlightUpload with the created mediaId for better matching
            updateInFlightUpload(image, { mediaId });

            const form = new FormData();
            form.append('file', {
                uri: props.uri,
                name: props.filename,
                type: props.mimeType,
            } as any);
            const response = await axios.post(uploadURL, form);
            if (!response.data || response.status !== 200) {
                updateInFlightUpload(image, { status: 'error' });
                return;
            };

            // Mark as successful
            updateInFlightUpload(image, { status: 'ready' });

            if (isLast) {
                updateAlbum({
                    albumId,
                    profileId,
                    thumbnailFileId: {
                        type: 'image',
                        fileId: id,
                    },
                });
            }

        } catch (e) {
            console.error("uploadImage error: ", e);
            updateInFlightUpload(image, { status: 'error' });
        } finally {
        }
    }, [createMedia, requestImageUploadURL, albumId, profileId, addInFlightUpload, updateInFlightUpload, removeInFlightUpload, updateAlbum]);

    const uploadVideo = useCallback(async (video: ImagePicker.ImagePickerAsset, isLast: boolean) => {
        if (video.type !== 'video') return;

        try {
            const { props, error } = validateAsset(video);
            if (!props || error) return;

            const uploadUrlResponse = await requestVideoUploadURL({ albumId, profileId, filename: props.filename });
            if (!uploadUrlResponse.success) return;

            const { uid, uploadURL } = uploadUrlResponse.result;

            // Add to inFlightUploads with identifier for tracking
            addInFlightUpload(video, 'pending', undefined, uid);

            // Create the media document in Convex
            const mediaId = await createMedia({
                albumId,
                uploaderId: profileId,
                filename: props.filename,
                identifier: {
                    type: 'video',
                    videoUid: uid,
                    duration: video.duration ?? 0,
                },
            });

            // Update inFlightUpload with the created mediaId for better matching
            updateInFlightUpload(video, { mediaId });

            const form = new FormData();
            form.append('file', {
                uri: props.uri,
                name: props.filename,
                type: props.mimeType,
            } as any);

            const response = await axios.post(uploadURL, form);
            if (!response.data || response.status !== 200) {
                updateInFlightUpload(video, { status: 'error' });
                return;
            };

            // Mark as successful (video processing will update via webhook)
            updateInFlightUpload(video, { status: 'ready' });

            if (isLast) {
                updateAlbum({
                    albumId,
                    profileId,
                    thumbnailFileId: {
                        type: 'video',
                        fileId: uid,
                    },
                });
            }
        } catch (e: any) {
            console.error("uploadVideo error: ", e);
            updateInFlightUpload(video, { status: 'error' });
        } finally {
            removeInFlightUpload(video);
        }

    }, [createMedia, requestVideoUploadURL, albumId, profileId, addInFlightUpload, updateInFlightUpload, removeInFlightUpload, updateAlbum]);

    const selectAndUpload = useCallback(async () => {
        const { assets } = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsMultipleSelection: true,
            exif: true,
            videoMaxDuration: 60,
        });

        if (!assets || assets.length === 0) return;

        const batch_size = 10;
        for (let i = 0; i < assets.length; i += batch_size) {
            const batch = assets.slice(i, i + batch_size);

            await Promise.all(batch.map(async (asset) => {
                const isLast = assets.at(-1) === asset;

                if (asset.type === 'image') {
                    await uploadImage(asset, isLast);
                } else if (asset.type === 'video') {
                    await uploadVideo(asset, isLast);
                }
            }));
        }
    }, [uploadImage, uploadVideo]);

    return {
        media,
        selectAndUpload,
    }
}

