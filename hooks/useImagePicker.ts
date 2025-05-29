import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from "react";
import { Alert, Linking } from "react-native";

type PermissionStatus = ImagePicker.PermissionStatus;

export const useImagePicker = () => {
    const [permissionStatus, setPermissionStatus] = useState<PermissionStatus | null>(null);

    const checkPermission = async () => {
        const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
        setPermissionStatus(status);
        return status;
    };

    const requestPermission = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        setPermissionStatus(status);

        if (status !== 'granted') {
            Alert.alert(
                "Permission Denied",
                "Shutterspace needs permission to your device gallery so you can share photos.",
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
            );
        }

        return status;
    };

    const pickAssets = async (options?: ImagePicker.ImagePickerOptions) => {
        const status = await checkPermission();
        if (status !== 'granted') {
            await requestPermission();
            return null;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsMultipleSelection: true,
            quality: 0.95,
            videoMaxDuration: 60,
            exif: true,
            ...options,
        });

        if (result.canceled) return null;

        return result.assets; // Return all selected assets instead of just the first one
    }

    useEffect(() => {
        checkPermission();
    }, []);

    return pickAssets;
};