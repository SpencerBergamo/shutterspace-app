import * as ImagePicker from 'expo-image-picker';
import { useCallback } from "react";
import { Alert, Linking } from "react-native";

export interface ImagePickerProps {
    multiple: boolean;
    maxVideoDuration: number;
}
export const useImagePicker = (props: ImagePickerProps) => {
    const selectAssets = useCallback(async (): Promise<ImagePicker.ImagePickerAsset[] | null> => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                "Permission Required",
                "Shutterspace needs permission to access your media library to upload images.", [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Open Settings', onPress: () => {
                        Linking.openSettings();
                    }
                }
            ]);
        }

        const { assets } = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsMultipleSelection: props.multiple,
            quality: 0.9,
            exif: true,
            videoMaxDuration: props.maxVideoDuration,
        });

        return assets;
    }, []);

    return selectAssets;
}