import { AlbumsProvider, useAlbums } from "@/src/context/AlbumsContext";
import { useAppTheme } from "@/src/context/AppThemeContext";
import { ProfileProvider, useProfile } from "@/src/context/ProfileContext";
// import { useTheme } from "@react-navigation/native";
import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";

function HomeLayout() {
    const { colors } = useAppTheme();

    const { isLoading: profileLoading } = useProfile();
    const { isLoading: albumsLoading } = useAlbums();

    if (profileLoading || albumsLoading) {
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
            },
            headerTintColor: 'black',
        }}>
            <Stack.Screen name="index" />

            <Stack.Screen name="camera" options={{
                headerShown: false,
            }} />

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

            {/* Album */}
            <Stack.Screen name="new-album" options={{
                presentation: 'modal',
            }} />
            <Stack.Screen name="album/[albumId]/index" options={{
                headerShown: true,
            }} />
            <Stack.Screen name="viewer/[index]/index" options={{
                headerShown: true,
                animation: 'fade',
                animationDuration: 200,
            }} />
            <Stack.Screen name="album/[albumId]/members" options={{
                headerTitle: 'Album Members',
            }} />


            {/* Friends */}
            <Stack.Screen name="friends" options={{}} />

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


export default function Layout() {
    return (
        <ProfileProvider>
            <AlbumsProvider>
                <HomeLayout />
            </AlbumsProvider>
        </ProfileProvider>
    );
}