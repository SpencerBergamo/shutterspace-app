import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useProfile } from "@/src/context/ProfileContext";
import { Media, MediaIdentifier } from "@/src/types/Media";
import { ValidatedAsset } from "@/src/utils/mediaHelper";
import axios from "axios";
import { useAction, useMutation, useQuery } from "convex/react";
import { randomUUID } from "expo-crypto";
import { useCallback, useEffect, useState } from "react";

export type PendingMedia = {
    assetId: string;
    uri: string;
    filename: string;
    type: 'image' | 'video';
    width: number;
    height: number;
    duration?: number;
    timestamp: number;
};

interface UseMediaResult {
    media: Media[];
    pendingMedia: PendingMedia[];
    uploadMedia: (assets: ValidatedAsset[]) => Promise<void>;
    removePendingMedia: (assetId: string) => void;
    retryMediaUpload: (mediaId: Id<'media'>) => Promise<void>;
}

export const useMedia = (albumId: Id<'albums'>): UseMediaResult => {
    const { profileId } = useProfile();

    const prepareImageUpload = useAction(api.r2.prepareImageUpload);
    const prepareVideoUpload = useAction(api.cloudflare.prepareVideoUpload);
    const media = useQuery(api.media.getMediaForAlbum, { albumId }) ?? [];
    const createMedia = useMutation(api.media.createMedia).withOptimisticUpdate(
        (localStore, args) => {
            const currentMedia = localStore.getQuery(api.media.getMediaForAlbum, { albumId });

            if (currentMedia !== undefined) {
                const now = Date.now();
                const newMedia: Media = {
                    _id: randomUUID() as Id<'media'>,
                    _creationTime: now,
                    isDeleted: false,
                    createdBy: profileId,
                    ...args,
                }

                localStore.setQuery(api.media.getMediaForAlbum, { albumId }, [
                    ...currentMedia,
                    newMedia,
                ]);
            }
        }
    )

    const [pendingMedia, setPendingMedia] = useState<PendingMedia[]>([]);

    const removePendingMedia = useCallback((assetId: string) => {

    }, [albumId, pendingMedia]);

    // Clean up pending media when real media with matching assetId appears
    useEffect(() => {
        if (media.length === 0 || pendingMedia.length === 0) return;

        const mediaAssetIds = new Set(media.map(m => m.assetId));
        setPendingMedia(prev => prev.filter(p => !mediaAssetIds.has(p.assetId)));
    }, [media]);

    const retryMediaUpload = useCallback(async (mediaId: Id<'media'>) => {
        try {
            throw new Error("Not implemented");
        } catch (e) {
            console.error(e);
        }
    }, [albumId]);

    const uploadMedia = useCallback(async (assets: ValidatedAsset[]) => {
        // Add all assets as pending media immediately for optimistic UI
        const newPending: PendingMedia[] = assets.map(asset => ({
            assetId: asset.assetId,
            uri: asset.uri,
            filename: asset.filename,
            type: asset.type,
            width: asset.width,
            height: asset.height,
            duration: asset.duration ?? undefined,
            timestamp: Date.now(),
        }));
        setPendingMedia(prev => [...prev, ...newPending]);

        for (const asset of assets) {

            const isLast = asset === assets.at(-1);
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

                const buffer = await fetch(asset.uri).then(res => res.arrayBuffer());
                await axios.put(imageUploadUrl, buffer, {
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

                await axios.post(uploadUrl, form).catch(e => {
                    console.error('Failed to upload video to Cloudflare', e);
                    throw new Error('Failed to upload video');
                });
            } else {
                removePendingMedia(asset.assetId);
                throw new Error('Invalid asset type');
            }

            await createMedia({
                albumId,
                assetId: asset.assetId,
                filename: asset.filename,
                identifier,
                setThumbnail: isLast,
                status: asset.type === 'video' ? 'pending' : 'ready',
                size: asset.fileSize,
                dateTaken: asset.exif?.DateTimeOriginal,
                location: undefined,
            })
        }
    }, [albumId, prepareImageUpload, prepareVideoUpload, createMedia, removePendingMedia]);

    return {
        media,
        pendingMedia,
        uploadMedia,
        removePendingMedia,
        retryMediaUpload,
    }
}

