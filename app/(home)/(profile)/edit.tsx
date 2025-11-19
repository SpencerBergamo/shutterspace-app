import useAppStyles from '@/constants/appStyles';
import { useProfile } from '@/context/ProfileContext';
import { api } from '@/convex/_generated/api';
import { useNavigation, usePreventRemove, useTheme } from '@react-navigation/native';
import { useMutation } from 'convex/react';
import React, { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Alert, Button, Keyboard, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

type ProfileFormData = {
    nickname: string;
}

export default function EditProfileScreen() {
    const { profile } = useProfile();
    const theme = useTheme();
    const navigation = useNavigation();
    const appStyles = useAppStyles();

    const updateProfile = useMutation(api.profile.updateProfile);

    // Refs
    const nicknameInputRef = useRef<TextInput>(null);
    // State
    const [isSaving, setIsSaving] = useState(false);

    const {
        control,
        handleSubmit,
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
        } catch (e) {
            console.error("Failed to save changes: ", e);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <View style={{ flex: 1, padding: 16, alignContent: 'center', backgroundColor: theme.colors.background }}>
            <KeyboardAwareScrollView>

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
                            placeholderTextColor={theme.colors.text}
                            maxLength={30}
                            autoCapitalize="words"
                            autoCorrect={false}
                            spellCheck={false}
                            textAlign="left"
                            keyboardType="default"
                            returnKeyType="next"
                            selectionColor={theme.colors.primary}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            onSubmitEditing={() => nicknameInputRef.current?.blur()}
                            style={[appStyles.textInput, { marginBottom: 16 }]}
                        />
                    )}
                />
                {errors.nickname && (
                    <View style={{}}>
                        <Text>{errors.nickname.message}</Text>
                    </View>
                )}

                {isSaving ? <ActivityIndicator size="small" color={theme.colors.primary} /> :
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