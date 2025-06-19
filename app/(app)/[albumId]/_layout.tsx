

import { defaultScreenOptions } from '@/components/navigation';
import { AlbumProvider } from '@/context/AlbumContext';
import { useProfile } from '@/context/ProfileContext';
import { Id } from '@/convex/_generated/dataModel';
import { useAlbums } from '@/hooks/useAlbums';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from "expo-router";
import { TouchableOpacity } from "react-native";

export default function AlbumLayout() {
    const { albumId } = useLocalSearchParams<{ albumId: Id<'albums'> }>();
    const { profile } = useProfile();
    const { getAlbumById } = useAlbums(profile._id);
    const album = getAlbumById(albumId);

    return (
        <AlbumProvider albumId={albumId} album={album}>
            <Stack screenOptions={defaultScreenOptions}>
                <Stack.Screen
                    name="index"
                    options={{
                        title: album.title,
                        headerLeft: () => (
                            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16 }}>
                                <Ionicons name="arrow-back" size={24} color="black" />
                            </TouchableOpacity>
                        ),
                        headerRight: () => (
                            <TouchableOpacity style={{ marginRight: 16 }}>
                                <Ionicons name="ellipsis-horizontal" size={24} color="black" />
                            </TouchableOpacity>
                        )
                    }}
                />
                <Stack.Screen
                    name="[mediaId]"
                    options={{
                        headerShown: false,
                        headerLeft: () => (
                            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16 }}>
                                <Ionicons name="arrow-back" size={24} color="black" />
                            </TouchableOpacity>
                        )
                    }}
                />
            </Stack>
        </AlbumProvider>
    );
}
