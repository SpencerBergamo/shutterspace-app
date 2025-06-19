import { ASSETS } from '@/constants/assets';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { useNetworkListener } from '@/hooks/useNetworkListener';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from "@kolking/react-native-avatar";
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { defaultScreenOptions } from '../../components/navigation';

/* Common header configs, nav patterns, shared nav UI elements,
nav state management, and common nav behaviors. 

Layouts are used to wrap the app's content and provide a consistent UI structure.
They are used to manage the app's navigation and state. */

export default function AppLayout() {
    const { firebaseUser: user } = useAuth();
    const { profile } = useProfile();

    function NetworkHeader() {
        const isConnected = useNetworkListener();

        if (!isConnected.isConnected) {
            return (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.offlineText} />
                    <Text style={styles.offlineText}>Disconnected</Text>
                </View>
            );
        }

        return (
            <Image
                source={ASSETS.logoSimple}
                style={{ height: 24, width: 140 }}
                contentFit="contain" />
        );
    }

    const headerRight = () => (
        <TouchableOpacity
            onPress={() => { router.push('/profile') }}
            style={{ marginRight: 16 }}>
            <Avatar
                source={{ uri: profile.avatarUrl }}
                email={profile.email}
                size={32}
            />
        </TouchableOpacity>
    );



    const BackButton = () => (
        <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16 }} >
            <Ionicons name="arrow-back" size={24} color='black' />
        </TouchableOpacity>
    )

    return (
        <Stack screenOptions={defaultScreenOptions}>
            <Stack.Screen
                name="index"
                options={{
                    headerTitle: () => (<NetworkHeader />),
                    headerRight: headerRight
                }} />

            <Stack.Screen
                name="(profile)"
                options={{
                    headerShown: false
                }} />

            <Stack.Screen
                name="(media)"
                options={{ headerShown: false }} />

            <Stack.Screen name="[albumId]" />

            <Stack.Screen name="(create)" />
        </Stack>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: '#fff',
    },
    logo: {
        width: 120,
        height: 32,
    },

    offlineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'red',
        marginRight: 8,
    },
    offlineText: {
        color: 'red',
        fontSize: 16,
        fontWeight: '500',
    }
}); 