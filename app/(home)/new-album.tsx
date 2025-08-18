import FloatingButton from "@/components/FloatingButton";
import { useProfile } from "@/context/ProfileContext";
import { useTheme } from "@/context/ThemeContext";
import { useAlbums } from "@/hooks/useAlbums";
import { AlbumFormData } from "@/types/Album";
import { validateTitle } from "@/utils/validators";
import { router } from "expo-router";
import { KeyRound } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView, KeyboardStickyView } from "react-native-keyboard-controller";

export default function NewAlbum() {
    const { profile } = useProfile();
    const { theme } = useTheme();
    const { createAlbum, isLoading: isAlbumLoading } = useAlbums();

    const titleInputRef = useRef<TextInput>(null);
    const descriptionInputRef = useRef<TextInput>(null);

    // -- State Management --
    const [isFormValid, setIsFormValid] = useState(false);
    const [isOpenInvites, setIsOpenInvites] = useState(true);
    const [formData, setFormData] = useState<AlbumFormData>({
        title: '',
        description: '',
    });
    const [validationState, setValidationState] = useState({
        title: { isValid: false, error: null as string | null },
    });

    const resetForm = useCallback(() => {
        setFormData({ title: '', description: '' });
        setValidationState({ title: { isValid: false, error: null } });
        setIsFormValid(false);

        titleInputRef.current?.clear();
        descriptionInputRef.current?.clear();
        titleInputRef.current?.focus();
    }, []);

    useEffect(() => {
        const titleError = validateTitle(formData.title ?? '');

        setValidationState(prev => ({
            ...prev,
            title: { isValid: !titleError, error: titleError },
        }));

        setIsFormValid(Object.values(validationState).every(field => field.isValid));
    }, [formData.title]);

    // Clean Up
    useEffect(() => {
        return () => resetForm();
    }, [resetForm]);

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
            console.error("Failed to create album", e);
        }

    }, [formData, isFormValid, createAlbum]);

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <KeyboardAwareScrollView style={{ flex: 1, padding: 16 }}>
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
                    style={[theme.styles.textInput, { marginBottom: 16 }]} />

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
                    style={[theme.styles.textInput, { marginBottom: 32 }]} />

                {/* Open Invites Toggle */}
                <View style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    gap: 16,
                    backgroundColor: '#e9ecef',
                    borderRadius: 16,
                    padding: 16,
                }}>


                    <View style={{
                        flex: 1,
                        flexDirection: 'column',
                        gap: 4,
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <KeyRound size={16} color={theme.colors.text} />
                            <Text style={{
                                fontSize: 16,
                                fontWeight: '600',
                            }}>Open Invites</Text>
                        </View>

                        {isOpenInvites ? (
                            <Text style={{ flexShrink: 1 }}>
                                All members can invite new members
                            </Text>
                        ) : (
                            <Text style={{ flexShrink: 1 }}>
                                Only you or moderators can invite new members
                            </Text>
                        )}

                    </View>

                    <Switch
                        value={isOpenInvites}
                        onValueChange={value => setIsOpenInvites(value)}
                        trackColor={{ true: theme.colors.primary }}
                    />
                </View>

                {/* <TouchableOpacity onPress={() => { }} style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#e9ecef',
                    gap: 16,
                    borderRadius: 16,
                    padding: 16,

                }}>
                    <Link size={24} color={theme.colors.text} />

                    <View style={{
                        flex: 1,
                        flexDirection: 'column',
                        flexShrink: 1,
                        gap: 2,
                    }}>
                        <Text style={{
                            fontSize: 16,
                            fontWeight: '600',
                        }}>
                            Ready to Share?
                        </Text>
                        <Text>Tap to send an invite link to your friends and family</Text>

                    </View>


                </TouchableOpacity> */}
            </KeyboardAwareScrollView>

            <KeyboardStickyView offset={{ closed: 0, opened: 30 }}>
                <FloatingButton
                    isEnabled={isFormValid}
                    iconType="submit"
                    onPress={handleSubmit}
                />
            </KeyboardStickyView>
        </View >
    );
}

const styles = StyleSheet.create({
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
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