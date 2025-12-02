import OpenInvitesField from "@/components/albums/OpenInvitesField";
import { TextInputStyles } from "@/constants/styles";
import { useAppTheme } from "@/context/AppThemeContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { usePreventRemove, useTheme } from "@react-navigation/native";
import { useAction } from "convex/react";
import { router, useNavigation } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, Alert, InteractionManager, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

type FormData = {
    title: string;
    description: string | undefined;
    openInvites: boolean;
}

export default function NewAlbum() {
    const theme = useTheme();
    const { colors } = useAppTheme();
    const navigation = useNavigation();

    const titleInputRef = useRef<TextInput>(null);
    const descriptionInputRef = useRef<TextInput>(null);

    // -- State Management --
    const [isLoading, setIsLoading] = useState(false);
    const [isOpenInvites, setIsOpenInvites] = useState(true);

    // Convex
    const createAlbum = useAction(api.albums.createAlbum);

    const {
        control,
        handleSubmit,
        formState: { errors, isDirty },
        reset,
    } = useForm<FormData>({
        mode: 'onChange',
        defaultValues: {
            title: '',
            description: '',
            openInvites: true,
        }
    });

    useEffect(() => {
        const task = InteractionManager.runAfterInteractions(() => {
            titleInputRef.current?.focus();
        });

        return () => task.cancel();
    }, []);

    usePreventRemove(isDirty, ({ data }) => {
        Keyboard.dismiss();
        Alert.alert("Unsaved Changes", "You have unsaved changes. Are you sure you want to leave?", [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Leave', style: 'destructive', onPress: () => navigation.dispatch(data.action) },
        ]);
    });

    useEffect(() => {
        const task = InteractionManager.runAfterInteractions(() => {
            titleInputRef.current?.focus();
        });

        return () => task.cancel();
    }, []);

    const handleCreate = async (data: FormData) => {
        setIsLoading(true);
        try {
            const albumId: Id<'albums'> | null = await createAlbum(data);

            if (!albumId) {
                Alert.alert("Failed to create album", "Please try again.");
                return;
            }

            reset();
            router.replace(`/albums/${albumId}`);
        } catch (e) {
            console.error("Failed to create album", e);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <View style={{ flex: 1, padding: 16, backgroundColor: colors.background }}>
            <KeyboardAwareScrollView
                contentContainerStyle={{ paddingBottom: 20 }}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.inputLabel}>
                    Title
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
                            placeholder="What's this album for?"
                            value={value}
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
                            style={[TextInputStyles, {
                                backgroundColor: colors.background,
                                borderColor: colors.border,
                                color: colors.text,
                                marginBottom: 8
                            }]} />
                    )}
                />
                {errors.title && (
                    <View style={styles.errorTextView}>
                        <Text style={{ color: "#FF3B30" }}>{errors.title.message}</Text>
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
                            style={[TextInputStyles, {
                                backgroundColor: colors.background,
                                borderColor: colors.border,
                                color: colors.text,
                                marginBottom: 16
                            }]} />
                    )}
                />
                {errors.description && (
                    <View style={styles.errorTextView}>
                        <Text style={{ color: "#FF3B30" }}>{errors.description.message}</Text>
                    </View>
                )}

                <OpenInvitesField
                    openInvites={isOpenInvites}
                    onToggle={setIsOpenInvites} />

                {isLoading ? (<ActivityIndicator size="small" color={theme.colors.primary} />) : (
                    <TouchableOpacity
                        disabled={!isDirty}
                        onPress={handleSubmit(handleCreate)}
                        style={[styles.button, { backgroundColor: !isDirty ? '#ccc' : colors.primary }]}>
                        <Text style={styles.buttonText}>Create Album</Text>
                    </TouchableOpacity>
                )}
            </KeyboardAwareScrollView>
        </View >
    );
}

const styles = StyleSheet.create({
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },

    errorTextView: {
        flex: 1,
        height: 21,
        justifyContent: 'center',
        paddingHorizontal: 8,
    },

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

});