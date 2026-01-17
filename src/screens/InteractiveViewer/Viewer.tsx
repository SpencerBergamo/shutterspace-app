import { Id } from "@/convex/_generated/dataModel";
import { useMedia } from "@/src/hooks/useMedia";
import ViewerItem from "@/src/screens/InteractiveViewer/components/ViewerItem";
import { FlashList } from "@shopify/flash-list";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function InteractiveViewerScreen() {
    // const insets = useSafeAreaInsets();
    const { albumId, index } = useLocalSearchParams<{ albumId: Id<'albums'>, index: string }>();
    const { media } = useMedia(albumId);
    // const profile = useQuery(api.profile.getUserProfile);
    // const membership = useQuery(api.albumMembers.getMembership, { albumId });
    // const deleteMedia = useAction(api.media.deleteMedia);

    // Scroll View State
    const initialIndex = parseInt(index);
    const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
    const [isZoomed, setIsZoomed] = useState(false);
    // const [isDeleting, setIsDeleting] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    const mediaIds = useMemo(() => media?.map(m => m._id) || [], [media]);

    const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / SCREEN_WIDTH);
        setCurrentIndex(index);
    }, []);

    const hasScrolled = useRef(false);

    const onContentSizeChange = useCallback(() => {
        if (!hasScrolled.current && initialIndex > 0) {
            hasScrolled.current = true;

            scrollViewRef.current?.scrollTo({
                x: initialIndex * SCREEN_WIDTH,
                animated: false,
            });
        }
    }, [initialIndex]);

    // const currentMedia = media?.[currentIndex];
    // const canDelete = membership === 'host' || membership === 'moderator' || currentMedia?.createdBy === profile?._id;

    // const handleDelete = useCallback(async () => {
    //     if (!currentMedia || !canDelete) return;
    //     try {
    //         if (!media) return;

    //         if (media?.length === 1) {
    //             await deleteMedia({ albumId, mediaId: currentMedia._id });
    //             router.back();
    //             return;
    //         }

    //         const nextIndex = currentIndex >= media.length - 1 ? currentIndex - 1 : currentIndex;

    //         await deleteMedia({ albumId, mediaId: currentMedia._id });

    //         setTimeout(() => {
    //             scrollViewRef.current?.scrollTo({
    //                 x: nextIndex * SCREEN_WIDTH,
    //                 animated: false,
    //             });
    //             setCurrentIndex(nextIndex);
    //         }, 100);
    //     } catch (error) {
    //         console.error('Failed to delete media:', error);
    //         Alert.alert("Error", "Failed to delete media. Please try again.");
    //     } finally {
    //         setIsDeleting(false);
    //     }

    // }, [currentMedia, canDelete, media?.length, currentIndex, deleteMedia, albumId]);

    if (!media) return null;

    return (
        <GestureHandlerRootView style={styles.container}>
            <Stack.Screen
                options={{
                    headerTitle: `${currentIndex + 1} / ${media.length}`,
                    headerTransparent: true,
                    headerTintColor: 'white',
                    headerStyle: {
                        backgroundColor: 'transparent',
                    },
                }}
            />

            <FlashList
                data={mediaIds}
                keyExtractor={(item) => item}
                horizontal
                pagingEnabled
                initialScrollIndex={initialIndex}
                estimatedItemSize={SCREEN_WIDTH}
                estimatedListSize={{
                    width: SCREEN_WIDTH,
                    height: SCREEN_HEIGHT,
                }}
                getItemType={() => 'media'}
                onScroll={onScroll}
                scrollEventThrottle={16}
                onContentSizeChange={onContentSizeChange}
                scrollEnabled={!isZoomed}
                renderItem={({ item }) => {
                    const mediaItem = media?.find(m => m._id === item);

                    if (!mediaItem) return null;

                    return (
                        <ViewerItem
                            key={mediaItem._id}
                            media={mediaItem}
                            isViewable={currentIndex === mediaIds.indexOf(item)}
                            onZoomChange={setIsZoomed}
                        />
                    );
                }}
            />

            {/* <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                scrollEnabled={!isZoomed}
                showsHorizontalScrollIndicator={false}
                onContentSizeChange={onContentSizeChange}
                onScroll={onScroll}
                scrollEventThrottle={16}
            >
                {media.map((item, index) => (
                    <ViewerItem
                        key={item._id}
                        media={item}
                        isViewable={currentIndex === index}
                        onZoomChange={setIsZoomed}
                    />
                ))}
            </ScrollView> */}

            {/* <View style={[styles.bottomBar, { bottom: insets.bottom }]}>
                <Ionicons name="download-outline" size={24} color="white" />
                <Pressable
                    disabled={!canDelete || isDeleting}
                    onPress={() => {
                        Alert.alert("Delete Media", "Are you sure you want to delete this item?", [
                            { text: "Cancel", style: "cancel" },
                            {
                                text: "Delete",
                                style: "destructive",
                                onPress: handleDelete,
                            },
                        ]);
                    }} >
                    <Ionicons
                        name="trash-outline"
                        size={24}
                        color={canDelete && !isDeleting ? "#FF3B30" : "#666666"}
                    />
                </Pressable>
            </View> */}
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    mediaContainer: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'black',
    },
    image: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    },
    video: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    },
    playButtonContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    bottomBar: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: 0,
        left: 16,
        right: 16,
        justifyContent: 'space-evenly',
        alignItems: 'center',
    },
});
