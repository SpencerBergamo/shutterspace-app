import { useProfile } from "@/context/ProfileContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Media } from "@/types/Media";
import { validateAsset } from "@/utils/mediaFactory";
import axios from "axios";
import { useAction, useMutation, useQuery } from "convex/react";
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from "react";


interface InFlightUpload {
    mediaId: Id<'media'>;
    asset: ImagePicker.ImagePickerAsset;
}

interface UseMediaResult {
    media: Media[];
    uploadAssets: (assets: ImagePicker.ImagePickerAsset[]) => Promise<void>;
    getInFlightUploadURI: (mediaId: Id<'media'>) => string | undefined;
    removeInFlightUpload: (mediaId: Id<'media'>) => void;
}

export const useMedia = (albumId: Id<'albums'>): UseMediaResult => {
    const { profileId } = useProfile();

    const requestImageUploadURL = useAction(api.cloudflare.requestImageUploadURL);
    const requestVideoUploadURL = useAction(api.cloudflare.requestVideoUploadURL);
    const updateAlbum = useMutation(api.albums.updateAlbum);
    const media = useQuery(api.media.getMediaForAlbum, { albumId, profileId }) ?? [];
    const createMedia = useMutation(api.media.createMedia);

    const [inFlightUploads, setInFlightUploads] = useState<Record<Id<'albums'>, InFlightUpload[]>>({});

    const addInFlightUpload = useCallback((asset: ImagePicker.ImagePickerAsset, mediaId: Id<'media'>) => {
        setInFlightUploads(prev => ({
            ...prev,
            [albumId]: [...(prev[albumId] || []), { asset, mediaId }],
        }))
    }, [albumId]);

    const removeInFlightUpload = useCallback((mediaId: Id<'media'>) => {
        setInFlightUploads(prev => ({
            ...prev,
            [albumId]: prev[albumId].filter(upload => upload.mediaId !== mediaId),
        }))
    }, [albumId]);

    const getInFlightUploadURI = useCallback((mediaId: Id<'media'>) => {
        return inFlightUploads[albumId].find(upload => upload.mediaId === mediaId)?.asset.uri;
    }, [albumId, inFlightUploads]);

    const uploadImage = useCallback(async (image: ImagePicker.ImagePickerAsset, isLast: boolean) => {
        if (image.type !== 'image') return;

        try {
            const { props, error } = validateAsset(image);
            if (!props || error) return;

            const uploadUrlResponse = await requestImageUploadURL({ albumId, profileId, filename: props.filename });
            if (!uploadUrlResponse.success) return;

            const { id, uploadURL } = uploadUrlResponse.result;

            // Add to inFlightUploads with identifier for tracking
            addInFlightUpload(image, id);

            // Create the media document in Convex
            await createMedia({
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

            const form = new FormData();
            form.append('file', {
                uri: props.uri,
                name: props.filename,
                type: props.mimeType,
            } as any);

            await axios.post(uploadURL, form);

            if (isLast) {
                updateAlbum({
                    albumId,
                    profileId,
                    thumbnail: id,
                });
            }

        } catch (e) {
            console.error("Failed to upload an image - ", e);
        }
    }, [createMedia, requestImageUploadURL, albumId, profileId, addInFlightUpload, removeInFlightUpload, updateAlbum]);

    const uploadVideo = useCallback(async (video: ImagePicker.ImagePickerAsset, isLast: boolean) => {
        if (video.type !== 'video') return;

        try {
            const { props, error } = validateAsset(video);
            if (!props || error) return;

            const uploadUrlResponse = await requestVideoUploadURL({ albumId, profileId, filename: props.filename });
            if (!uploadUrlResponse.success) return;

            const { uid, uploadURL } = uploadUrlResponse.result;

            // Add to inFlightUploads with identifier for tracking
            addInFlightUpload(video, uid);

            // Create the media document in Convex
            await createMedia({
                albumId,
                uploaderId: profileId,
                filename: props.filename,
                identifier: {
                    type: 'video',
                    videoUid: uid,
                    duration: video.duration ?? 0,
                },
            });

            const form = new FormData();
            form.append('file', {
                uri: props.uri,
                name: props.filename,
                type: props.mimeType,
            } as any);

            await axios.post(uploadURL, form);

            if (isLast) {
                updateAlbum({
                    albumId,
                    profileId,
                    thumbnail: uid,
                });
            }
        } catch (e: any) {
            console.error("Failed to upload a video - ", e);
        }

    }, [createMedia, requestVideoUploadURL, albumId, profileId, addInFlightUpload, updateAlbum]);

    const uploadAssets = useCallback(async (assets: ImagePicker.ImagePickerAsset[]) => {

        for (const asset of assets) {
            const isLast = assets.at(-1) === asset;

            if (asset.type === 'image') {
                uploadImage(asset, isLast);
            } else if (asset.type === 'video') {
                uploadVideo(asset, isLast);
            }
        }
    }, [uploadImage, uploadVideo]);


    return {
        media,
        uploadAssets,
        getInFlightUploadURI,
        removeInFlightUpload,
    }
}

