import OpenInvitesField from "@/components/albums/OpenInvitesField";
import { useAlbums } from "@/hooks/useAlbums";
import useAppStyles from "@/hooks/useAppStyles";
import { usePreventRemove, useTheme } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, Alert, Button, Keyboard, StyleSheet, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

type FormData = {
    title: string;
    description: string | undefined;
    openInvites: boolean;
}

export default function NewAlbum() {
    const theme = useTheme();
    const appStyles = useAppStyles();
    const { createAlbum } = useAlbums();
    const navigation = useNavigation();

    const titleInputRef = useRef<TextInput>(null);
    const descriptionInputRef = useRef<TextInput>(null);

    // -- State Management --
    const [isLoading, setIsLoading] = useState(false);
    const [isOpenInvites, setIsOpenInvites] = useState(true);

    const {
        control,
        handleSubmit,
        formState: { errors, isDirty },
    } = useForm<FormData>({
        mode: 'onChange',
        defaultValues: {
            title: '',
            description: '',
            openInvites: true,
        }
    });

    usePreventRemove(isDirty, ({ data }) => {
        Keyboard.dismiss();
        Alert.alert("Unsaved Changes", "You have unsaved changes. Are you sure you want to leave?", [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Leave', style: 'destructive', onPress: () => navigation.dispatch(data.action) },
        ]);
    });

    const handleCreate = async (data: FormData) => {
        setIsLoading(true);
        try {
            await createAlbum(data);
        } catch (e) {
            console.error("Failed to create album", e);
        } finally {
            setIsLoading(false);
        }

        return (
            <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
                <KeyboardAwareScrollView>
                    <Text style={styles.inputLabel}>
                        Album Title
                    </Text>

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
                                autoFocus
                                placeholder="What's this album for?"
                                value={value}
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
                                onSubmitEditing={() => descriptionInputRef.current?.focus()}
                                style={[appStyles.textInput, { marginBottom: 16 }]} />
                        )}
                    />
                    {errors.title && (
                        <View style={{}}>
                            <Text>{errors.title.message}</Text>
                        </View>
                    )}

                    <Text style={styles.inputLabel}>
                        Description
                    </Text>
                    <Controller
                        control={control}
                        name="description"
                        rules={{
                            required: false,
                            validate: (value) => {
                                if (value && value.length > 300) {
                                    return false;
                                }

                                return true;
                            }
                        }}
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                ref={descriptionInputRef}
                                placeholder="What should your members know about this album?"
                                value={value}
                                multiline={true}
                                maxLength={200}
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
                                style={[appStyles.textInput, { marginBottom: 16 }]} />
                        )}
                    />
                    {errors.description && (
                        <View style={{}}>
                            <Text>{errors.description.message}</Text>
                        </View>
                    )}

                    <OpenInvitesField
                        openInvites={isOpenInvites}
                        onToggle={setIsOpenInvites} />

                    {isLoading ? (<ActivityIndicator size="small" color={theme.colors.primary} />) : (<Button
                        title="Create Album"
                        onPress={handleSubmit(handleCreate)}
                        disabled={!isDirty}
                        color={theme.colors.primary}
                    />)}
                </KeyboardAwareScrollView>
            </View >
        );
    }
}

const styles = StyleSheet.create({
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },

});