import { Gallery } from "@/src/components/gallery";
import { useAppTheme } from "@/src/context/AppThemeContext";
import { useAlbumMedia } from "@/src/hooks/useAlbumMedia";
import { api } from "@shutterspace/backend/convex/_generated/api";
import { Id } from "@shutterspace/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Stack, useLocalSearchParams, useNavigation } from "expo-router";
import { useCallback, useLayoutEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

export default function AlbumDetailScreen() {
    const { colors } = useAppTheme();
    const navigation = useNavigation();
    const { id } = useLocalSearchParams<{ id: string }>();
    const albumId = id as Id<"albums">;
    const [viewerOpen, setViewerOpen] = useState(false);

    const album = useQuery(api.albums.queryAlbum, albumId ? { albumId } : "skip");
    const { media, status, loadMore, isLoading } = useAlbumMedia(
        album ? albumId : undefined,
    );

    const handleViewerOpenChange = useCallback((open: boolean) => {
        setViewerOpen(open);
    }, []);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: !viewerOpen,
        });
    }, [navigation, viewerOpen]);

    if (album === undefined) {
        return (
            <>
                <Stack.Screen options={{ headerLargeTitleEnabled: false, title: "Album" }} />
                <View style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: colors.background,
                }}>
                    <ActivityIndicator size="large" color={colors.text} />
                </View>
            </>
        );
    }

    if (album === null) {
        return (
            <>
                <Stack.Screen options={{ headerLargeTitleEnabled: false, title: "Album" }} />
                <ScrollView
                    contentInsetAdjustmentBehavior="automatic"
                    contentContainerStyle={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                        paddingHorizontal: 32,
                    }}
                    style={{ flex: 1, backgroundColor: colors.background }}
                >
                    <Text selectable style={{ fontSize: 16, color: colors.caption, textAlign: "center" }}>
                        Album not found or you do not have access.
                    </Text>
                </ScrollView>
            </>
        );
    }

    return (
        <>
            <Stack.Screen options={{
                headerLargeTitleEnabled: false,
                title: album.title,
                headerShown: !viewerOpen,
            }} />
            {isLoading && media.length === 0 ? (
                <View style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: colors.background,
                }}>
                    <ActivityIndicator size="large" color={colors.text} />
                </View>
            ) : (
                <Gallery
                    media={media}
                    status={status}
                    onEndReached={loadMore}
                    onViewerOpenChange={handleViewerOpenChange}
                />
            )}
        </>
    );
}
