import OpenInvitesField from "@/components/albums/OpenInvitesField";
import { MAX_WIDTH, TextInputStyles } from "@/constants/styles";
import { useAlbums } from "@/context/AlbumsContext";
import { useAppTheme } from "@/context/AppThemeContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { usePreventRemove, useTheme } from "@react-navigation/native";
import { useMutation } from "convex/react";
import { Stack, useLocalSearchParams, useNavigation } from "expo-router";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, Alert, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

type FormData = {
    title: string;
    description: string;
}

export default function AlbumEditScreen() {
    const theme = useTheme();
    const { colors } = useAppTheme();
    const navigation = useNavigation();
    const { albumId } = useLocalSearchParams<{ albumId: Id<'albums'> }>();
    const { getAlbum } = useAlbums();

    const album = getAlbum(albumId);
    if (!album) return null;

    // Refs
    const titleInputRef = useRef<TextInput>(null);
    const descriptionInputRef = useRef<TextInput>(null);

    // State
    const [isOpenInvites, setIsOpenInvites] = useState<boolean>(album.openInvites);
    const [isSaving, setIsSaving] = useState<boolean>(false);

    // Convex
    const updateAlbum = useMutation(api.albums.updateAlbum);

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors, isDirty },
    } = useForm<FormData>({
        mode: 'onChange',
        defaultValues: {
            title: album.title,
            description: album.description,
        }
    });

    usePreventRemove(isDirty, ({ data }) => {
        Keyboard.dismiss();
        Alert.alert("Unsaved Changes", "You have unsaved changes. Are you sure you want to leave?", [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Leave', style: 'destructive', onPress: () => navigation.dispatch(data.action) },
        ]);
    })

    const saveChanges = async (data: FormData) => {
        setIsSaving(true);
        try {
            await updateAlbum({
                albumId,
                title: data.title,
                description: data.description,
                openInvites: isOpenInvites,
            });

            reset(data); // Reset form state with the saved values
        } catch (e) {
            console.error("Failed to save changes: ", e);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <View style={{ flex: 1, padding: 16, backgroundColor: colors.background, alignItems: 'center' }}>
            <Stack.Screen options={{
                headerBackButtonDisplayMode: 'minimal',
                headerTitle: `Edit ${album.title}`
            }} />

            <KeyboardAwareScrollView
                style={{ flexShrink: 1, width: '100%', maxWidth: MAX_WIDTH, paddingHorizontal: 16 }}
                keyboardShouldPersistTaps="handled"
            >

                {/* Album Title */}
                <Controller
                    control={control}
                    name="title"
                    rules={{
                        required: "Title is required",
                        validate: (value) => {
                            return value.length > 0;
                        }
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            ref={titleInputRef}
                            value={value}
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
                            onChangeText={onChange}
                            onBlur={onBlur}
                            onSubmitEditing={() => titleInputRef.current?.focus()}
                            style={[TextInputStyles, {
                                backgroundColor: colors.background,
                                borderColor: colors.border,
                                color: colors.text,
                                marginBottom: 16
                            }]}
                        />
                    )}
                />
                {errors.title && (
                    <View style={{}}>
                        <Text>{errors.title.message}</Text>
                    </View>
                )}

                {/* Album Description */}
                <Controller
                    control={control}
                    name="description"
                    rules={{
                        required: false,
                        validate: (value) => {
                            return value.length <= 300;
                        }
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            ref={descriptionInputRef}
                            value={value}
                            placeholder="What should your members know?"
                            placeholderTextColor="#999999"
                            maxLength={300}
                            autoCapitalize="sentences"
                            autoCorrect
                            spellCheck={false}
                            textAlign="left"
                            keyboardType="default"
                            returnKeyType="done"
                            selectionColor={theme.colors.primary}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            onSubmitEditing={() => descriptionInputRef.current?.blur()}
                            style={[TextInputStyles, {
                                backgroundColor: colors.background,
                                borderColor: colors.border,
                                color: colors.text,
                                marginBottom: 16
                            }]}
                        />
                    )}
                />
                {errors.description && (
                    <View style={{}}>
                        <Text>{errors.description.message}</Text>
                    </View>
                )}

                <OpenInvitesField
                    openInvites={isOpenInvites}
                    onToggle={setIsOpenInvites}
                />

                {/* Save Changes Button */}
                {isSaving ? <ActivityIndicator size="small" color={theme.colors.primary} /> : (
                    <TouchableOpacity
                        disabled={!isDirty}
                        onPress={handleSubmit(saveChanges)}
                        style={[styles.button, { backgroundColor: !isDirty ? '#ccc' : colors.primary }]}>
                        <Text style={styles.buttonText}>Save Changes</Text>
                    </TouchableOpacity>
                )}
            </KeyboardAwareScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    button: {
        width: '100%',
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
})