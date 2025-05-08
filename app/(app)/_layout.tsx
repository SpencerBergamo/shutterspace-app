
import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';

export default function AppLayout() {
    const { user } = useAuth();

    return (
        <View style={styles.container}>

            <Stack
                screenOptions={{
                    headerShown: false, // Hide the default header since we have AppBar
                }}>
                <Stack.Screen name="home" options={{
                    headerShown: true,
                    headerBackground: () => (
                        <View style={{ backgroundColor: '#F2F1F6', flex: 1 }} />
                    ),
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => { }} >
                            <Image
                                source={user?.photoURL || 'https://ui-avatars.com/api/?name=User'}
                                style={{ width: 32, height: 32 }}
                                contentFit="cover"
                            />
                        </TouchableOpacity>
                    ),
                    headerTitle: () => (
                        <Image
                            source={require('../../assets/logos/logo_simple.svg')}
                            style={{ height: 24, width: 140 }}
                            contentFit="contain" />
                    )
                }} />
                <Stack.Screen name="album/[albumId]" options={{
                    title: "album",
                    headerShown: true,
                }} />
            </Stack>
        </View>
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
}); 