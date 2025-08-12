import { useProfile } from '@/context/ProfileContext';
import { validateNickname } from '@/utils/validators';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { getStorage } from '@react-native-firebase/storage';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Camera } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Image } from 'react-native-compressor';

export default function EditProfileScreen() {
    const { profile, updateProfile } = useProfile();
    const { showActionSheetWithOptions } = useActionSheet();
    const storage = getStorage();

    const [loadingProgress, setLoadingProgress] = useState<number | null>(null);
    const [nickname, setNickname] = useState(profile?.nickname);
    const [avatar, setAvatar] = useState<{ url?: string, uri?: ImagePicker.ImagePickerAsset }>({
        url: profile?.avatarUrl,
    });

    const [validationState, setValidationState] = useState({
        nickname: { isValid: false, error: null as string | null },
    });

    const isFormValid = useMemo(() => {
        const hasNicknameChanged = nickname !== profile?.nickname;
        const hasAvatarChanged = avatar.uri !== undefined;
        const hasChanges = hasNicknameChanged || hasAvatarChanged;

        return hasChanges && validationState.nickname.isValid;
    }, [nickname, avatar.uri, validationState.nickname.isValid]);

    // Validation: nickname must be 3-30 characters
    const isApproachingLimit = nickname.length >= 25;

    const nicknameInputRef = useRef<TextInput>(null);
    const storageRef = storage.ref(`profiles/${profile._id}`);

    useEffect(() => {
        const nicknameError = validateNickname(nickname);

        setValidationState(prev => ({
            ...prev,
            nickname: { isValid: !nicknameError, error: nicknameError },
        }));
    }, [nickname]);

    const handleAvatarPress = () => {
        console.log('Avatar pressed');
        const options = ['Camera', 'Gallery', 'Cancel'];

        showActionSheetWithOptions({
            options,
            cancelButtonIndex: 2,
        }, (selectedIndex) => {
            switch (selectedIndex) {
                case 0:
                    handleImagePicker('camera');
                    break;
                case 1:
                    handleImagePicker('gallery');
                    break;
            }
        });

    };

    const handleImagePicker = async (source: 'camera' | 'gallery') => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission required', 'Please grant permission to access your media library');
            return;
        }

        let result: ImagePicker.ImagePickerResult;

        if (source === 'camera') {
            result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsMultipleSelection: false,
                allowsEditing: true,
                quality: 1,
                exif: true,
            });
        } else if (source === 'gallery') {
            result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsMultipleSelection: false,
                allowsEditing: true,
                quality: 1,
                exif: true,
            });
        } else {
            console.error('Not supported source', source);
            return;
        }

        if (result.assets && result.assets.length > 0) {
            setAvatar({
                uri: result.assets[0],
            });
        }
    }

    const handleUpdateProfile = useCallback(async () => {
        if (!validationState.nickname.isValid) return;

        setLoadingProgress(0);

        try {
            if (avatar.uri) {
                const compressedUri = await Image.compress(avatar.uri.uri, {
                    output: 'jpg',
                    quality: 0.9,
                });

                const downloadUrl = await new Promise<string>((resolve, reject) => {
                    const uploadTask = storageRef.child(`avatar.jpg`).putFile(compressedUri);

                    uploadTask.on('state_changed', (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        setLoadingProgress(progress);
                    });

                    uploadTask.then((snapshot) => {
                        snapshot.ref.getDownloadURL().then(resolve).catch(reject);
                    }).catch(reject);
                });

                await updateProfile({
                    nickname,
                    avatarUrl: downloadUrl,
                })
            } else {
                await updateProfile({ nickname });
            }

        } catch (e) {
            console.error('Error updating profile', e);
        } finally {
            setLoadingProgress(null);
            router.back();
        }
    }, [nickname, avatar, updateProfile]);

    const renderSubmitButton = useCallback(() => (
        <TouchableOpacity
            style={[
                styles.submitButton,
                !isFormValid && styles.submitButtonDisabled
            ]}
            onPress={handleUpdateProfile}
            disabled={!isFormValid}
            activeOpacity={0.8}
        >
            {loadingProgress ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
                <Text style={[
                    styles.submitButtonText,
                    !isFormValid && styles.submitButtonTextDisabled
                ]}>
                    Change Nickname
                </Text>

            )}
        </TouchableOpacity>
    ), [loadingProgress, isFormValid, handleUpdateProfile]);

    return (
        <View style={styles.container}>
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
                <TouchableOpacity
                    style={styles.avatarContainer}
                    onPress={handleAvatarPress}
                    activeOpacity={0.8} >
                    {avatar.uri || avatar.url ? (
                        <ExpoImage
                            source={{ uri: avatar.uri?.uri ?? avatar.url }}
                            style={{ width: 120, height: 120, borderRadius: 100 }}
                            contentFit="cover"
                        />
                    ) : (<View style={styles.avatarPlaceholder}></View>)}
                    <View style={styles.avatarOverlay}>
                        <Camera size={24} color="#FFFFFF" />
                    </View>
                </TouchableOpacity>
            </View>

            {/* Nickname Section */}
            <View style={styles.nicknameSection}>
                <Text style={styles.sectionTitle}>Nickname</Text>
                <TextInput

                    ref={nicknameInputRef}
                    style={[
                        styles.nicknameInput,
                        nickname.length > 0 && !validationState.nickname.isValid && styles.inputError
                    ]}
                    value={nickname}
                    onChangeText={setNickname}
                    placeholder="Enter your nickname"
                    placeholderTextColor="#999999"
                    maxLength={30}
                    autoCapitalize="words"
                    autoCorrect={false}
                />
                {isApproachingLimit && (
                    <Text style={styles.characterCount}>
                        {nickname.length}/30 characters
                    </Text>
                )}
                {nickname.length > 0 && !validationState.nickname.isValid && (
                    <Text style={styles.errorText}>
                        {validationState.nickname.error}
                    </Text>
                )}
            </View>

            {/* Submit Button */}
            <View style={styles.buttonSection}>
                {renderSubmitButton()}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F1F6',
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatarOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#007AFF',
        borderRadius: 20,
        width: 50,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    avatarPlaceholder: {
        backgroundColor: '#E5E5E5',
        color: '#999999',
        width: 120,
        height: 120,
        borderRadius: 100,
    },
    avatarLabel: {
        fontSize: 14,
        color: '#666666',
        textAlign: 'center',
    },
    nicknameSection: {
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 12,
    },
    nicknameInput: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#000000',
        marginBottom: 8,
    },
    inputError: {
        borderColor: '#FF3B30',
    },
    characterCount: {
        fontSize: 12,
        color: '#999999',
        textAlign: 'right',
        marginBottom: 4,
    },
    errorText: {
        fontSize: 12,
        color: '#FF3B30',
    },
    buttonSection: {
        flex: 1,
        justifyContent: 'flex-start',
        paddingBottom: 20,
    },
    submitButton: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#E5E5E5',
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    submitButtonTextDisabled: {
        color: '#999999',
    },
});