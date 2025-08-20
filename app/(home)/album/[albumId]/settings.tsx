
import { useTheme } from "@/context/ThemeContext";
import { Id } from "@/convex/_generated/dataModel";
import { useAlbums } from "@/hooks/useAlbums";
import { Stack, useLocalSearchParams } from "expo-router";
import { View } from "react-native";

export default function AlbumSettingsScreen() {
    const { theme } = useTheme();
    const { albumId } = useLocalSearchParams<{ albumId: Id<'albums'> }>();
    const { getAlbumById } = useAlbums();
    const album = getAlbumById(albumId);

    if (!album) return null;

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <Stack.Screen options={{
                headerBackButtonDisplayMode: 'minimal',
                headerTitle: "Settings",
            }} />

            <View></View>
        </View>
    );
}