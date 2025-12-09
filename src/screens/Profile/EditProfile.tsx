import { api } from '@/convex/_generated/api';
import { TextInputStyles } from '@/src/constants/styles';
import { useAppTheme } from '@/src/context/AppThemeContext';
import { useProfile } from '@/src/context/ProfileContext';
import { validateAssets, ValidatedAsset } from '@/src/utils/mediaHelper';
import { validateNickname } from '@/src/utils/validators';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useNavigation, usePreventRemove } from '@react-navigation/native';
import axios from 'axios';
import { useAction, useMutation } from 'convex/react';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Alert, Keyboard, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type ProfileFormData = {
    avatar?: any;
    nickname: string;
}

export function EditProfileScreen() {
    const { profile } = useProfile();
    const { colors } = useAppTheme();
    const navigation = useNavigation();
    const { showActionSheetWithOptions } = useActionSheet();

    const updateProfile = useMutation(api.profile.updateProfile);
    const prepareAvatarUpload = useAction(api.r2.prepareAvatarUpload);

    // Refs
    const nicknameInputRef = useRef<TextInput>(null);
    // State
    const [isSaving, setIsSaving] = useState(false);
    const [avatar, setAvatar] = useState<ValidatedAsset | null>(null);

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


    const handleLibrarySelection = async () => {
        const picker = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (picker.canceled || !picker.assets || picker.assets.length === 0) return;
        const { valid } = await validateAssets(picker.assets);
        if (valid.length === 0) return;

        const asset = valid[0];
        setAvatar(asset);
    }

    const handleCameraSelection = async () => {
        const picker = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (picker.canceled || !picker.assets || picker.assets.length === 0) return;
        const { valid } = await validateAssets(picker.assets);
        if (valid.length === 0) return;

        const asset = valid[0];
        setAvatar(asset);
    }

    const saveChanges = async (data: ProfileFormData) => {
        setIsSaving(true);
        try {
            let avatarKey: string | undefined;

            if (avatar) {
                const { uploadUrl, avatarId } = await prepareAvatarUpload({ extension: avatar.extension, contentType: avatar.mimeType });

                const buffer = await fetch(avatar.uri).then(res => res.arrayBuffer());
                await axios.put(uploadUrl, buffer, {
                    headers: { 'Content-Type': avatar.mimeType },
                }).catch(e => {
                    console.error("Failed to upload avatar to R2: ", e);
                    throw new Error("Failed to upload avatar");
                })

                avatarKey = avatarId;
            }

            await updateProfile({ nickname: data.nickname, avatarKey });
            reset(data);
        } catch (e) {
            console.error("EditProfile saveChanges: ", e);
            Alert.alert("Error", "Failed to save changes. Please try again.");
        } finally {
            setIsSaving(false);
        }
    }

    const showActionSheet = () => {
        const options = ['Take Photo', 'Choose from Library', 'Cancel'];
        const cancelButtonIndex = options.length - 1;

        showActionSheetWithOptions({
            options,
            cancelButtonIndex,
        }, (index) => {
            switch (index) {
                case 0:
                    handleCameraSelection();
                    break;
                case 1:
                    handleLibrarySelection();
                    break;
                case cancelButtonIndex:
                    break;
            }
        })
    }

    return (
        <View style={{ flex: 1, flexDirection: 'column', gap: 8, padding: 16, backgroundColor: colors.background, alignItems: 'center' }}>
            {/* Avatar */}
            <Controller
                control={control}
                name="avatar"
                render={({ field: { onChange, onBlur, value } }) => (
                    <Pressable onPress={async () => {
                        await Haptics.selectionAsync();
                        showActionSheet();
                    }}>
                        <View style={[styles.avatarContainer, { backgroundColor: colors.secondary + '60', borderColor: colors.border }]}>

                            {!profile.avatarKey && !avatar && (
                                <Text style={{ fontSize: 24, fontWeight: '600' }}>{profile.nickname.charAt(0)}</Text>
                            )}

                            {profile.avatarKey && (
                                <></>
                            )}

                            {avatar && (
                                <Image
                                    source={{ uri: avatar.uri }}
                                    contentFit="cover"
                                    style={{ width: '100%', height: '100%' }}
                                />
                            )}
                        </View>
                    </Pressable>
                )}
            />



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
                            width: '100%',
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
        </View>
    );
}

const styles = StyleSheet.create({

    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 100,
        overflow: 'hidden',
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },

    errorTextView: {
        flex: 1,
        height: 21,
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    button: {
        width: '100%',
        paddingVertical: 10,
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