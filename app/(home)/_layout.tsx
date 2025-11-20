import { FriendsProvider, useFriends } from "@/context/FriendsContext";
import { ProfileProvider, useProfile } from "@/context/ProfileContext";
import useAppStyles from "@/hooks/useAppStyles";
// import { useTheme } from "@react-navigation/native";
import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";

function HomeLayout() {
    const appStyles = useAppStyles();

    const { isLoading: profileLoading } = useProfile();
    const { isLoading: friendsLoading } = useFriends();

    if (profileLoading || friendsLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={appStyles.colorScheme.text} />
            </View>
        )
    }

    return (
        <Stack screenOptions={{
            headerBackButtonDisplayMode: 'minimal',
            headerShadowVisible: false,
            headerStyle: {
                backgroundColor: appStyles.colorScheme.background,
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

            <Stack.Screen name="viewer/[mediaId]/index" options={{
                headerShown: true,
            }} />

            <Stack.Screen name="(profile)/edit" options={{
                headerTitle: 'Edit Profile',
                headerBackButtonDisplayMode: 'minimal',
            }} />

            <Stack.Screen name="manage-friends" options={{
                headerTitle: 'My Friends',
            }} />
        </Stack>
    );
}


export default function Layout() {
    return (
        <ProfileProvider>
            <FriendsProvider>
                <HomeLayout />
            </FriendsProvider>
        </ProfileProvider>
    );
}