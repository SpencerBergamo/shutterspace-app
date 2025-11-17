import { useTheme } from "@/context/ThemeContext";
import { Id } from "@/convex/_generated/dataModel";
import { useAlbums } from "@/hooks/useAlbums";
import { Stack, useLocalSearchParams } from "expo-router";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

type FormData = {
    title: string;
    description: string;
}

export default function AlbumEditScreen() {
    const { theme } = useTheme();
    const { albumId } = useLocalSearchParams<{ albumId: Id<'albums'> }>();
    const { getAlbumById, updateAlbum } = useAlbums();

    const album = getAlbumById(albumId);
    if (!album) return null;

    const titleInputRef = useRef<TextInput>(null);
    const descriptionInputRef = useRef<TextInput>(null);

    const {
        control,
        handleSubmit,
        formState: { errors, isDirty },
    } = useForm<FormData>({
        mode: 'onChange',
        defaultValues: {
            title: album.title,
            description: album.description,
        }
    });

    const saveChanges = (data: FormData) => {
        try { } catch (e) {
            console.error("Failed to save changes: ", e);
        }
    }

    return (
        <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
            <Stack.Screen options={{
                headerBackButtonDisplayMode: 'minimal',
                headerTitle: `Edit ${album.title}`
            }} />

            <KeyboardAwareScrollView>

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
                            style={[theme.styles.textInput, { marginBottom: 16 }]}
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
                            style={[theme.styles.textInput, { marginBottom: 16 }]}
                        />
                    )}
                />
                {errors.description && (
                    <View style={{}}>
                        <Text>{errors.description.message}</Text>
                    </View>
                )}

                {/* Save Changes Button */}
                <Button
                    title="Save Changes"
                    disabled={isDirty}
                    onPress={handleSubmit(saveChanges)}
                />
            </KeyboardAwareScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {},
})