import { ProfileProvider } from "@/context/ProfileContext";
import useAppStyles from "@/hooks/useAppStyles";
// import { useTheme } from "@react-navigation/native";
import { Stack } from "expo-router";

function HomeLayout() {
    const appStyles = useAppStyles();

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
        </Stack>
    );
}


export default function Layout() {
    return (
        <ProfileProvider>
            <HomeLayout />
        </ProfileProvider>
    );
}