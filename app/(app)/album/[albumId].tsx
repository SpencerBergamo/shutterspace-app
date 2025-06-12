import FloatingActionButton from "@/app/components/ui/FloatingActionButton";
import { MediaTile } from "@/app/components/ui/MediaTile";
import { Id } from "@/convex/_generated/dataModel";
import { useAlbumMedia } from "@/hooks/useAlbumMedia";
import { useGridConfig } from "@/hooks/useGridConfig";
import { Images } from "lucide-react-native";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";

interface AlbumPageProps {
    albumId: Id<"albums">;
    profileId: Id<"profiles">;
}

export default function AlbumPage({ albumId, profileId }: AlbumPageProps) {
    const { numColumns, spacing, itemSize } = useGridConfig();
    const {
        media,
        canLoadMore,
        loadMore,
        handleMediaSelection,
    } = useAlbumMedia(albumId, profileId);

    const CanLoadMoreFooter = () => {
        if (!canLoadMore) return null;
        return (
            <View style={styles.footer}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <FlatList
                data={media}
                keyExtractor={(item) => item.filename}
                numColumns={numColumns}
                columnWrapperStyle={{ gap: spacing }}
                contentContainerStyle={{ gap: spacing }}
                onEndReached={loadMore}
                onEndReachedThreshold={0.2}
                ListFooterComponent={CanLoadMoreFooter}
                renderItem={({ item }) =>
                    <MediaTile
                        media={item}
                        size={itemSize}
                        onPress={() => { }}
                        onRetry={() => { }}
                    />} />
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
        backgroundColor: '#F2F1F6',
    },
    footer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
});