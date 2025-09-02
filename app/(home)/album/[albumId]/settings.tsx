
import OpenInvitesField from "@/components/albums/OpenInvitesField";
import { useSignedUrls } from "@/context/SignedUrlsContext";
import { useTheme } from "@/context/ThemeContext";
import { Id } from "@/convex/_generated/dataModel";
import { useAlbums } from "@/hooks/useAlbums";
import { AlbumFormData, AlbumFormState } from "@/types/Album";
import { validateDescription, validateTitle } from "@/utils/validators";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Button, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

type UpdateStatus = 'idle' | 'saving' | 'success' | 'error';

export default function AlbumSettingsScreen() {
    const { theme } = useTheme();
    const { albumId } = useLocalSearchParams<{ albumId: Id<'albums'> }>();
    const { getAlbumById, updateAlbum } = useAlbums();
    const { clearSignedEntries } = useSignedUrls();

    const album = getAlbumById(albumId);
    if (!album) return null;

    const titleInputRef = useRef<TextInput>(null);
    const descriptionInputRef = useRef<TextInput>(null);

    const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle');

    const [formData, setFormData] = useState<AlbumFormData>({
        title: album.title,
        description: album.description,
    });

    const validateForm = useCallback((): AlbumFormState => {
        const titleError = validateTitle(formData.title ?? '');
        const descriptionError = validateDescription(formData.description ?? '');

        const hasChanges = formData.title !== album.title ||
            formData.description !== album.description;

        const isFormValid = !titleError && !descriptionError && hasChanges;

        return {
            hasChanges: hasChanges,
            isFormValid: isFormValid,
            title: { isValid: !titleError, error: titleError },
            description: { isValid: !descriptionError, error: descriptionError },
        }
    }, [formData.title, formData.description, album.title, album.description]);

    const formState = validateForm();

    const handleFieldChange = (field: keyof AlbumFormData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSubmit = useCallback(async () => {
        if (!formState.isFormValid) return;

        setUpdateStatus('saving');
        try {
            await updateAlbum(albumId, formData);
            setUpdateStatus('success');

        } catch (e) {
            console.error("Updating Album (FAIL)", e);
            setUpdateStatus('error');
        } finally {
            setUpdateStatus('idle');
        }
    }, [formState.isFormValid, updateAlbum, albumId, formData]);

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <Stack.Screen options={{
                headerBackButtonDisplayMode: 'minimal',
                headerTitle: "Settings",
            }} />

            <KeyboardAwareScrollView style={styles.keyboardScrollView}>

                {/* Album Thumbnail */}
                <View style={{ width: '100%', padding: 16 }}>
                    <View style={{ width: '100%', height: 100, backgroundColor: theme.colors.secondary, borderRadius: 16, borderWidth: 2, borderColor: '#E5E5E5' }} />
                </View>

                {/* Album Title */}
                <TextInput
                    ref={titleInputRef}
                    value={formData.title}
                    placeholder="Album Title"
                    placeholderTextColor="#999999"
                    maxLength={50}
                    autoCapitalize="words"
                    autoCorrect={false}
                    spellCheck={false}
                    textAlign="left"
                    keyboardType="default"
                    returnKeyType="next"
                    selectionColor={theme.colors.primary}
                    onChangeText={text => handleFieldChange('title', text)}
                    onSubmitEditing={() => descriptionInputRef.current?.focus()}
                    style={[theme.styles.textInput, { marginBottom: 8 }]} />

                {/* Album Description */}
                <TextInput
                    ref={descriptionInputRef}
                    value={formData.description}
                    placeholder="Feel free to share a little more about this album"
                    placeholderTextColor="#999999"
                    maxLength={300}
                    autoCapitalize="sentences"
                    autoCorrect
                    spellCheck
                    textAlign="left"
                    keyboardType="default"
                    returnKeyType="next"
                    selectionColor={theme.colors.primary}
                    onChangeText={text => handleFieldChange('description', text)}
                    onSubmitEditing={() => descriptionInputRef.current?.blur()}
                    style={[theme.styles.textInput, { marginBottom: 32 }]} />

                {/* Open Invites */}
                <OpenInvitesField
                    openInvites={formData.openInvites}
                    onToggle={value => setFormData({ ...formData, openInvites: value })} />

                <TouchableOpacity onPress={handleSubmit} style={[styles.submitButton,
                { backgroundColor: !formState.isFormValid ? 'grey' : theme.colors.primary },
                ]} >
                    {updateStatus === 'saving' ? <ActivityIndicator size='small' color={theme.colors.secondary} /> : (
                        <Text style={styles.submitButtonText}>Save Changes</Text>
                    )}
                </TouchableOpacity>

                {updateStatus === 'error' && (
                    <Text style={{ width: '100%', color: theme.colors.danger, textAlign: 'center', marginBottom: 16 }}>
                        Something went wrong, please try again.
                    </Text>
                )}

                <Button title="Clear Cache" onPress={() => clearSignedEntries()} />

            </KeyboardAwareScrollView>
        </View>
    );


}

const styles = StyleSheet.create({
    keyboardScrollView: {
        flex: 1,
        padding: 16,
    },

    submitButton: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },

    changesSavedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    changesSavedText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
})