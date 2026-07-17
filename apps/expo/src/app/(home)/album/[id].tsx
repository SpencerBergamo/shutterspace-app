import { GalleryGrid } from "@/src/components/gallery/gallery-grid";
import { useAppTheme } from "@/src/context/AppThemeContext";
import { useAlbumMedia } from "@/src/hooks/useAlbumMedia";
import { api } from "@shutterspace/backend/convex/_generated/api";
import { Id } from "@shutterspace/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { router, Stack, useLocalSearchParams } from "expo-router";
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
            <Stack.Screen
                options={{
                    title: album.title,
                    headerTransparent: true,
                    headerShadowVisible: false,
                }}
            />

            <Stack.Toolbar placement="right">
                {/* Sort */}
                <Stack.Toolbar.Menu icon="line.3.horizontal.decrease">
                    <Stack.Toolbar.MenuAction icon="camera" onPress={() => { }}>
                        Captured
                    </Stack.Toolbar.MenuAction>
                    <Stack.Toolbar.MenuAction icon="clock" onPress={() => { }}>
                        Added
                    </Stack.Toolbar.MenuAction>
                </Stack.Toolbar.Menu>

                {/* Settings */}
                <Stack.Toolbar.Menu icon="ellipsis">
                    <Stack.Toolbar.MenuAction
                        icon="square.and.pencil"
                        onPress={() => router.push(`/(home)/album/${albumId}/settings`)}
                    >
                        Edit Album
                    </Stack.Toolbar.MenuAction>
                </Stack.Toolbar.Menu>
            </Stack.Toolbar>

            <GalleryGrid
                albumId={albumId}
                cover={album.cover}
                media={media}
                status={status}
                onEndReached={loadMore}
                style={{}}
            />

            {/* {isLoading && media.length === 0 ? (
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
                    cover={album.cover}
                    media={media}
                    status={status}
                    onEndReached={loadMore}
                />
            )} */}
        </>
    );
}
