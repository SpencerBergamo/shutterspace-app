import { api } from "@shutterspace/backend/convex/_generated/api";
import { useAppTheme } from "@/src/context/AppThemeContext";
import { useQuery } from "convex/react";
// import { useTheme } from "@react-navigation/native";
import { router, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";

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
            headerStyle: {
                backgroundColor: colors.background,
            },
            headerTintColor: 'black',
        }}>
            <Stack.Screen name="index" />

            {/* Profile */}
            <Stack.Screen name="settings" options={{
                headerTitle: 'Settings',
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