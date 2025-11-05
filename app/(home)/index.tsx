import AlbumCard from "@/components/albums/AlbumCard";
import FloatingActionButton from "@/components/FloatingActionButton";
import HomeScreenHeader from "@/components/HomeScreenHeader";
import { useTheme } from "@/context/ThemeContext";
import { useAlbums } from "@/hooks/useAlbums";
import getGridLayout from "@/utils/getGridLyout";
import { router } from "expo-router";
import { Plus } from "lucide-react-native";
import { useMemo } from "react";
import { FlatList, StyleSheet, useWindowDimensions, View } from "react-native";

export default function HomeScreen() {
    const { width } = useWindowDimensions();
    const { theme } = useTheme();
    const { albums, isLoading } = useAlbums();

    const gridConfig = useMemo(() => getGridLayout({ width, columns: 2, gap: 16, aspectRatio: 1 }), [width]);

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <HomeScreenHeader />
            <FlatList
                data={albums}
                keyExtractor={(item) => item._id}
                numColumns={gridConfig.numColumns}
                columnWrapperStyle={gridConfig.columnWrapperStyle}
                contentContainerStyle={gridConfig.contentContainerStyle}
                style={{ padding: 16 }}
                ListEmptyComponent={
                    <View></View>
                }
                renderItem={({ item }) => (
                    <AlbumCard
                        album={item}
                        width={gridConfig.tileWidth}
                        height={gridConfig.tileHeight} />
                )}
            />

            <FloatingActionButton
                render={() => <Plus size={24} color="white" />}
                onPress={() => router.push('/new-album')}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});