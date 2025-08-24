import AlbumCard from "@/components/albums/AlbumCard";
import HomeScreenHeader from "@/components/HomeScreenHeader";
import { useTheme } from "@/context/ThemeContext";
import { useAlbums } from "@/hooks/useAlbums";
import getGridLayout from "@/utils/getGridLyout";
import { router } from "expo-router";
import { Plus } from "lucide-react-native";
import { useMemo } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

export default function HomeScreen() {
    const { width } = useWindowDimensions();
    const { theme } = useTheme();
    const { albums, isLoading } = useAlbums();

    // const gridConfig = getGridLayout({ columns: 2, gap: 16, aspectRatio: 1 });
    const gridConfig = useMemo(() => getGridLayout({ width, columns: 2, gap: 16, aspectRatio: 1 }), [width]);

    const renderContent = useMemo(() => {
        if (isLoading) {
            return (
                <View style={{ flex: 1 }}>
                    <ActivityIndicator size="large" />
                </View>
            );
        }

        if (albums.length === 0) {
            return (
                <View style={{ flex: 1, justifyContent: 'center', alignContent: 'center' }}>
                    <Text>No albums found</Text>
                </View>
            );
        }

        return <FlatList
            data={albums}
            keyExtractor={(item) => item._id}
            numColumns={gridConfig.numColumns}
            columnWrapperStyle={gridConfig.columnWrapperStyle}
            contentContainerStyle={gridConfig.contentContainerStyle}

            renderItem={({ item }) => (
                <AlbumCard
                    album={item}
                    width={gridConfig.tileWidth}
                    height={gridConfig.tileHeight} />
            )} />

    }, [gridConfig]);

    const renderAlbumList = useMemo(() => {
        if (albums.length === 0) {
            return <Text>No albums found</Text>
        }

        return <FlatList
            data={albums}
            keyExtractor={(item) => item._id}
            numColumns={gridConfig.numColumns}
            columnWrapperStyle={gridConfig.columnWrapperStyle}
            contentContainerStyle={gridConfig.contentContainerStyle}
            renderItem={({ item }) => (
                <AlbumCard album={item} width={gridConfig.tileWidth} height={gridConfig.tileHeight} />
            )} />
    }, [albums, gridConfig]);

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <HomeScreenHeader />

            {isLoading ? (
                <ActivityIndicator size="large" color="black" />
            ) : (
                renderAlbumList
            )}

            {/* Floating Action Button */}
            <Pressable onPress={() => router.push('/new-album')} style={theme.styles.fab}>
                <Plus size={24} color={theme.colors.secondary} />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});