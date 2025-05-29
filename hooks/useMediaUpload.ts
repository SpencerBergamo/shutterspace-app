import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { OptimisticMedia } from '@/types/Media';
import { useAction, useMutation } from 'convex/react';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';

/**
 * Why is useMediaUpload a hook? especially because it's using the expo-image-picker: 
 * ANSWER: this hook provides consisten logic i can reference across my app when uploading
 * media to my cloudinary backend. 
 * 
 * @param albumId - the album by albumid
 * 
 * 
 * upload presets are a way to define options carefully in my cloudinary account. 
 * 
 */

export const useMediaUpload = (albumId: Id<'albums'>, profileId: Id<'profiles'>) => {
    const [optimisticMedia, setOptimisticMedia] = useState<OptimisticMedia[]>([]);

    const generateSignatures = useAction(api.cloudinary.generateSignatures);
    const createMediaEntry = useMutation(api.media.createMedia);

    useEffect(() => {
        (async () => {
            if (Platform.OS !== 'web') {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    // TODO: setup the alert to open settings option
                    Alert.alert(
                        "Permission Denied",
                        "Shutterspace needs permission to access your device gallery so you can upload to this album.",
                        [
                            {
                                text: "Cancel",
                                style: "cancel"
                            },
                            {
                                text: "Open Settings",
                                onPress: () => Linking.openSettings()
                            }
                        ]
                    )
                }
            }
        })();
    }, []);

    const handleUploadPress = async () => {
        let res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images", "videos"],
            allowsMultipleSelection: true,
            quality: 0.95,
            videoMaxDuration: 60,
        });


        if (!res.canceled) {
            // Create optimistic media entries for selected assets
            const selectedAssets = res.assets.map((asset, index) => ({
                _id: `temp-${Date.now()}-${index}`,
                uri: asset.uri,
                albumId: albumId as Id<'albums'>,
                status: 'pending' as const,
                progress: 0,
                uploadedBy: profileId as Id<'profiles'>,
                mediaType: (asset.type === 'video' ? 'video' : 'image') as 'image' | 'video',
                mimeType: asset.mimeType,
                size: asset.fileSize,
                error: undefined
            }));

            // Update optimistic media state
            setOptimisticMedia(prev => [...prev, ...selectedAssets]);
            processUploads(selectedAssets);
        }

    };

    const processUploads = async (assetsToUpload: OptimisticMedia[]) => {

        if (assetsToUpload.length === 0) return;

        const getFilename = (uri: string, mediaType: 'image' | 'video'): string => {
            const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
            const ext = uri.split('.').pop()?.toLowerCase() || (mediaType === 'video' ? 'mp4' : 'jpg');
            return `${uniqueId}.${ext}`;
        }

        try {
            const {
                signatures, apiKey, cloudName, uploadPreset, folder,
            } = await generateSignatures({
                albumId: albumId as Id<'albums'>,
                numberOfSignatures: assetsToUpload.length,
                uploadPreset: 'shutterspace-media',
            });

            if (!apiKey || !cloudName) throw new Error("Cloudinary Configuration Missing.");

            // loop through assets and upload
            for (let i = 0; i < assetsToUpload.length; i++) {
                const asset = assetsToUpload[i];
                const signatureData = signatures[i];

                const filename = getFilename(asset.uri, asset.mediaType);
                const mimeType = asset.mimeType || (asset.mediaType ===
                    'video' ? 'video/mp4' : 'image/jpeg'
                )

                const formData = new FormData();
                formData.append('file', {
                    uri: asset.uri,
                    type: mimeType,
                    name: filename,
                    size: asset.size, // number | undefined
                } as any);

                formData.append('api_key', apiKey);
                formData.append('timestamp', signatureData.timestamp.toString());
                formData.append('signature', signatureData.signature);
                formData.append('upload_preset', uploadPreset);
                formData.append('folder', folder);
                formData.append('resource_type', 'auto');
                formData.append('allowed_formats', 'jpg,jpeg,png,heic,mp4,mov');
                formData.append('transformation', 'f_auto,q_auto');
                formData.append('metaData', 'true');
                formData.append('faces', 'true');

                // using the [asset.mediaType] follows Cloudinary's best practices.
                const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${asset.mediaType}/upload`;

                try {
                    const response = await fetch(uploadUrl, {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        console.error("Cloudinary upload failed: ", errorData);

                        throw new Error(errorData.error?.message || 'No Error Message');
                    }

                    const result = await response.json();
                    const cloudinaryId = result.public_id; // Cloudinary's identifier

                    setOptimisticMedia((prev) => prev.map((item) => item._id === asset._id ? {
                        ...item, status: 'success', cloudinaryid: cloudinaryId, uploadProgress: 100,
                    } : item));

                    // what i need clarification from here is that after i upload the media document 
                    // to the media table in convex, can i just remove the OptimisticMedia instance
                    // from the state and let Convex maintain the syncronous data in my gallery?

                    const convexMediaId = await createMediaEntry({
                        albumId: albumId,
                        uploadedById: profileId,
                        cloudinaryId: cloudinaryId,
                        mediaType: asset.mediaType,
                        uploadedAt: Math.round(Date.now() / 1000),
                    });



                } catch (uploadError: any) {
                    console.error("Error uploading media: ", uploadError);

                    // i only need one instance of setting the optimistic media to error so well need to fix this 
                    setOptimisticMedia((prev) => prev.map((item) => item._id === asset._id ? {
                        ...item, status: 'error', error: uploadError.message,
                    } : item));
                }
            }

            const failedUploads = optimisticMedia.filter((item) => item.status === 'error').length;
            const successfulUploads = assetsToUpload.length - failedUploads;

            if (successfulUploads > 0) {
                // show a brief alert but something different than an alert or toast of success

            }

        } catch (signatureError: any) {
            // Handling Error UI and retry option
            console.error("Error generating signatures: ", signatureError);

            setOptimisticMedia((prev) => prev.map((item) =>
                assetsToUpload.some((asset) => asset._id === item._id) ? {
                    ...item, status: 'error', error: signatureError.message || 'Failed',
                } : item));

            // alert upload failures and provide option to retry
            Alert.alert(
                "Upload Failed",
                `${assetsToUpload.length} media items failed to upload.`,
                [
                    {
                        text: "Cancel",
                        style: "cancel"
                    },
                    {
                        text: "Retry",
                        onPress: () => processUploads(assetsToUpload)
                    }
                ]
            )
        }
    };

    const retryUpload = async (retyUploads: OptimisticMedia[]) => { }

    return {
        handleUploadPress,
        optimisticMedia,
    }
}