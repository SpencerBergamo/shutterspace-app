import { ProfileProvider } from "@/context/ProfileContext";
import { SignedUrlsProvider } from "@/context/SignedUrlsContext";

import { useTheme } from "@/context/ThemeContext";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { router, Stack } from "expo-router";
import { ArrowLeft, X } from "lucide-react-native";
import { Pressable } from "react-native";

/* 

headerLeft: () => (
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                        <Text style={{ fontSize: 24, fontWeight: '600', color: themeStyles.colors.text, marginBottom: 2 }}>Hi, {profile.nickname}!</Text>
                        <Text style={{
                            fontSize: 14,
                            color: '#6C757D',
                            fontWeight: '400',
                        }}>Welcome Back!</Text>

                    </View>
                ),
                headerRight: () => (
                    <ProfileAvatar onPress={() => { }} nickname={profile.nickname} size={48} />
                ),
*/

function HomeLayout() {
    const { theme } = useTheme();

    const iconButton = theme.styles.iconButton;

    const closeButton = () => (
        <Pressable style={[iconButton]} onPress={() => router.back()}>
            <X size={iconButton.width} color={iconButton.borderColor} />
        </Pressable>
    );

    const backButton = () => (
        <Pressable style={[iconButton]} onPress={() => router.back()} >
            <ArrowLeft size={iconButton.width} color={iconButton.borderColor} />
        </Pressable>
    );

    return (
        <Stack screenOptions={{
            headerBackButtonDisplayMode: 'minimal',
            headerShadowVisible: false,
            headerStyle: {
                backgroundColor: theme.colors.background,
            }
        }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />

            <Stack.Screen name="settings" options={{
                headerTitle: 'Settings',
            }} />

            <Stack.Screen name="new-album" options={{
                headerTitle: 'Create New Album',
            }} />

            <Stack.Screen name="album/[albumId]/index" options={{
                headerShown: true,
            }} />

            <Stack.Screen name="(profile)/edit" options={{
                headerTitle: 'Edit Profile',
                headerLeft: backButton,
            }} />
        </Stack>
    );
}


export default function Layout() {
    return (
        <SignedUrlsProvider>
            <ProfileProvider>
                <ActionSheetProvider>
                    <HomeLayout />
                </ActionSheetProvider>
            </ProfileProvider>
        </SignedUrlsProvider>
    );
}