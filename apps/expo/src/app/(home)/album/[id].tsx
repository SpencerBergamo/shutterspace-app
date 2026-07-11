import { Gallery } from "@/src/components/gallery";
import { useAppTheme } from "@/src/context/AppThemeContext";
import { useAlbumMedia } from "@/src/hooks/useAlbumMedia";
import { api } from "@shutterspace/backend/convex/_generated/api";
import { Id } from "@shutterspace/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Stack, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";


export default function AlbumDetailScreen() {
    const { colors } = useAppTheme();
    const { id } = useLocalSearchParams<{ id: string }>();
    const albumId = id as Id<"albums">;

    const album = useQuery(api.albums.queryAlbum, albumId ? { albumId } : "skip");
    const { media, status, loadMore, isLoading } = useAlbumMedia(
        album ? albumId : undefined,
    );

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
            <Stack.Screen options={{ title: album.title }} />
            <Stack.Toolbar placement="right">
                <Stack.Toolbar.Button icon="person.badge.plus" onPress={() => { }} />
                <Stack.Toolbar.Menu icon="ellipsis">
                    <Stack.Toolbar.MenuAction icon="info.circle" onPress={() => { }}>
                        Album Info
                    </Stack.Toolbar.MenuAction>
                    <Stack.Toolbar.MenuAction icon="square.and.arrow.up" onPress={() => { }}>
                        Share Album
                    </Stack.Toolbar.MenuAction>
                </Stack.Toolbar.Menu>
            </Stack.Toolbar>

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
                    albumId={albumId}
                    media={media}
                    status={status}
                    onEndReached={loadMore}
                />
            )}
        </>
    );
}
