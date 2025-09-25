import { useProfile } from "@/context/ProfileContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { DbMedia, Media } from "@/types/Media";
import { validateAsset } from "@/utils/mediaFactory";
import axios from "axios";
import { useAction, useMutation, useQuery } from "convex/react";
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useMemo, useState } from "react";


type InFlightUploadStatus = 'pending' | 'uploading' | 'success' | 'error';

interface InFlightUpload {
    asset: ImagePicker.ImagePickerAsset;
    status: InFlightUploadStatus;
    mediaId?: Id<'media'>; // Track the created media document ID
    identifier?: string; // Track the imageId or videoUid for matching
}

interface UseAlbumMediaResult {
    media: Media[];
    selectAndUpload: () => Promise<void>;
    inFlightUploads: InFlightUpload[];
}

export const useMedia = (albumId: Id<'albums'>): UseAlbumMediaResult => {
    const { profileId } = useProfile();

    const requestImageUploadURL = useAction(api.cloudflare.requestImageUploadURL);
    const requestVideoUploadURL = useAction(api.cloudflare.requestVideoUploadURL);
    const updateAlbum = useMutation(api.albums.updateAlbum);
    const dbMedia: DbMedia[] | undefined = useQuery(api.media.getMediaForAlbum, { albumId, profileId }) ?? [];
    const createMedia = useMutation(api.media.createMedia);

    const [inFlightUploads, setInFlightUploads] = useState<InFlightUpload[]>([]);

    const addInFlightUpload = useCallback((asset: ImagePicker.ImagePickerAsset, status: InFlightUploadStatus, mediaId?: Id<'media'>, identifier?: string) => {
        setInFlightUploads(prev => [...prev, { asset, status, mediaId, identifier }]);
    }, []);

    const updateInFlightUpload = useCallback((asset: ImagePicker.ImagePickerAsset, updates: Partial<InFlightUpload>) => {
        setInFlightUploads(prev => prev.map(upload =>
            upload.asset === asset ? { ...upload, ...updates } : upload
        ));
    }, []);

    const removeInFlightUpload = useCallback((asset: ImagePicker.ImagePickerAsset) => {
        setInFlightUploads(prev => prev.filter(upload => upload.asset !== asset));
    }, []);

    const media: Media[] = useMemo(() => {
        // For the current user, merge dbMedia with inFlightUploads to show local URIs during upload
        return dbMedia.map(dbMediaItem => {
            // Find matching inFlightUpload by mediaId or identifier
            const matchingInFlightUpload = inFlightUploads.find(upload => {
                // First try to match by mediaId (most reliable)
                if (upload.mediaId === dbMediaItem._id) {
                    return true;
                }

                // Fallback: match by identifier (imageId or videoUid)
                if (upload.identifier) {
                    if (dbMediaItem.identifier.type === 'image') {
                        return upload.identifier === dbMediaItem.identifier.imageId;
                    } else if (dbMediaItem.identifier.type === 'video') {
                        return upload.identifier === dbMediaItem.identifier.videoUid;
                    }
                }

                return false;
            });

            // Only show local URI for current user's uploads that are still in progress
            if (matchingInFlightUpload &&
                dbMediaItem.uploaderId === profileId &&
                (dbMediaItem.uploadStatus === 'uploading' || dbMediaItem.uploadStatus === 'pending')) {

                return {
                    ...dbMediaItem,
                    localUri: matchingInFlightUpload.asset.uri, // Use local device URI for immediate display
                } as Media;
            }

            // For completed uploads, other users' uploads, or when no matching inFlightUpload
            return {
                ...dbMediaItem,
                localUri: '', // Empty - UI will request signed URLs from Cloudflare
            } as Media;
        });
    }, [dbMedia, inFlightUploads, profileId]);

    const uploadImage = useCallback(async (image: ImagePicker.ImagePickerAsset, isLast: boolean) => {
        if (image.type !== 'image') return;

        try {
            const { props, error } = validateAsset(image);
            if (!props || error) return;

            const uploadUrlResponse = await requestImageUploadURL({ albumId, profileId, filename: props.filename });
            if (!uploadUrlResponse.success) return;

            const { id, uploadURL } = uploadUrlResponse.result;

            // Add to inFlightUploads with identifier for tracking
            addInFlightUpload(image, 'uploading', undefined, id);

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
            updateInFlightUpload(image, { status: 'success' });

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
            addInFlightUpload(video, 'uploading', undefined, uid);

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
            updateInFlightUpload(video, { status: 'success' });

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

    const requestMediaThumbnail = useCallback(async (media: Id<'media'>) => {
        // return a cache if available

        // request thumbnail from cloudflare and save to cache
    }, []);

    return {
        media,
        selectAndUpload,
        inFlightUploads,
    }
}

