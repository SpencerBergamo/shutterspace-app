import AlbumCard from "@/components/albums/AlbumCard";
import HomeScreenHeader from "@/components/HomeScreenHeader";
import { useProfile } from "@/context/ProfileContext";
import { useTheme } from "@/context/ThemeContext";
import { useAlbums } from "@/hooks/useAlbums";
import { getGridConfig } from "@/utils/getGridConfig";
import { router, useNavigation } from "expo-router";
import { Plus } from "lucide-react-native";
import { useMemo } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
    const { top } = useSafeAreaInsets();
    const { theme } = useTheme();
    const navigation = useNavigation();
    const { profile } = useProfile();
    const { albums, isLoading } = useAlbums();

    const gridConfig = getGridConfig({ columns: 2, gap: 16 });

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
            numColumns={gridConfig.columns}
            columnWrapperStyle={{ gap: gridConfig.gap }}
            contentContainerStyle={{ padding: 16, gap: gridConfig.gap }}
            renderItem={({ item }) => (
                <AlbumCard
                    album={item}
                    width={gridConfig.width}
                    height={gridConfig.height} />
            )} />

    }, [profile, isLoading, albums]);

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <HomeScreenHeader />

            {renderContent}

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