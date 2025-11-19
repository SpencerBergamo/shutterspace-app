import OpenInvitesField from "@/components/albums/OpenInvitesField";
import useAppStyles from "@/constants/appStyles";
import { useAlbums } from "@/hooks/useAlbums";
import { AlbumFormData } from "@/types/Album";
import { validateTitle } from "@/utils/validators";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Button, StyleSheet, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
// import { KeyboardAwareScrollView, KeyboardStickyView } from "react-native-keyboard-controller";

export default function NewAlbum() {
    const theme = useTheme();
    const appStyles = useAppStyles();
    const { createAlbum } = useAlbums();

    const titleInputRef = useRef<TextInput>(null);
    const descriptionInputRef = useRef<TextInput>(null);

    // -- State Management --
    const [isLoading, setIsLoading] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [isOpenInvites, setIsOpenInvites] = useState(true);
    const [formData, setFormData] = useState<AlbumFormData>({
        title: '',
        description: '',
    });
    const [validationState, setValidationState] = useState({
        title: { isValid: false, error: null as string | null },
    });

    useEffect(() => {
        const titleError = validateTitle(formData.title ?? '');

        setValidationState(prev => ({
            ...prev,
            title: { isValid: !titleError, error: titleError },
        }));

        setIsFormValid(Object.values(validationState).every(field => field.isValid));
    }, [formData.title]);

    // -- State Updates --
    const updateField = (field: keyof AlbumFormData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    // -- Event Handlers --
    const handleSubmit = useCallback(async () => {
        if (!isFormValid) return;

        try {
            setIsLoading(true);
            const albumId = await createAlbum(formData);
            router.replace(`/album/${albumId}`);
        } catch (e) {
            console.error("Failed to create album", e);
        } finally {
            setIsLoading(false);
        }

    }, [formData, isFormValid, createAlbum]);

    return (
        <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
            <KeyboardAwareScrollView>
                <Text style={styles.inputLabel}>
                    Album Title
                </Text>
                <TextInput
                    ref={titleInputRef}
                    autoFocus
                    placeholder="What's this album for?"
                    value={formData.title}
                    maxLength={50}
                    autoCapitalize="words"
                    autoCorrect={false}
                    spellCheck={false}
                    textAlign="left"
                    keyboardType="default"
                    returnKeyType="next"
                    selectionColor={theme.colors.primary}
                    onChangeText={text => updateField('title', text)}
                    onSubmitEditing={() => descriptionInputRef.current?.focus()}
                    style={[appStyles.textInput, { marginBottom: 16 }]} />

                <Text style={styles.inputLabel}>
                    Description
                </Text>

                <TextInput
                    ref={descriptionInputRef}
                    placeholder="What should your members know about this album?"
                    value={formData.description}
                    multiline={true}
                    maxLength={200}
                    autoCapitalize="sentences"
                    autoCorrect
                    spellCheck
                    textAlign="left"
                    keyboardType="default"
                    returnKeyType="done"
                    selectionColor={theme.colors.primary}
                    onChangeText={text => updateField('description', text)}
                    onSubmitEditing={() => descriptionInputRef.current?.blur()}
                    style={[appStyles.textInput, { marginBottom: 16 }]} />

                <OpenInvitesField
                    openInvites={isOpenInvites}
                    onToggle={setIsOpenInvites} />

                {isLoading ? (<ActivityIndicator size="small" color={theme.colors.primary} />) : (<Button
                    title="Create Album"
                    onPress={handleSubmit}
                    disabled={!isFormValid}
                    color={theme.colors.primary}

                />)}
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



})