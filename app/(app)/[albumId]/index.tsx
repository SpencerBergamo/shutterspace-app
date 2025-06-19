import FloatingActionButton from "@/components/FloatingActionButton";
import Thumbnail from "@/components/Thumbnail";
import { useProfile } from "@/context/ProfileContext";
import { Id } from "@/convex/_generated/dataModel";
import { useAlbums } from "@/hooks/useAlbums";
import { useMedia } from "@/hooks/useMedia";
import { Media } from "@/types/Media";
import { getGridConfig } from "@/utils/getGridConfig";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { Images } from "lucide-react-native";
import { useCallback, useEffect } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native";

export default function AlbumDetailScreen() {

    const navigation = useNavigation();
    const { albumId } = useLocalSearchParams<{ albumId: Id<'albums'> }>();

    const { profile } = useProfile();
    const { getAlbumById } = useAlbums(profile._id);
    const album = getAlbumById(albumId);

    const { media, loadMore, canLoadMore, handleMediaSelection } = useMedia(albumId);

    const { columns, gap, width, height } = getGridConfig({
        columns: 3,
        gap: 2,
        aspectRatio: 1,
    });

    const renderItem = useCallback(({ item, index }: { item: Media, index: number }) => (
        <Pressable onPress={() => {
            if ('status' in item) return;

            router.push({ pathname: './[mediaId]', params: { index } });
        }} >
            <Thumbnail media={item} size={width} />
        </Pressable>
    ), [width, height]);

    const canLoadMoreFooter = useCallback(() => {
        if (!canLoadMore) return null;

        return (
            <View style={styles.footer}>
                <ActivityIndicator size="large" color="white" />
            </View>
        );
    }, []);

    // Set Stack Title
    useEffect(() => {
        if (album) {
            navigation.setOptions({ title: album.title });
        }
    }, [album, navigation]);

    return (
        <View style={styles.container}>
            <FlatList
                data={media}
                keyExtractor={(item) => item.filename}
                numColumns={columns}
                columnWrapperStyle={{ gap: gap }}
                contentContainerStyle={{ gap: gap }}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={canLoadMoreFooter}
                renderItem={renderItem} />

            <FloatingActionButton
                id="fab"
                onPress={handleMediaSelection}
                icon={Images} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    footer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
});

// backgroundColor: '#F2F1F6',