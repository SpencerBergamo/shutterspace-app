import Avatar from '@/src/components/Avatar';
import { TextInputStyles } from '@/src/constants/styles';
import { useAppTheme } from '@/src/context/AppThemeContext';
import { validateAssets, ValidatedAsset } from '@/src/utils/mediaHelper';
import { validateNickname } from '@/src/utils/validators';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { api } from '@shutterspace/backend/convex/_generated/api';
import axios from 'axios';
import { useAction, useMutation, useQuery } from 'convex/react';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, usePreventRemove } from "expo-router/react-navigation";
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Alert, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

type ProfileFormData = {
    avatar?: ValidatedAsset;
    nickname: string;
}

export default function () {
    const profile = useQuery(api.profile.getUserProfile);

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
            nickname: profile?.nickname,
        }
    })

    usePreventRemove(isDirty, ({ data }) => {
        Keyboard.dismiss();
        Alert.alert("Unsaved Changes", "You have unsaved changes. Are you sure you want to leave?", [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Leave', style: 'destructive', onPress: () => navigation.dispatch(data.action) },
        ]);
    });


    const handleLibrarySelection = async (onChange: (value: ValidatedAsset) => void) => {

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Error", "Failed to access media library. Please go to settings and grant access.");
            return;
        }

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
        onChange(asset);
    }

    const handleCameraSelection = async (onChange: (value: ValidatedAsset) => void) => {
        try {

            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Error", "Failed to access camera. Please go to settings and grant access.");
                return;
            }

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
            onChange(asset);
        } catch (e) {
            console.error("Failed to select camera: ", e);
            Alert.alert("Error", "Failed to select camera. Please try again.");
        }
    }

    const saveChanges = async (data: ProfileFormData) => {
        setIsSaving(true);
        try {
            let avatarKey: string | undefined;

            if (data.avatar) {
                const { uploadUrl, avatarKey: key } = await prepareAvatarUpload({ extension: data.avatar.extension, contentType: data.avatar.mimeType });

                const buffer = await fetch(data.avatar.uri).then(res => res.arrayBuffer());
                await axios.put(uploadUrl, buffer, {
                    headers: { 'Content-Type': data.avatar.mimeType },
                }).catch(e => {
                    console.error("Failed to upload avatar to R2: ", e);
                    throw new Error("Failed to upload avatar");
                })

                avatarKey = key;
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

    const showActionSheet = (onChange: (value: ValidatedAsset) => void) => {
        const options = ['Take Photo', 'Choose from Library', 'Cancel'];
        const cancelButtonIndex = options.length - 1;

        showActionSheetWithOptions({
            options,
            cancelButtonIndex,
        }, (index) => {
            switch (index) {
                case 0:
                    handleCameraSelection(onChange);
                    break;
                case 1:
                    handleLibrarySelection(onChange);
                    break;
                case cancelButtonIndex:
                    break;
            }
        })
    }

    return (
        <KeyboardAwareScrollView
            style={[styles.screen, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.content}
            contentInsetAdjustmentBehavior="automatic"
            keyboardShouldPersistTaps="handled"
            bottomOffset={24}
            showsVerticalScrollIndicator={false}
        >
            <Controller
                control={control}
                name="avatar"
                render={({ field: { onChange } }) => (
                    <Avatar
                        nickname={profile?.nickname ?? 'No User'}
                        avatarKey={profile?.avatarKey}
                        ssoAvatarUrl={profile?.ssoAvatarUrl}
                        localUri={avatar?.uri}
                        onPress={() => showActionSheet(onChange)}
                        size={80}
                    />
                )}
            />

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
                        placeholderTextColor={colors.caption}
                        maxLength={30}
                        autoCapitalize="words"
                        autoCorrect={false}
                        spellCheck={false}
                        textAlign="left"
                        keyboardType="default"
                        returnKeyType="done"
                        selectionColor={colors.primary}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        onSubmitEditing={() => nicknameInputRef.current?.blur()}
                        style={[TextInputStyles, {
                            width: '100%',
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                            color: colors.text,
                        }]}
                    />
                )}
            />
            {errors.nickname ? (
                <View style={styles.errorTextView}>
                    <Text style={styles.errorText}>{errors.nickname.message}</Text>
                </View>
            ) : null}

            {isSaving ? (
                <ActivityIndicator size="small" color={colors.primary} />
            ) : (
                <TouchableOpacity
                    disabled={!isDirty}
                    onPress={handleSubmit(saveChanges)}
                    style={[styles.button, { backgroundColor: !isDirty ? '#ccc' : colors.primary }]}
                >
                    <Text style={styles.buttonText}>Save Changes</Text>
                </TouchableOpacity>
            )}
        </KeyboardAwareScrollView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
    content: {
        flexGrow: 1,
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingBottom: 32,
    },
    errorTextView: {
        alignSelf: 'stretch',
        minHeight: 21,
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    errorText: {
        color: '#FF3B30',
    },
    button: {
        width: '100%',
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
