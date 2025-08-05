import FloatingButton from "@/components/FloatingButton";
import { useProfile } from "@/context/ProfileContext";
import { useTheme } from "@/context/ThemeContext";
import { useAlbums } from "@/hooks/useAlbums";
import { AlbumFormData } from "@/types/Album";
import { validateTitle } from "@/utils/validators";
import { router, Stack } from "expo-router";
import { X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, useWindowDimensions, View } from "react-native";
import { KeyboardAwareScrollView, KeyboardStickyView } from "react-native-keyboard-controller";

interface EnabledComponents {
    dateTime: boolean;
    location: boolean;
}

export default function NewAlbum() {
    const { profile } = useProfile();
    const { width } = useWindowDimensions();
    const { themeStyles } = useTheme();
    const iconButton = themeStyles.iconButton;

    const { createAlbum, isLoading } = useAlbums();


    const titleInputRef = useRef<TextInput>(null);
    const [isFormValid, setIsFormValid] = useState(false);

    // -- State Management --
    const [formData, setFormData] = useState<AlbumFormData>({
        title: '',
    })
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
            const albumId = await createAlbum(formData);
            router.replace(`/album/${albumId}`);
        } catch (e) {

        }

    }, [formData, isFormValid]);

    // -- Memoized Components --
    const titleInput = useMemo(() => (
        <TextInput
            ref={titleInputRef}
            autoFocus
            placeholder="Album Title"
            value={formData.title}
            multiline={true}
            maxLength={50}
            autoCapitalize="words"
            autoCorrect={false}
            spellCheck={false}
            textAlign="center"
            keyboardType="default"
            returnKeyType="done"
            submitBehavior="blurAndSubmit"
            selectionColor={themeStyles.colors.primary}
            onChangeText={text => updateField('title', text)}
            onSubmitEditing={() => { }}
            style={{
                minHeight: 36,
                fontSize: 21,
                paddingHorizontal: 32,
                marginBottom: 16,
            }} />
    ), [formData.title]);

    const fab = useMemo(() => (
        <FloatingButton
            isEnabled={isFormValid}
            iconType="arrow"
            onPress={handleSubmit}
        />
    ), [isFormValid, isLoading]);

    const componentStyles = {
        ...styles.componentContainer,
        backgroundColor: themeStyles.colors.background,
        borderColor: themeStyles.borderColor,
    };

    return (
        <View style={{ flex: 1, backgroundColor: themeStyles.colors.background }}>
            <Stack.Screen options={{
                headerLeft: () => (
                    <Pressable style={[iconButton]} onPress={() => router.back()}>
                        <X size={iconButton.size} color={themeStyles.colors.text} />
                    </Pressable>
                ),
            }} />

            <KeyboardAwareScrollView style={{ flex: 1, padding: 16 }}>

                <View style={{ width: '100%', height: 75 }} />

                {titleInput}

            </KeyboardAwareScrollView>

            <KeyboardStickyView offset={{ closed: 0, opened: 30 }}>
                {fab}
            </KeyboardStickyView>
        </View >
    );
}

const styles = StyleSheet.create({
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
    },

    inputContainer: {
        backgroundColor: '#e9ecef',
        borderRadius: 16,
        padding: 16,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },

    componentContainer: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        elevation: 2,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        marginVertical: 16,
    },
})