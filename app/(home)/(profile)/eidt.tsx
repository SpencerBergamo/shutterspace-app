import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@kolking/react-native-avatar';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function EditProfileScreen() {
    const [nickname, setNickname] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');

    // Validation: nickname must be 3-30 characters
    const isNicknameValid = nickname.length >= 3 && nickname.length <= 30;
    const isSubmitEnabled = isNicknameValid;
    const isApproachingLimit = nickname.length >= 25;

    const handleAvatarPress = () => {
        // TODO: Implement avatar selection functionality
        console.log('Avatar pressed - open image picker');
    };

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
                    <Avatar
                        size={120} />
                    <View style={styles.avatarOverlay}>
                        <Ionicons name="camera" size={24} color="#FFFFFF" />
                    </View>
                </TouchableOpacity>
            </View>

            {/* Nickname Section */}
            <View style={styles.nicknameSection}>
                <Text style={styles.sectionTitle}>Nickname</Text>
                <TextInput
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
        width: 40,
        height: 40,
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