import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditProfile() {
    const { user } = useAuth();
    const [nickname, setNickname] = useState(user?.displayName || '');

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView style={styles.scrollView}>
                <SafeAreaView edges={['bottom']} style={styles.content}>
                    <View style={styles.photoSection}>
                        <TouchableOpacity style={styles.photoContainer}>
                            <Image
                                source={{ uri: user?.photoURL || 'https://ui-avatars.com/api/?name=User' }}
                                style={styles.photo}
                                contentFit="cover"
                            />
                            <View style={styles.photoOverlay}>
                                <Ionicons name="camera" size={24} color="#fff" />
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.photoLabel}>Tap to change photo</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Nickname</Text>
                            <TextInput
                                style={styles.input}
                                value={nickname}
                                onChangeText={setNickname}
                                placeholder="Enter your nickname"
                                autoCapitalize="none"
                                autoComplete="name"
                                textContentType="nickname"
                            />
                        </View>
                    </View>

                    <TouchableOpacity style={styles.saveButton}>
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F1F6',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    photoSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    photoContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 12,
        backgroundColor: '#E5E5E5',
        overflow: 'hidden',
    },
    photo: {
        width: '100%',
        height: '100%',
    },
    photoOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoLabel: {
        fontSize: 14,
        color: '#666',
    },
    form: {
        gap: 20,
    },
    inputContainer: {
        gap: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
    },
    saveButton: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
