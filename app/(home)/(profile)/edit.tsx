import { useProfile } from '@/context/ProfileContext';
import { useActionSheet } from '@expo/react-native-action-sheet';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function EditProfileScreen() {
    const { profile } = useProfile();
    const { showActionSheetWithOptions } = useActionSheet();

    const [isLoading, setIsLoading] = useState(false);
    const [nickname, setNickname] = useState(profile?.nickname);
    const [avatar, setAvatar] = useState<string | ImagePicker.ImagePickerAsset>(profile?.avatarUrl);
    const nicknameInputRef = useRef<TextInput>(null);

    // Validation: nickname must be 3-30 characters
    const isNicknameValid = nickname.length >= 3 && nickname.length <= 30;
    const isSubmitEnabled = isNicknameValid && nickname !== profile?.nickname;
    const isApproachingLimit = nickname.length >= 25;

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
            setAvatar(result.assets[0]);
        }

    }

    const handleChangeNickname = () => {
        // TODO: Implement nickname change functionality
        console.log('Change nickname pressed:', nickname);
    };

    return (
        <View style={styles.container}>
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
                <TouchableOpacity
                    style={styles.avatarContainer}
                    onPress={handleAvatarPress}
                    activeOpacity={0.8} >
                    {/* <ProfileAvatar size={120} nickname={profile?.nickname} borderRadius={100} /> */}
                    <View style={{ width: 120, height: 120, borderRadius: 100, backgroundColor: 'pink' }}></View>
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
                        nickname.length > 0 && !isNicknameValid && styles.inputError
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
                {nickname.length > 0 && !isNicknameValid && (
                    <Text style={styles.errorText}>
                        Nickname must be between 3-30 characters
                    </Text>
                )}
            </View>

            {/* Submit Button */}
            <View style={styles.buttonSection}>
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        !isSubmitEnabled && styles.submitButtonDisabled
                    ]}
                    onPress={handleChangeNickname}
                    disabled={!isSubmitEnabled}
                    activeOpacity={0.8}
                >
                    <Text style={[
                        styles.submitButtonText,
                        !isSubmitEnabled && styles.submitButtonTextDisabled
                    ]}>
                        Change Nickname
                    </Text>
                </TouchableOpacity>
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