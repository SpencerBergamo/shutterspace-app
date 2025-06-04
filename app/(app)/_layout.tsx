import { albumMockData } from '@/config/env';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from "@kolking/react-native-avatar";
import { Image } from 'expo-image';
import { useNetworkState } from 'expo-network';
import { router, Stack } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/* Common header configs, nav patterns, shared nav UI elements,
nav state management, and common nav behaviors. 

Layouts are used to wrap the app's content and provide a consistent UI structure.
They are used to manage the app's navigation and state. */

export default function AppLayout() {
    const { user } = useAuth();
    const { profile } = useProfile();

    function NetworkHeader() {
        const isConnected = useNetworkState();

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
                source={require('@/assets/logos/logo_simple.svg')}
                style={{ height: 24, width: 140 }}
                contentFit="contain" />
        );
    }

    const BackButton = () => (
        <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16 }} >
            <Ionicons name="arrow-back" size={24} color='black' />
        </TouchableOpacity>
    )

    return (
        <SafeAreaView edges={['bottom']} style={styles.container}>
            <Stack screenOptions={{
                headerShown: false,
                headerTitleAlign: 'left',
                headerBackButtonDisplayMode: 'minimal',
                headerBackground: () => (
                    <View style={{ backgroundColor: '#F2F1F6', flex: 1 }} />
                )
            }}>
                {/* Home Screen */}
                <Stack.Screen
                    name="home"
                    options={{
                        headerTitle: () => (<NetworkHeader />),

                        headerRight: () => (
                            <TouchableOpacity
                                onPress={() => { router.push('/profile') }}
                                style={{ marginRight: 16 }}>
                                <Avatar
                                    source={{ uri: profile?.avatarUrl }}
                                    email={profile?.email || user?.email || ''}
                                    size={32}
                                />
                            </TouchableOpacity>
                        ),
                    }} />

                {/* Album Screen */}
                <Stack.Screen
                    name="album/[albumId]"
                    options={({ route }) => {
                        const { albumId } = route.params as { albumId: string };
                        const album = albumMockData.find((album) => album.albumId === albumId);

                        return {
                            title: album?.title || "Album",
                            headerLeft: () => <BackButton />,
                            headerRight: () => (
                                <TouchableOpacity onPress={() => { }} style={{ marginRight: 16 }}>
                                    <Ionicons name='ellipsis-horizontal' size={24} color='black' />
                                </TouchableOpacity>
                            ),
                        }
                    }} />

                {/* Profile Screen */}
                <Stack.Screen
                    name="profile"
                    getId={({ }) => String(Date.now())}
                    options={{
                        title: "Profile",
                        headerLeft: () => (<BackButton />),
                    }} />

                {/* Edit Profile Screen */}
                <Stack.Screen name="edit-profile" options={{
                    title: "Edit Profile",
                    headerLeft: () => (<BackButton />)
                }} />

            </Stack>
        </SafeAreaView>
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