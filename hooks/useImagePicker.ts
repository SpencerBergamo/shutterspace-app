import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from "react";
import { Alert, Linking } from "react-native";

export interface ImagePickerProps {
    multiple: boolean;
    maxVideoDuration: number;
}
export const useImagePicker = (props: ImagePickerProps) => {
    const [permission, setPermission] = useState<ImagePicker.PermissionStatus | null>(null);

    useEffect(() => {
        (async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            setPermission(status);
        })();
    }, []);

    const selectAssets = useCallback(async (): Promise<ImagePicker.ImagePickerAsset[] | null> => {
        if (permission !== 'granted') {
            Alert.prompt(
                "Permission Required",
                "Shutterspace needs permission to access your media library to upload images.", [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Open Settings', onPress: () => {
                        Linking.openSettings();
                    }
                }
            ]);
            return null;
        }

        const { assets } = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsMultipleSelection: props.multiple,
            quality: 0.9,
            exif: true,
            videoMaxDuration: props.maxVideoDuration,
        });

        return assets;
    }, [permission]);

    return selectAssets;
}