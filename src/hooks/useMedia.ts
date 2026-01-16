import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Media, MediaIdentifier } from "@/src/types/Media";
import { ValidatedAsset } from "@/src/utils/mediaHelper";
import axios from "axios";
import { useAction, useMutation, useQuery } from "convex/react";
import { useCallback, useMemo, useRef } from "react";
import { PendingUpload, useMediaStore } from "../store/useMediaStore";

interface UseMediaResult {
    media: Media[] | undefined;
    pendingMedia: PendingUpload[];
    displayMedia: DisplayMedia[];
    uploadMedia: (assets: ValidatedAsset[]) => Promise<void>;
    removePendingMedia: (assetId: string) => void;
    retryPendingMedia: (assetId: string) => Promise<void>;
    retryAllFailedUploads: () => Promise<void>;
    clearFailedUploads: () => void;
}

export type DisplayMedia = PendingUpload | Media;

export const useMedia = (albumId: Id<'albums'>): UseMediaResult => {
    const prepareImageUpload = useAction(api.r2.prepareImageUpload);
    const prepareVideoUpload = useAction(api.cloudflare.prepareVideoUpload);
    const media = useQuery(api.media.getMediaForAlbum, albumId ? { albumId } : "skip");
    const createMedia = useMutation(api.media.createMedia);

    // Subscribe to the raw pendingUploads object to avoid infinite loops
    const pendingUploads = useMediaStore(state => state.pendingUploads);
    const emptyArray = useRef<PendingUpload[]>([]).current;

    // Filter pending uploads for this album in useMemo
    const pendingMedia = useMemo(() => {
        const uploads = Object.values(pendingUploads).filter(p => p.albumId === albumId);
        return uploads.length > 0 ? uploads : emptyArray;
    }, [pendingUploads, albumId, emptyArray]);

    // get actions for this album only
    const {
        addPendingUpload,
        updatePendingUpload,
        removePendingMedia,
        clearFailedUploads,
    } = useMediaStore.getState();

    const displayMedia = useMemo(() => {
        if (media === undefined) return pendingMedia;

        return [
            ...pendingMedia,
            ...(media ?? []),
        ] as DisplayMedia[];
    }, [media, pendingMedia]);

    const uploadAsset = useCallback(async (asset: ValidatedAsset) => {
        let uploadUrl: string | undefined;
        let identifier: MediaIdentifier | undefined;

        if (asset.type === 'image') {
            const { uploadUrl: imageUploadUrl, imageId } = await prepareImageUpload({
                albumId,
                filename: asset.filename,
                contentType: asset.mimeType,
                extension: asset.extension,
            });

            uploadUrl = imageUploadUrl;
            identifier = {
                type: 'image',
                imageId,
                width: asset.width,
                height: asset.height,
            }

            const blob = await fetch(asset.uri).then(res => res.blob());
            await axios.put(imageUploadUrl, blob, {
                headers: { 'Content-Type': asset.mimeType },
            }).catch(e => {
                console.error('Failed to upload image to R2', e);
                throw new Error('Failed to upload image');
            });
        } else if (asset.type === 'video') {
            const { uploadURL, uid } = await prepareVideoUpload({ albumId, filename: asset.filename });

            uploadUrl = uploadURL;
            identifier = {
                type: 'video',
                videoUid: uid,
                duration: asset.duration ?? 0,
                width: asset.width,
                height: asset.height,
            }

            const form = new FormData();
            form.append('file', {
                uri: asset.uri,
                name: asset.filename,
                type: asset.mimeType,
            } as any);

            await axios.post(uploadUrl, form, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }).catch(e => {
                console.error('Failed to upload video to Cloudflare', e);
                throw new Error('Failed to upload video');
            });
        } else {
            throw new Error('Invalid asset type');
        }

        return identifier;
    }, [albumId, prepareImageUpload, prepareVideoUpload]);

    const uploadMedia = useCallback(
        async (assets: ValidatedAsset[]) => {
            const newPending: PendingUpload[] = assets.map((asset) => ({
                assetId: asset.assetId,
                albumId,
                uri: asset.uri,
                filename: asset.filename,
                type: asset.type,
                width: asset.width,
                height: asset.height,
                duration: asset.duration ?? undefined,
                timestamp: Date.now(),
                status: 'uploading' as const,
                retryCount: 0,
            }));

            addPendingUpload(newPending);

            for (const asset of assets) {
                try {
                    const identifier = await uploadAsset(asset);
                    await createMedia({
                        albumId,
                        assetId: asset.assetId,
                        filename: asset.filename,
                        identifier,
                        setThumbnail: false,
                        status: 'pending',
                        size: asset.fileSize,
                        dateTaken: asset.exif?.DateTimeOriginal,
                        location: undefined,
                    });

                    updatePendingUpload(asset.assetId, 'success');
                } catch (e) {
                    console.error('Failed to upload media:', e);
                    updatePendingUpload(
                        asset.assetId,
                        'error',
                    )
                }
            }
        }, [albumId, uploadAsset, createMedia, addPendingUpload, updatePendingUpload]);

    return {
        media,
        pendingMedia,
        displayMedia,
        uploadMedia,
        removePendingMedia,
        retryPendingMedia: async (id) => { },
        retryAllFailedUploads: async () => { },
        clearFailedUploads,
    }
}

