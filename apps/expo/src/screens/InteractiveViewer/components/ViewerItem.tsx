import useSignedUrls from "@/src/hooks/useSignedUrls";
import { Media } from "@/src/types/Media";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, Pressable, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import Video from "react-native-video";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ViewerItemProps {
    media: Media;
    isViewable: boolean;
    onZoomChange?: (isZoomed: boolean) => void;
}

export default function ViewerItem({ media, isViewable, onZoomChange }: ViewerItemProps) {
    const { thumbnail, requestingVideo, requestVideo } = useSignedUrls({ media });

    // Constants
    const type = media.identifier.type;

    // State
    const [videoUrl, setVideoUrl] = useState<string | undefined>(undefined);
    const [isPlaying, setIsPlaying] = useState(false);

    // Zoom state
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);

    // Pause video when not viewable
    useEffect(() => {
        if (!isViewable && videoUrl) {
            setIsPlaying(false);
        }
    }, [isViewable, videoUrl]);

    // Reset zoom when switching items
    useEffect(() => {
        if (!isViewable) {
            scale.value = withTiming(1, { duration: 200 });
            savedScale.value = 1;
            translateX.value = withTiming(0, { duration: 200 });
            translateY.value = withTiming(0, { duration: 200 });
            savedTranslateX.value = 0;
            savedTranslateY.value = 0;
        }
    }, [isViewable]);

    const handleRequestVideo = useCallback(async () => {
        const url = await requestVideo();
        if (url) {
            setVideoUrl(url);
            setIsPlaying(true);
        }
    }, [requestVideo]);

    // Gesture handlers for pinch-to-zoom
    const pinchGesture = Gesture.Pinch()
        .onUpdate((event) => {
            scale.value = savedScale.value * event.scale;
        })
        .onEnd(() => {
            if (scale.value < 1) {
                scale.value = withTiming(1);
                savedScale.value = 1;
                translateX.value = withTiming(0);
                translateY.value = withTiming(0);
                savedTranslateX.value = 0;
                savedTranslateY.value = 0;
                if (onZoomChange) runOnJS(onZoomChange)(false);
            } else {
                savedScale.value = scale.value;
                if (onZoomChange) runOnJS(onZoomChange)(scale.value > 1);
            }
        });

    const panGesture = Gesture.Pan()
        .maxPointers(1)
        .manualActivation(true)
        .onTouchesMove((event, manager) => {
            // Only activate pan gesture when zoomed
            if (savedScale.value > 1) {
                manager.activate();
            } else {
                manager.fail();
            }
        })
        .onUpdate((event) => {
            // Only allow panning when zoomed
            if (savedScale.value > 1) {
                const maxTranslateX = (SCREEN_WIDTH * savedScale.value - SCREEN_WIDTH) / 2;
                const maxTranslateY = (SCREEN_HEIGHT * savedScale.value - SCREEN_HEIGHT) / 2;

                translateX.value = Math.max(
                    -maxTranslateX,
                    Math.min(maxTranslateX, savedTranslateX.value + event.translationX)
                );
                translateY.value = Math.max(
                    -maxTranslateY,
                    Math.min(maxTranslateY, savedTranslateY.value + event.translationY)
                );
            }
        })
        .onEnd(() => {
            if (savedScale.value > 1) {
                savedTranslateX.value = translateX.value;
                savedTranslateY.value = translateY.value;
            }
        });

    const doubleTapGesture = Gesture.Tap()
        .numberOfTaps(2)
        .onEnd(() => {
            if (scale.value > 1) {
                // Reset zoom
                scale.value = withTiming(1);
                savedScale.value = 1;
                translateX.value = withTiming(0);
                translateY.value = withTiming(0);
                savedTranslateX.value = 0;
                savedTranslateY.value = 0;
                if (onZoomChange) runOnJS(onZoomChange)(false);
            } else {
                // Zoom to 2x
                scale.value = withTiming(2);
                savedScale.value = 2;
                if (onZoomChange) runOnJS(onZoomChange)(true);
            }
        });

    // Combine gestures
    const composedGesture = Gesture.Race(
        doubleTapGesture,
        Gesture.Simultaneous(pinchGesture, panGesture)
    );

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { scale: scale.value },
            ],
        };
    });

    if (thumbnail === null) {
        return (
            <View style={styles.container}>
                <Ionicons name="alert-circle-outline" size={24} color="white" />
            </View>
        );
    }

    if (videoUrl) {
        return (
            <View style={styles.container}>
                <Video
                    source={{ uri: videoUrl }}
                    style={styles.video}
                    resizeMode="contain"
                    paused={!isPlaying}
                    controls
                    onError={(error) => {
                        console.error('Video playback error:', error);
                    }}
                    playInBackground={false}
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <GestureDetector gesture={composedGesture}>
                <Animated.View style={[styles.imageContainer, animatedStyle]}>
                    <Image
                        source={{ uri: thumbnail, cacheKey: media._id }}
                        style={styles.image}
                        contentFit="contain"
                        cachePolicy={'memory-disk'}
                        recyclingKey={media._id}
                    />
                </Animated.View>
            </GestureDetector>

            {type === 'video' && !isPlaying && (
                <Pressable
                    onPress={handleRequestVideo}
                    style={styles.playButtonPosition}
                    disabled={requestingVideo}
                >
                    <View style={styles.playButton}>
                        {requestingVideo ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="play-outline" size={32} color="white" />}
                    </View>
                </Pressable>
            )}
        </View>
    );
}

export const styles = StyleSheet.create({
    container: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'black',
    },

    imageContainer: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },

    image: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    },

    playButtonPosition: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },

    playButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },


    video: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        zIndex: 1000,
    },
})
