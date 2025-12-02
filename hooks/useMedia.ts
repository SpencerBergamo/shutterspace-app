import { useProfile } from "@/context/ProfileContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Media } from "@/types/Media";
import { validateAssets } from "@/utils/mediaHelper";
import axios from "axios";
import { useAction, useQuery } from "convex/react";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
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

                    addInFlightUpload({ assetId: asset.assetId, uri: asset.uri });

                    const uploadUrl: string | null = await prepareUpload({
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

                    if (!uploadUrl) {
                        updateInFlightUploadStatus(asset.assetId, 'error');
                        setUploadErrors(prev => ({ ...prev, [asset.assetId]: 'Failed to prepare upload' }));
                        console.error("useMedia: uploadAssets failed", 'Failed to prepare upload');
                        continue;
                    }

                    let response;
                    
                    // On Android, use FileSystem.uploadAsync for proper file handling
                    if (Platform.OS === 'android') {
                        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
                        if (!fileInfo.exists) {
                            updateInFlightUploadStatus(asset.assetId, 'error');
                            setUploadErrors(prev => ({ ...prev, [asset.assetId]: 'File not found' }));
                            console.error("useMedia: File not found", asset.uri);
                            continue;
                        }
                        
                        // Use FileSystem.uploadAsync for Android
                        const uploadResult = await FileSystem.uploadAsync(uploadUrl, asset.uri, {
                            httpMethod: 'POST',
                            uploadType: FileSystem.FileSystemUploadType.MULTIPART,
                            fieldName: 'file',
                            mimeType: asset.mimeType,
                        });
                        
                        response = {
                            status: uploadResult.status,
                            data: uploadResult.body ? JSON.parse(uploadResult.body) : null,
                        };
                    } else {
                        // iOS can use axios with FormData
                        const form = new FormData();
                        form.append('file', {
                            uri: asset.uri,
                            name: asset.filename,
                            type: asset.mimeType,
                        } as any);
                        
                        response = await axios.post(uploadUrl, form, {
                            headers: {
                                'Content-Type': 'multipart/form-data',
                            },
                        });
                    }

                    if (!response.data || response.status !== 200) {
                        updateInFlightUploadStatus(asset.assetId, 'error');
                        console.warn("Response Data: ", response.data);
                        throw new Error("Invalid Response Data");
                    }
                }
            }

            if (invalid.length > 0) {
                for (const asset of invalid) {
                    updateInFlightUploadStatus(asset.assetId, 'error');
                    setUploadErrors(prev => ({ ...prev, [asset.assetId]: 'Invalid asset' }));
                    console.error("useMedia: uploadAssets failed", 'Invalid asset');
                }
            }
        } catch (e) {
            if (axios.isAxiosError(e)) {
                console.error("Axios Error: ", e.response?.data);
            }

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

