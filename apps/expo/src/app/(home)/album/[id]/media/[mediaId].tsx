import { GalleryViewer } from "@/src/components/gallery";
import { useAlbumGallery } from "@/src/context/AlbumGalleryContext";
import { Id } from "@shutterspace/backend/convex/_generated/dataModel";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function AlbumMediaViewerScreen() {
    const { mediaId } = useLocalSearchParams<{ mediaId: string }>();
    const currentMediaId = mediaId as Id<"media">;
    const { albumId, media, loadMore, isLoading, status, prefetchDelivery } =
        useAlbumGallery();

    const initialIndex = useMemo(() => {
        const index = media.findIndex((item) => item._id === currentMediaId);
        return index >= 0 ? index : 0;
    }, [media, currentMediaId]);

    useEffect(() => {
        if (media.length === 0) return;
        const neighborIds = media
            .slice(Math.max(0, initialIndex - 2), initialIndex + 3)
            .map((m) => m._id);
        void prefetchDelivery(neighborIds);
    }, [media, initialIndex, prefetchDelivery]);

    const handleIndexChange = useCallback(
        (index: number) => {
            const next = media[index];
            if (!next || next._id === currentMediaId) return;
            router.setParams({ mediaId: next._id });

            const neighborIds = media
                .slice(Math.max(0, index - 2), index + 3)
                .map((m) => m._id);
            void prefetchDelivery(neighborIds);
        },
        [media, currentMediaId, prefetchDelivery],
    );

    const mediaReady =
        media.length > 0 && media.some((item) => item._id === currentMediaId);
    const notFound = !mediaReady && status === "Exhausted" && !isLoading;

    return (
        <>
            <Stack.Screen
                options={{
                    headerTransparent: true,
                    headerShadowVisible: false,
                    headerTintColor: "#fff",
                    headerBackButtonMenuEnabled: false,
                    title: "",
                    contentStyle: { backgroundColor: "#000" },
                }}
            />
            <Stack.Toolbar placement="left">
                <Stack.Toolbar.Button
                    icon="xmark"
                    onPress={() => {
                        if (router.canGoBack()) router.back();
                        else router.replace(`/album/${albumId}`);
                    }}
                />
            </Stack.Toolbar>
            <Stack.Toolbar placement="right">
                <Stack.Toolbar.Menu icon="ellipsis" >
                    <Stack.Toolbar.MenuAction icon="square.and.arrow.up" onPress={() => { }}>
                        Share Photo
                    </Stack.Toolbar.MenuAction>
                    <Stack.Toolbar.MenuAction icon="trash" onPress={() => { }}>
                        Delete Photo
                    </Stack.Toolbar.MenuAction>
                    <Stack.Toolbar.MenuAction icon="flag" onPress={() => { }}>
                        Flag Inappropriate
                    </Stack.Toolbar.MenuAction>
                </Stack.Toolbar.Menu>
            </Stack.Toolbar>

            {notFound ? (
                <View style={styles.center}>
                    <Text selectable style={styles.message}>
                        Media not found.
                    </Text>
                </View>
            ) : !mediaReady ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#fff" />
                </View>
            ) : (
                <GalleryViewer
                    media={media}
                    initialIndex={initialIndex}
                    onIndexChange={handleIndexChange}
                    onNearEnd={loadMore}
                />
            )}
        </>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        backgroundColor: "#000",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 32,
    },
    message: {
        color: "#fff",
        fontSize: 16,
        textAlign: "center",
    },
});
