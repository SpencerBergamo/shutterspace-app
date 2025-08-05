
import { Id } from "@/convex/_generated/dataModel";
import { useAlbums } from "@/hooks/useAlbums";
import { Stack, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";


export default function AlbumSettingsScreen() {
    const { albumId } = useLocalSearchParams<{ albumId: Id<'albums'> }>();
    const { getAlbumById } = useAlbums();
    const album = getAlbumById(albumId);

    if (!album) return null;

    return (
        <View>
            <Stack.Screen options={{
                headerBackButtonDisplayMode: 'minimal',
                headerTitle: album.title,
            }} />

            <Text>Album Settings</Text>
        </View>
    );
}