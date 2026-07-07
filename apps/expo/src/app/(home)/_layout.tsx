
import PlatformIcon from "@/src/components/PlatformIcon/platform-icon";
import { useAppTheme } from "@/src/context/AppThemeContext";
import { api } from "@shutterspace/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { router, Stack } from "expo-router";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";

export default function HomeLayout() {
    const { colors } = useAppTheme();

    const profile = useQuery(api.profile.getUserProfile);

    if (profile === undefined) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.text} />
            </View>
        )
    }

    if (profile === null) router.replace('/welcome');

    return (
        <Stack screenOptions={{
            headerBackButtonDisplayMode: 'minimal',
            headerShadowVisible: false,
            headerTransparent: true,
        }}>
            <Stack.Screen name="index" options={{
                headerShown: true,
                headerTitle: '',
                headerLeft: () => (
                    <TouchableOpacity style={{}} onPress={() => router.push('/settings')} >
                        <PlatformIcon name="profile" size={28} color="white" />
                    </TouchableOpacity>
                ),
                headerRight: () => (
                    <View style={{ flexDirection: 'row', gap: 16, paddingHorizontal: 12 }}>
                        <TouchableOpacity>
                            <PlatformIcon name="notifications" size={28} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push('/albums')} >
                            <PlatformIcon name="grid2x2" size={28} color="white" />
                        </TouchableOpacity>
                    </View>
                ),
            }} />

            <Stack.Screen name="albums" options={{
                headerTitle: 'Albums',
                headerLargeTitleEnabled: true,
            }} />

            {/* Profile */}
            <Stack.Screen name="settings" options={{
                headerTitle: 'Settings',
                animation: 'slide_from_left',
                headerBackVisible: false,
                headerRight: () => (
                    <TouchableOpacity onPress={() => router.back()} >
                        <PlatformIcon name="camera" size={28} color="black" />
                    </TouchableOpacity>
                ),
            }} />
            <Stack.Screen name="profile/edit" options={{
                headerTitle: 'Edit Profile',
                headerBackButtonDisplayMode: 'minimal',
            }} />
            <Stack.Screen name="shareId/[code]" options={{
                headerShown: false,
                presentation: 'transparentModal',
                animation: 'fade',
            }} />

            {/* 
                Album Screens
            */}

            <Stack.Screen name="new-album" options={{
                presentation: 'modal',
            }} />
            <Stack.Screen name="album/[albumId]/index" options={{
                headerShown: true,
                headerTitle: '',
            }} />
            <Stack.Screen name="album/[albumId]/settings" options={{
                headerShown: true,
                headerTitle: 'Album Settings',
            }} />
            <Stack.Screen name="album/[albumId]/qr-code" options={{
                headerShown: true,
                headerTitle: '',
                presentation: 'modal',
            }} />
            <Stack.Screen name="viewer/[index]/index" options={{
                headerShown: true,
                animation: 'fade',
                animationDuration: 200,
            }} />


            {/* Friends */}
            <Stack.Screen name="friends" />
            <Stack.Screen name="share-profile" options={{
                presentation: 'modal',
            }} />

            <Stack.Screen name="contact-us" options={{
                headerTitle: 'Contact Us',
            }} />

            <Stack.Screen name="invite/[code]" options={{
                headerTitle: '',
                headerTransparent: true,
                headerTintColor: 'white',
                headerStyle: {
                    backgroundColor: 'transparent',
                }
            }} />
        </Stack>
    );
}
