import { api } from '@/convex/_generated/api';
import { MAX_WIDTH, TextInputStyles } from '@/src/constants/styles';
import { useAppTheme } from '@/src/context/AppThemeContext';
import { useProfile } from '@/src/context/ProfileContext';
import { validateNickname } from '@/src/utils/validators';
import { useNavigation, usePreventRemove } from '@react-navigation/native';
import { useMutation } from 'convex/react';
import React, { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Alert, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

type ProfileFormData = {
    nickname: string;
}

export function EditProfileScreen() {
    const { profile } = useProfile();
    const { colors } = useAppTheme();
    const navigation = useNavigation();

    const updateProfile = useMutation(api.profile.updateProfile);

    // Refs
    const nicknameInputRef = useRef<TextInput>(null);
    // State
    const [isSaving, setIsSaving] = useState(false);

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors, isDirty },
    } = useForm<ProfileFormData>({
        mode: 'onChange',
        defaultValues: {
            nickname: profile.nickname,
        }
    })

    usePreventRemove(isDirty, ({ data }) => {
        Keyboard.dismiss();
        Alert.alert("Unsaved Changes", "You have unsaved changes. Are you sure you want to leave?", [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Leave', style: 'destructive', onPress: () => navigation.dispatch(data.action) },
        ]);
    });

    const saveChanges = async (data: ProfileFormData) => {
        setIsSaving(true);
        try {
            await updateProfile({ nickname: data.nickname });
            reset(data);
        } catch (e) {
            console.error("Failed to save changes: ", e);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <View style={{ flex: 1, padding: 16, backgroundColor: colors.background, alignItems: 'center' }}>
            <KeyboardAwareScrollView
                style={{ flexShrink: 1, width: '100%', maxWidth: MAX_WIDTH, paddingHorizontal: 16 }}
                keyboardShouldPersistTaps="handled"
            >

                {/* Nickname */}
                <Controller
                    control={control}
                    name="nickname"
                    rules={{
                        required: "Nickname is required",
                        validate: validateNickname,
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            ref={nicknameInputRef}
                            value={value}
                            placeholder="Nickname"
                            placeholderTextColor={colors.text}
                            maxLength={30}
                            autoCapitalize="words"
                            autoCorrect={false}
                            spellCheck={false}
                            textAlign="left"
                            keyboardType="default"
                            returnKeyType="next"
                            selectionColor={colors.primary}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            onSubmitEditing={() => nicknameInputRef.current?.blur()}
                            style={[TextInputStyles, {
                                backgroundColor: colors.background,
                                borderColor: colors.border,
                                color: colors.text,
                                marginBottom: 16
                            }]}
                        />
                    )}
                />
                {errors.nickname && (
                    <View style={styles.errorTextView}>
                        <Text style={{ color: "#FF3B30" }}>{errors.nickname.message}</Text>
                    </View>
                )}

                {isSaving ? <ActivityIndicator size="small" color={colors.primary} /> :
                    <TouchableOpacity
                        disabled={!isDirty}
                        onPress={handleSubmit(saveChanges)}
                        style={[styles.button, { backgroundColor: !isDirty ? '#ccc' : colors.primary }]}>
                        <Text style={styles.buttonText}>Save Changes</Text>
                    </TouchableOpacity>
                }

            </KeyboardAwareScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
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
})