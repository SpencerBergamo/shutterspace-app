
import { useTheme } from "@/context/ThemeContext";
import { Id } from "@/convex/_generated/dataModel";
import { useAlbums } from "@/hooks/useAlbums";
import { AlbumFormData } from "@/types/Album";
import { validateDescription, validateTitle } from "@/utils/validators";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { TextInput, View } from "react-native";

export default function AlbumSettingsScreen() {
    const { theme } = useTheme();
    const { albumId } = useLocalSearchParams<{ albumId: Id<'albums'> }>();
    const { getAlbumById } = useAlbums();

    const album = getAlbumById(albumId);
    if (!album) return null;

    const titleInputRef = useRef<TextInput>(null);
    const descriptionInputRef = useRef<TextInput>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [openInvites, setOpenInvites] = useState(true);

    const [formData, setFormData] = useState<AlbumFormData>({
        title: album.title,
        description: album.description,
    });

    const [validationState, setValidationState] = useState({
        title: { isValid: false, error: null as string | null },
        description: { isValid: false, error: null as string | null },
    });

    const validateForm = useCallback(() => {
        const titleError = validateTitle(formData.title ?? '');
        const descriptionError = validateDescription(formData.description ?? '');

        const hasChanges = formData.title !== album.title ||
            formData.description !== album.description;

        const isFormValid = !titleError && !descriptionError && hasChanges;

        return {
            title: { isValid: !titleError, error: titleError },
            description: { isValid: !descriptionError, error: descriptionError },
            isFormValid,
        }
    }, [formData.title, formData.description, album.title, album.description]);

    useEffect(() => {
        const validation = validateForm();

        setValidationState({
            title: validation.title,
            description: validation.description,
        });
    }, [validateForm]);

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <Stack.Screen options={{
                headerBackButtonDisplayMode: 'minimal',
                headerTitle: "Settings",
            }} />



            <View></View>
        </View>
    );
}