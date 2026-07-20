import { GalleryGrid } from "@/src/components/gallery/gallery-grid";
import { useAlbumGallery } from "@/src/context/AlbumGalleryContext";
import { useAppTheme } from "@/src/context/AppThemeContext";
import { router, Stack } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

function AlbumBackButton() {
    return (
        <Stack.Toolbar placement="left">
            <Stack.Toolbar.Button
                icon="chevron.left"
                accessibilityLabel="Back"
                onPress={() => {
                    if (router.canGoBack()) router.back();
                    else router.replace("/(home)/albums");
                }}
            />
        </Stack.Toolbar>
    );
}

export default function AlbumDetailScreen() {
    const { colors } = useAppTheme();
    const { albumId, album, media, status, loadMore } = useAlbumGallery();

    if (album === undefined) {
        return (
            <>
                <Stack.Screen options={{ headerLargeTitleEnabled: false, title: "Album" }} />
                <AlbumBackButton />
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
                <AlbumBackButton />
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

            <AlbumBackButton />

            <Stack.Toolbar placement="right">
                <Stack.Toolbar.Menu icon="line.3.horizontal.decrease">
                    <Stack.Toolbar.MenuAction icon="camera" onPress={() => { }}>
                        Captured
                    </Stack.Toolbar.MenuAction>
                    <Stack.Toolbar.MenuAction icon="clock" onPress={() => { }}>
                        Added
                    </Stack.Toolbar.MenuAction>
                </Stack.Toolbar.Menu>

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
        </>
    );
}
