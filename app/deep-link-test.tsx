import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { createAlbumJoinLink, createAlbumJoinWebLink, parseAlbumJoinLink } from '@/utils/deepLinking';
import * as Linking from 'expo-linking';

export default function DeepLinkTest() {
    const [testAlbumId, setTestAlbumId] = useState('test-album-123');
    const [testUrl, setTestUrl] = useState('');
    const router = useRouter();

    const generateLinks = () => {
        const nativeLink = createAlbumJoinLink(testAlbumId);
        const webLink = createAlbumJoinWebLink(testAlbumId);
        
        Alert.alert(
            'Generated Links',
            `Native: ${nativeLink}\n\nWeb: ${webLink}`,
            [
                { text: 'Copy Native', onPress: () => console.log('Native link:', nativeLink) },
                { text: 'Copy Web', onPress: () => console.log('Web link:', webLink) },
                { text: 'OK' }
            ]
        );
    };

    const testLinkParsing = () => {
        if (!testUrl) {
            Alert.alert('Error', 'Please enter a URL to test');
            return;
        }
        
        const albumId = parseAlbumJoinLink(testUrl);
        if (albumId) {
            Alert.alert('Success', `Parsed Album ID: ${albumId}`);
        } else {
            Alert.alert('Error', 'Could not parse album ID from URL');
        }
    };

    const navigateToJoinPage = () => {
        router.push(`/join/${testAlbumId}`);
    };

    const getCurrentUrl = async () => {
        try {
            const url = await Linking.getInitialURL();
            Alert.alert('Current URL', url || 'No initial URL');
        } catch (error) {
            console.error('Error getting current URL:', error);
            Alert.alert('Error', 'Could not get current URL');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Deep Link Testing</Text>
            
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Test Album ID:</Text>
                <TextInput
                    style={styles.input}
                    value={testAlbumId}
                    onChangeText={setTestAlbumId}
                    placeholder="Enter album ID"
                />
            </View>

            <TouchableOpacity style={styles.button} onPress={generateLinks}>
                <Text style={styles.buttonText}>Generate Join Links</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={navigateToJoinPage}>
                <Text style={styles.buttonText}>Test Navigation to Join Page</Text>
            </TouchableOpacity>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Test URL Parsing:</Text>
                <TextInput
                    style={styles.input}
                    value={testUrl}
                    onChangeText={setTestUrl}
                    placeholder="Enter URL to test (e.g., shutterspace://join/123)"
                    multiline
                />
                <TouchableOpacity style={styles.button} onPress={testLinkParsing}>
                    <Text style={styles.buttonText}>Parse URL</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.button} onPress={getCurrentUrl}>
                <Text style={styles.buttonText}>Get Current URL</Text>
            </TouchableOpacity>

            <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>Expected Link Patterns:</Text>
                <Text style={styles.infoText}>• shutterspace://join/[albumId]</Text>
                <Text style={styles.infoText}>• https://shutterspace.app/join/[albumId]</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        padding: 20,
        paddingTop: 60,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    infoSection: {
        marginTop: 30,
        padding: 15,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
    },
    infoText: {
        fontSize: 12,
        color: '#666',
        marginBottom: 5,
        fontFamily: 'monospace',
    },
});