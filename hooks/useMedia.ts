import { useProfile } from "@/context/ProfileContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Media, MediaIdentifier } from "@/types/Media";
import { ValidatedAsset } from "@/utils/mediaHelper";
import axios from "axios";
import { useAction, useMutation, useQuery } from "convex/react";
import { randomUUID } from "expo-crypto";
import { useCallback, useState } from "react";

interface UseMediaResult {
    media: Media[];
    uploadMedia: (assets: ValidatedAsset[]) => Promise<void>;
    addInFlightUpload: (assetId: string, uri: string) => void;
    removeInFlightUpload: (assetId: string) => void;
    inFlightUploads: Record<string, string>;
    retryMediaUpload: (mediaId: Id<'media'>) => Promise<void>;
}

export const useMedia = (albumId: Id<'albums'>): UseMediaResult => {
    const { profileId } = useProfile();

    const prepareImageUpload = useAction(api.r2.prepareImageUpload);
    const prepareVideoUpload = useAction(api.cloudflare.prepareVideoUpload);
    const media = useQuery(api.media.getMediaForAlbum, { albumId, profileId }) ?? [];
    const createMedia = useMutation(api.media.createMedia).withOptimisticUpdate(
        (localStore, args) => {
            const currentMedia = localStore.getQuery(api.media.getMediaForAlbum, { albumId, profileId });

            if (currentMedia !== undefined) {
                const now = Date.now();
                const newMedia: Media = {
                    _id: randomUUID() as Id<'media'>,
                    _creationTime: now,
                    isDeleted: false,
                    createdBy: profileId,
                    ...args,
                }

                localStore.setQuery(api.media.getMediaForAlbum, { albumId, profileId }, [
                    ...currentMedia,
                    newMedia,
                ]);
            }
        }
    )

    // InFlightUploads: { assetId: uri }
    const [inFlightUploads, setInFlightUploads] = useState<Record<string, string>>({});

    function addInFlightUpload(assetId: string, uri: string) {
        setInFlightUploads(prev => ({ ...prev, [assetId]: uri }));
    }

    function removeInFlightUpload(assetId: string) {
        setInFlightUploads(prev => {
            const { [assetId]: _, ...rest } = prev;
            return { ...rest };
        });
    }

    const retryMediaUpload = useCallback(async (mediaId: Id<'media'>) => {
        try {
            throw new Error("Not implemented");
        } catch (e) {
            console.error(e);
        }
    }, [albumId]);

    const uploadMedia = useCallback(async (assets: ValidatedAsset[]) => {
        for (const asset of assets) {

            addInFlightUpload(asset.assetId, asset.uri);

            const isLast = asset === assets.at(-1);
            let uploadUrl: string | undefined;
            let identifier: MediaIdentifier | undefined;


            if (asset.type === 'image') {
                const { uploadUrl: imageUploadUrl, imageId } = await prepareImageUpload({
                    albumId,
                    filename: asset.filename,
                    contentType: asset.mimeType,
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
                removeInFlightUpload(asset.assetId);
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
    }, [albumId, prepareImageUpload, prepareVideoUpload, removeInFlightUpload, createMedia, addInFlightUpload]);

    return {
        media,
        uploadMedia,
        addInFlightUpload,
        removeInFlightUpload,
        inFlightUploads,
        retryMediaUpload,
    }
}

