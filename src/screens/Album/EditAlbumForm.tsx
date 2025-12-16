import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { MAX_WIDTH, TextInputStyles } from "@/src/constants/styles";
import { useAlbums } from "@/src/context/AlbumsContext";
import { useAppTheme } from "@/src/context/AppThemeContext";
import { validateAlbumTitle, validateDescription } from "@/src/utils/validators";
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

export function EditAlbumScreen() {
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
                        validate: validateAlbumTitle,
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                        <View style={{ flexDirection: 'column', gap: 2, marginBottom: 16 }}>
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
                                }]}
                            />
                            {errors.title && <Text style={{ color: '#FF3B30' }}>{errors?.title?.message}</Text>}
                        </View>
                    )}
                />

                {/* Album Description */}
                <Controller
                    control={control}
                    name="description"
                    rules={{
                        required: false,
                        validate: validateDescription,
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                        <View style={{ flexDirection: 'column', gap: 2, alignItems: 'flex-end', marginBottom: 16 }}>
                            <TextInput
                                ref={descriptionInputRef}
                                value={value}
                                placeholder="What should your members know?"
                                placeholderTextColor="#999999"
                                maxLength={300}
                                multiline={true}
                                textAlignVertical="top"
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
                                }]}
                            />
                            <Text style={{ color: colors.caption, fontSize: 12 }}>{value?.length ?? 0}/300</Text>
                            {errors.description && <Text style={{ color: '#FF3B30' }}>{errors?.description?.message}</Text>}
                        </View>
                    )}
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