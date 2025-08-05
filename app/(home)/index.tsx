import AlbumCard from "@/components/albums/AlbumCard";
import FloatingButton from "@/components/FloatingButton";
import HomeScreenHeader from "@/components/HomeScreenHeader";
import { useProfile } from "@/context/ProfileContext";
import { useTheme } from "@/context/ThemeContext";
import { useAlbums } from "@/hooks/useAlbums";
import { getGridConfig } from "@/utils/getGridConfig";
import { router, useNavigation } from "expo-router";
import { useCallback } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
    const { top } = useSafeAreaInsets();
    const { themeStyles } = useTheme();
    const navigation = useNavigation();
    const { profile } = useProfile();
    const { albums, isLoading } = useAlbums();

    const gridConfig = getGridConfig({ columns: 2, gap: 16 });

    const renderContent = useCallback(() => {
        if (isLoading) {
            return (
                <View style={{ flex: 1 }}>
                    <ActivityIndicator size="large" />
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
        <View style={styles.container}>

            <HomeScreenHeader />

            {renderContent()}

            {/* Floating Action Button */}
            <FloatingButton
                iconType="plus"
                onPress={() => router.push('/new-album')} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
        justifyContent: "center",
        alignItems: "center",
    },
});