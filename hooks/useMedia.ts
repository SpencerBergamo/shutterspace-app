import { useProfile } from "@/context/ProfileContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Media } from "@/types/Media";
import { validateAssets } from "@/utils/validateAssets";
import { useAction, useMutation, useQuery } from "convex/react";
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from "react";

interface UseMediaResult {
    media: Media[];
    selectAndUploadAssets: () => Promise<void>;
    removeInFlightUpload: (uri: string) => void;
    inFlightUploads: Record<string, string>;
}

export const useMedia = (albumId: Id<'albums'>): UseMediaResult => {
    const { profileId } = useProfile();

    const uploadMedia = useAction(api.media.uploadMedia);
    const updateAlbum = useMutation(api.albums.updateAlbum);
    const media = useQuery(api.media.getMediaForAlbum, { albumId, profileId }) ?? [];

    const [inFlightUploads, setInFlightUploads] = useState<Record<string, string>>({});

    const addInFlightUpload = useCallback(({ assetId, uri }: { assetId: string, uri: string }) => {
        setInFlightUploads(prev => ({ ...prev, [assetId]: uri }));
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

        if (response.assets && response.assets.length > 0) {
            const { invalid, valid } = validateAssets(response.assets);

            if (valid.length > 0) {
                for (const asset of valid) {
                    addInFlightUpload({ assetId: asset.assetId, uri: asset.uri });
                }

                await uploadMedia({
                    albumId,
                    profileId,
                    files: valid.map(asset => ({
                        uri: asset.uri,
                        assetId: asset.assetId,
                        filename: asset.filename,
                        type: asset.type,
                        mimeType: asset.mimeType,
                        duration: asset.duration ?? undefined,
                        width: asset.width,
                        height: asset.height,
                        size: asset.fileSize,
                        dateTaken: asset.exif?.DateTimeOriginal,
                    }))
                })
            }
        }
    }, [albumId, profileId]);


    return {
        media,
        selectAndUploadAssets,
        inFlightUploads,
        removeInFlightUpload,
    }
}

