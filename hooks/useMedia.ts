import { useProfile } from "@/context/ProfileContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Media } from "@/types/Media";
import { ValidatedAsset } from "@/utils/mediaHelper";
import axios from "axios";
import { useAction, useQuery } from "convex/react";
import { useCallback, useState } from "react";

interface UseMediaResult {
    media: Media[];
    uploadMedia: (assets: ValidatedAsset[]) => Promise<void>;
    addInFlightUpload: (assetId: string, uri: string) => void;
    removeInFlightUpload: (uri: string) => void;
    inFlightUploads: Record<string, string>;
    retryMediaUpload: (mediaId: Id<'media'>) => Promise<void>;
}

export const useMedia = (albumId: Id<'albums'>): UseMediaResult => {
    const { profileId } = useProfile();

    const prepareUpload = useAction(api.media.prepareUpload);
    const media = useQuery(api.media.getMediaForAlbum, { albumId, profileId }) ?? [];

    const [inFlightUploads, setInFlightUploads] = useState<Record<string, string>>({});

    const addInFlightUpload = useCallback((assetId: string, uri: string) => {
        setInFlightUploads(prev => ({ ...prev, [assetId]: uri }));
    }, [albumId]);

    const updateInFlightUploadStatus = useCallback((assetId: string, status: 'pending' | 'ready' | 'error') => {
        setInFlightUploads(prev => ({ ...prev, [assetId]: status }));
    }, [albumId]);

    const removeInFlightUpload = useCallback((assetId: string) => {
        setInFlightUploads(prev => {
            const { [assetId]: _, ...rest } = prev;
            return { ...rest };
        });
    }, [albumId]);

    const retryMediaUpload = useCallback(async (mediaId: Id<'media'>) => {
        try {
            throw new Error("Not implemented");
        } catch (e) {
            console.error(e);
        }
    }, [albumId]);

    const uploadMedia = useCallback(async (assets: ValidatedAsset[]) => {
        for (const asset of assets) {
            const isLast = asset === assets.at(-1);

            const uploadUrl = await prepareUpload({
                albumId,
                assetId: asset.assetId,
                filename: asset.filename,
                type: asset.type,
                width: asset.width,
                height: asset.height,
                duration: asset.duration ?? undefined,
                size: asset.fileSize,
                dateTaken: asset.exif?.DateTimeOriginal,
                location: undefined,
                isLast,
            });

            const form = new FormData();
            form.append('file', {
                uri: asset.uri,
                name: asset.filename,
                type: asset.mimeType,
            } as any);

            await axios.post(uploadUrl, form).catch(e => {
                updateInFlightUploadStatus(asset.assetId, 'error');
                throw e;
            });
        }
    }, [albumId, prepareUpload, updateInFlightUploadStatus]);

    return {
        media,
        uploadMedia,
        addInFlightUpload,
        removeInFlightUpload,
        inFlightUploads,
        retryMediaUpload,
    }
}

