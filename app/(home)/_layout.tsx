import { AlbumsProvider, useAlbums } from "@/context/AlbumsContext";
import { useAppTheme } from "@/context/AppThemeContext";
import { FriendsProvider, useFriends } from "@/context/FriendsContext";
import { ProfileProvider, useProfile } from "@/context/ProfileContext";
// import { useTheme } from "@react-navigation/native";
import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";

function HomeLayout() {
    const { colors } = useAppTheme();

    const { isLoading: profileLoading } = useProfile();
    const { isLoading: friendsLoading } = useFriends();
    const { isLoading: albumsLoading } = useAlbums();

    if (profileLoading || friendsLoading || albumsLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.text} />
            </View>
        )
    }

    return (
        <Stack screenOptions={{
            headerBackButtonDisplayMode: 'minimal',
            headerShadowVisible: false,
            headerStyle: {
                backgroundColor: colors.background,
            }
        }}>
            <Stack.Screen name="index" />

            <Stack.Screen name="settings" options={{
                headerTitle: 'Settings',
            }} />

            <Stack.Screen name="new-album" options={{
                headerTitle: 'Create New Album',
            }} />

            <Stack.Screen name="album/[albumId]/index" options={{
                headerShown: true,
            }} />

            <Stack.Screen name="viewer/[albumId]/index" options={{
                headerShown: true,
                animation: 'fade',
                animationDuration: 200,
            }} />

            <Stack.Screen name="(profile)/edit" options={{
                headerTitle: 'Edit Profile',
                headerBackButtonDisplayMode: 'minimal',
            }} />

            <Stack.Screen name="friends" options={{
                headerTitle: 'My Friends',
            }} />

            <Stack.Screen name="shareId/[code]" options={{
                headerShown: false,
                presentation: 'transparentModal',
                gestureEnabled: true,
            }} />

            <Stack.Screen name="contact-us" options={{
                headerTitle: 'Contact Us',
            }} />
        </Stack>
    );
}


export default function Layout() {
    return (
        <ProfileProvider>
            <AlbumsProvider>
                <FriendsProvider>
                    <HomeLayout />
                </FriendsProvider>
            </AlbumsProvider>
        </ProfileProvider>
    );
}