import { Id } from "@/convex/_generated/dataModel";
import { useMedia } from "@/src/hooks/useMedia";
import ViewerItem from "@/src/screens/InteractiveViewer/components/ViewerItem";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function InteractiveViewerScreen() {
    const { albumId, index } = useLocalSearchParams<{ albumId: Id<'albums'>, index: string }>();
    const { media } = useMedia(albumId);

    // Scroll View State
    const initialIndex = parseInt(index);
    const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
    const [isZoomed, setIsZoomed] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / SCREEN_WIDTH);
        setCurrentIndex(index);
    }, []);

    const hasScrolled = useRef(false);
    const onContentSizeChange = useCallback(() => {
        if (!hasScrolled.current && initialIndex > 0) {
            setTimeout(() => {
                scrollViewRef.current?.scrollTo({
                    x: initialIndex * SCREEN_WIDTH,
                    animated: false,
                });
                hasScrolled.current = true;
            }, 100);
        }
    }, [initialIndex]);

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

            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                scrollEnabled={!isZoomed}
                showsHorizontalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
                onContentSizeChange={onContentSizeChange}
            >
                {media.map((item, index) => (
                    <ViewerItem
                        key={item._id}
                        media={item}
                        isViewable={currentIndex === index}
                        onZoomChange={setIsZoomed}
                    />
                ))}
            </ScrollView>
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
});
