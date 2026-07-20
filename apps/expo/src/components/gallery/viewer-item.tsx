import useMediaDelivery from "@/src/hooks/useMediaDelivery";
import { Media } from "@shutterspace/backend/types/Media";
import { Image } from "expo-image";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import Video from "react-native-video";

interface ViewerItemProps {
    media: Media;
    isViewable: boolean;
    width: number;
    height: number;
    onZoomChange?: (isZoomed: boolean) => void;
}

export function ViewerItem({
    media,
    isViewable,
    width,
    height,
    onZoomChange,
}: ViewerItemProps) {
    const { thumbnail, requesting, requestingVideo, requestVideo, handleImageError } =
        useMediaDelivery({ media });

    const type = media.identifier.type;
    const [videoUrl, setVideoUrl] = useState<string | undefined>(undefined);
    const [isPlaying, setIsPlaying] = useState(false);

    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);

    const notifyZoom = useCallback(
        (zoomed: boolean) => {
            onZoomChange?.(zoomed);
        },
        [onZoomChange],
    );

    useEffect(() => {
        if (!isViewable && videoUrl) {
            setIsPlaying(false);
        }
    }, [isViewable, videoUrl]);

    useEffect(() => {
        if (!isViewable) {
            scale.value = withTiming(1, { duration: 200 });
            savedScale.value = 1;
            translateX.value = withTiming(0, { duration: 200 });
            translateY.value = withTiming(0, { duration: 200 });
            savedTranslateX.value = 0;
            savedTranslateY.value = 0;
            notifyZoom(false);
        }
    }, [isViewable, notifyZoom, scale, savedScale, translateX, translateY, savedTranslateX, savedTranslateY]);

    const handleRequestVideo = useCallback(async () => {
        const url = await requestVideo();
        if (url) {
            setVideoUrl(url);
            setIsPlaying(true);
        }
    }, [requestVideo]);

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
                runOnJS(notifyZoom)(false);
            } else {
                savedScale.value = scale.value;
                runOnJS(notifyZoom)(scale.value > 1);
            }
        });

    const panGesture = Gesture.Pan()
        .maxPointers(1)
        .manualActivation(true)
        .onTouchesMove((_event, manager) => {
            if (savedScale.value > 1) {
                manager.activate();
            } else {
                manager.fail();
            }
        })
        .onUpdate((event) => {
            if (savedScale.value > 1) {
                const maxTranslateX = (width * savedScale.value - width) / 2;
                const maxTranslateY = (height * savedScale.value - height) / 2;

                translateX.value = Math.max(
                    -maxTranslateX,
                    Math.min(maxTranslateX, savedTranslateX.value + event.translationX),
                );
                translateY.value = Math.max(
                    -maxTranslateY,
                    Math.min(maxTranslateY, savedTranslateY.value + event.translationY),
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
                scale.value = withTiming(1);
                savedScale.value = 1;
                translateX.value = withTiming(0);
                translateY.value = withTiming(0);
                savedTranslateX.value = 0;
                savedTranslateY.value = 0;
                runOnJS(notifyZoom)(false);
            } else {
                scale.value = withTiming(2);
                savedScale.value = 2;
                runOnJS(notifyZoom)(true);
            }
        });

    const composedGesture = Gesture.Race(
        doubleTapGesture,
        Gesture.Simultaneous(pinchGesture, panGesture),
    );

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
        ],
    }));

    if (thumbnail === null) {
        return (
            <View style={[styles.container, { width, height }]}>
                <Image
                    source="sf:exclamationmark.circle"
                    style={styles.errorIcon}
                    tintColor="white"
                />
            </View>
        );
    }

    if (videoUrl) {
        return (
            <View style={[styles.container, { width, height }]}>
                <Video
                    source={{ uri: videoUrl }}
                    style={{ width, height }}
                    resizeMode="contain"
                    paused={!isPlaying || !isViewable}
                    controls
                    onError={(error) => {
                        console.error("Video playback error:", error);
                    }}
                    playInBackground={false}
                />
            </View>
        );
    }

    return (
        <View style={[styles.container, { width, height }]}>
            <GestureDetector gesture={composedGesture}>
                <Animated.View style={[{ width, height, justifyContent: "center", alignItems: "center" }, animatedStyle]}>
                    {thumbnail ? (
                        <Image
                            source={{ uri: thumbnail, cacheKey: media._id }}
                            style={{ width, height }}
                            contentFit="contain"
                            cachePolicy="memory-disk"
                            recyclingKey={media._id}
                            transition={0}
                            onError={() => {
                                void handleImageError();
                            }}
                        />
                    ) : (
                        <ActivityIndicator size="large" color="white" />
                    )}
                </Animated.View>
            </GestureDetector>

            {requesting && !thumbnail ? (
                <ActivityIndicator
                    style={StyleSheet.absoluteFill}
                    size="large"
                    color="white"
                />
            ) : null}

            {type === "video" && !isPlaying ? (
                <Pressable
                    onPress={handleRequestVideo}
                    style={styles.playButtonPosition}
                    disabled={requestingVideo}
                >
                    <View style={styles.playButton}>
                        {requestingVideo ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Image
                                source="sf:play.fill"
                                style={styles.playIcon}
                                tintColor="white"
                            />
                        )}
                    </View>
                </Pressable>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#000",
    },
    playButtonPosition: {
        ...StyleSheet.absoluteFill,
        justifyContent: "center",
        alignItems: "center",
    },
    playButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    playIcon: {
        width: 28,
        height: 28,
    },
    errorIcon: {
        width: 32,
        height: 32,
    },
});
