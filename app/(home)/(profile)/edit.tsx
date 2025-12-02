import { TextInputStyles } from '@/constants/styles';
import { useAppTheme } from '@/context/AppThemeContext';
import { useProfile } from '@/context/ProfileContext';
import { api } from '@/convex/_generated/api';
import { useNavigation, usePreventRemove } from '@react-navigation/native';
import { useMutation } from 'convex/react';
import React, { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Alert, Button, Keyboard, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

type ProfileFormData = {
    nickname: string;
}

export default function EditProfileScreen() {
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
        <View style={{ flex: 1, padding: 16, alignContent: 'center', backgroundColor: colors.background }}>
            <KeyboardAwareScrollView
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
                keyboardShouldPersistTaps="handled"
            >

                {/* Nickname */}
                <Controller
                    control={control}
                    name="nickname"
                    rules={{
                        required: "Nickname is required",
                        validate: (value) => {
                            if (value.length < 3 || value.length > 30) {
                                return false;
                            }

                            return true;
                        }
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
                    <Button
                        title="Save Changes"
                        onPress={handleSubmit(saveChanges)}
                        disabled={!isDirty}
                    />
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
})