import { useAuth } from "@/context/AuthContext";
import { ProfileProvider, useProfile } from "@/context/ProfileContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { router, Stack } from "expo-router";
import { ArrowLeft, X } from "lucide-react-native";
import { useMemo } from "react";
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
    const { profile } = useProfile();
    const { themeStyles } = useTheme();
    const iconButton = themeStyles.iconButton;

    const closeButton = useMemo(() => (
        <Pressable style={[iconButton]} onPress={() => router.back()}>
            <X size={iconButton.size} color={themeStyles.colors.text} />
        </Pressable>
    ), [router]);

    const backButton = useMemo(() => (
        <Pressable style={[iconButton]} onPress={() => router.back()} >
            <ArrowLeft size={iconButton.size} color={themeStyles.colors.text} />
        </Pressable>
    ), [router]);

    return (
        <Stack screenOptions={{
            headerBackButtonDisplayMode: 'minimal',
            headerShadowVisible: false,
            headerStyle: {
                backgroundColor: '#F2F1F6',
            }
        }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />

            <Stack.Screen name="settings" options={{
                headerTitle: 'Settings',
                headerLeft: () => backButton,
            }} />

            <Stack.Screen name="new-album" options={{
                headerTitle: 'Create New Album',
                presentation: 'fullScreenModal',
                headerLeft: () => closeButton,
            }} />

            <Stack.Screen name="album/[albumId]/index" options={{
                headerShown: true,
            }} />

            <Stack.Screen name="(profile)/edit" options={{
                headerTitle: 'Edit Profile',
                headerLeft: () => backButton,
            }} />


        </Stack>
    );
}


export default function Layout() {
    const { user } = useAuth();
    if (!user) throw new Error('Not Authenticated');

    return (
        <ProfileProvider fuid={user.uid}>
            <ThemeProvider>
                <ActionSheetProvider>
                    <HomeLayout />
                </ActionSheetProvider>
            </ThemeProvider>
        </ProfileProvider>
    );
}