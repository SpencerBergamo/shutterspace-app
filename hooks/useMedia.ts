import { useProfile } from "@/context/ProfileContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Media } from "@/types/Media";
import { validateAssets } from "@/utils/mediaHelper";
import axios from "axios";
import { useAction, useQuery } from "convex/react";
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from "react";

interface UseMediaResult {
    media: Media[];
    selectAndUploadAssets: () => Promise<void>;
    removeInFlightUpload: (uri: string) => void;
    preparingUploads: boolean;
    inFlightUploads: Record<string, string>;
    uploadErrors: Record<string, string>;
}

export const useMedia = (albumId: Id<'albums'>): UseMediaResult => {
    const { profileId } = useProfile();

    const prepareUpload = useAction(api.media.prepareUpload);
    const media = useQuery(api.media.getMediaForAlbum, { albumId, profileId }) ?? [];

    const [preparingUploads, setPreparingUploads] = useState<boolean>(false);
    const [inFlightUploads, setInFlightUploads] = useState<Record<string, string>>({});
    const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});

    const addInFlightUpload = useCallback(({ assetId, uri }: { assetId: string, uri: string }) => {
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

    const selectAndUploadAssets = useCallback(async () => {
        const response = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsMultipleSelection: true,
            exif: true,
            videoMaxDuration: 60,
        });

        if (response.canceled || !response.assets || response.assets.length === 0) return;
        setPreparingUploads(true);

        try {
            const { invalid, valid } = validateAssets(response.assets);

            console.log(`${valid.length} valid assets`);
            if (valid.length > 0) {
                for (const asset of valid) {
                    const isLast = asset === valid.at(-1);

                    console.log(`${valid.indexOf(asset)} added to inFlightUploads`);
                    addInFlightUpload({ assetId: asset.assetId, uri: asset.uri });

                    const uploadUrl: string = await prepareUpload({
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

                    console.log(`${valid.indexOf(asset)} uploading to Cloudflare`);
                    const form = new FormData();
                    form.append('file', {
                        uri: asset.uri,
                        name: asset.filename,
                        type: asset.mimeType,
                    } as any);
                    const response = await axios.post(uploadUrl, form);
                    console.log(`${valid.indexOf(asset)} Cloudflare response: `, response.data);
                    if (!response.data || response.status !== 200) {
                        updateInFlightUploadStatus(asset.assetId, 'error');
                        console.error("useMedia: uploadAssets failed", response.data);
                        continue;
                    }
                }
            }

            console.log(`${invalid.length} invalid assets`);
            if (invalid.length > 0) {
                for (const asset of invalid) {
                    updateInFlightUploadStatus(asset.assetId, 'error');
                    setUploadErrors(prev => ({ ...prev, [asset.assetId]: 'Invalid asset' }));
                    console.error("useMedia: uploadAssets failed", 'Invalid asset');
                }
            }
        } catch (e) {
            console.error("useMedia: uploadAssets failed", e);
        } finally {
            setPreparingUploads(false);
        }
    }, [albumId]);

    return {
        media,
        selectAndUploadAssets,
        removeInFlightUpload,
        preparingUploads,
        inFlightUploads,
        uploadErrors,
    }
}

