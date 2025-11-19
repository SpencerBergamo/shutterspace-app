import { ProfileProvider } from "@/context/ProfileContext";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { useTheme } from "@react-navigation/native";
import { Stack } from "expo-router";

function HomeLayout() {
    const theme = useTheme();
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

            <Stack.Screen name="viewer/[mediaId]/index" options={{
                headerShown: true,
            }} />

            <Stack.Screen name="(profile)/edit" options={{
                headerTitle: 'Edit Profile',
                headerBackButtonDisplayMode: 'minimal',
            }} />
        </Stack>
    );
}


export default function Layout() {
    return (
        <ProfileProvider>
            <ActionSheetProvider>
                <HomeLayout />
            </ActionSheetProvider>
        </ProfileProvider>
    );
}