import OpenInvitesField from "@/components/albums/OpenInvitesField";
import { Id } from "@/convex/_generated/dataModel";
import { useAlbums } from "@/hooks/useAlbums";
import useAppStyles from "@/hooks/useAppStyles";
import { usePreventRemove, useTheme } from "@react-navigation/native";
import { Stack, useLocalSearchParams, useNavigation } from "expo-router";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, Alert, Button, Keyboard, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

type FormData = {
    title: string;
    description: string;
}

export default function AlbumEditScreen() {
    const theme = useTheme();
    const appStyles = useAppStyles();
    const navigation = useNavigation();
    const { albumId } = useLocalSearchParams<{ albumId: Id<'albums'> }>();
    const { getAlbumById, updateAlbum } = useAlbums();

    const album = getAlbumById(albumId);
    if (!album) return null;

    // Refs
    const titleInputRef = useRef<TextInput>(null);
    const descriptionInputRef = useRef<TextInput>(null);

    // State
    const [isOpenInvites, setIsOpenInvites] = useState<boolean>(album.openInvites);
    const [isSaving, setIsSaving] = useState<boolean>(false);

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
            await updateAlbum(albumId, data);
            reset(data); // Reset form state with the saved values
        } catch (e) {
            console.error("Failed to save changes: ", e);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <View style={{ flex: 1, padding: 16, backgroundColor: appStyles.colorScheme.background }}>
            <Stack.Screen options={{
                headerBackButtonDisplayMode: 'minimal',
                headerTitle: `Edit ${album.title}`
            }} />

            <KeyboardAwareScrollView
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
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
                            style={[appStyles.textInput, { marginBottom: 16 }]}
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
                            style={[appStyles.textInput, { marginBottom: 16 }]}
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
                {isSaving ? <ActivityIndicator size="small" color={theme.colors.primary} /> : <Button
                    title="Save Changes"
                    disabled={!isDirty}
                    color={theme.colors.primary}
                    onPress={handleSubmit(saveChanges)}
                />}
            </KeyboardAwareScrollView>
        </View>
    );
}