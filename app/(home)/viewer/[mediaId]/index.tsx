import ViewerItem from "@/components/media/ViewerItem";
import { Id } from "@/convex/_generated/dataModel";
import { useMedia } from "@/hooks/useMedia";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function MediaViewerScreen() {
    const { albumId, index } = useLocalSearchParams<{ albumId: Id<'albums'>, index: string }>();
    const { media } = useMedia(albumId);

    // Scroll View State
    const initialIndex = parseInt(index);
    const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
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
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    headerTitle: `${currentIndex + 1} / ${media.length}`,
                    headerTransparent: true,
                    headerTintColor: 'white',
                    headerStyle: {
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    },
                }}
            />

            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
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
                    />
                ))}
            </ScrollView>
        </View>
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
