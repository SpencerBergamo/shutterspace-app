import { useProfile } from "@/context/ProfileContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMedia } from "@/hooks/useMedia";
import { Media } from "@/types/Media";
import { FlashList } from "@shopify/flash-list";
import { useAction } from "convex/react";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import { Play } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, Pressable, StyleSheet, View, ViewToken } from "react-native";
import Video, { VideoRef } from "react-native-video";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type VideoState = {
    [mediaId: string]: {
        url?: string;
        isLoading: boolean;
        isPlaying: boolean;
    };
};

export default function MediaViewerScreen() {
    const { profileId } = useProfile();
    const { mediaId, albumId } = useLocalSearchParams<{ mediaId: Id<'media'>, albumId: Id<'albums'> }>();
    const { media } = useMedia(albumId);

    const requestVideoPlaybackURL = useAction(api.cloudflare.requestVideoPlaybackURL);

    // Scroll View State
    const initialIndex = media.findIndex(m => m._id === mediaId);
    const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);

    // Video State
    const [videoStates, setVideoStates] = useState<VideoState>({});
    const videoRefs = useRef<{ [key: string]: VideoRef | null }>({});

    // Image URIs cache
    const [imageURIs, setImageURIs] = useState<{ [mediaId: string]: string }>({});

    // Load cached image URIs on mount
    useEffect(() => {
        const loadCachedURIs = async () => {
            const uris: { [mediaId: string]: string } = {};

            for (const item of media) {
                try {
                    const localUri = await Image.getCachePathAsync(item._id);
                    if (localUri) {
                        uris[item._id] = localUri;
                    } else {
                        uris[item._id] = "https://placehold.co/600x400";
                    }
                } catch (e) {
                    console.error('Error loading cached URI:', e);
                }
            }

            setImageURIs(uris);
        };

        loadCachedURIs();
    }, [media, albumId, profileId]);

    const handleRequestVideoPlayback = useCallback(async (item: Media) => {
        if (item.identifier.type !== 'video') return;

        const mediaId = item._id;
        const videoUID = item.identifier.videoUid;

        // Set loading state
        setVideoStates(prev => ({
            ...prev,
            [mediaId]: { ...prev[mediaId], isLoading: true }
        }));

        try {
            const playbackUrl = await requestVideoPlaybackURL({
                albumId,
                videoUID
            });

            if (playbackUrl) {
                setVideoStates(prev => ({
                    ...prev,
                    [mediaId]: {
                        url: playbackUrl,
                        isLoading: false,
                        isPlaying: true
                    }
                }));
            }
        } catch (error) {
            console.error('Error fetching video playback URL:', error);
            setVideoStates(prev => ({
                ...prev,
                [mediaId]: { ...prev[mediaId], isLoading: false }
            }));
        }
    }, [albumId, profileId, requestVideoPlaybackURL]);

    const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index || 0);

            // Pause all videos except the current one
            Object.entries(videoRefs.current).forEach(([key, ref]) => {
                if (ref && key !== viewableItems[0].key) {
                    setVideoStates(prev => ({
                        ...prev,
                        [key]: { ...prev[key], isPlaying: false }
                    }));
                }
            });
        }
    }, []);

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50
    }).current;

    const renderMedia = useCallback(({ item }: { item: Media }) => {
        const uri = imageURIs[item._id];
        const isVideo = item.identifier.type === 'video';
        const videoState = videoStates[item._id];
        const hasVideoUrl = videoState?.url;

        return (
            <View style={styles.mediaContainer}>
                {!hasVideoUrl && (
                    <Image
                        source={{ uri, cacheKey: item._id }}
                        style={styles.image}
                        contentFit="contain"
                        cachePolicy={'memory-disk'}
                    />
                )}

                {hasVideoUrl && (
                    <Video
                        ref={(ref) => {
                            if (ref) videoRefs.current[item._id] = ref;
                        }}
                        source={{
                            uri: videoState.url,
                            type: 'video/mp4'
                        }}
                        style={styles.video}
                        resizeMode="contain"
                        paused={!videoState.isPlaying}
                        controls
                        onError={(error) => {
                            console.error('Video playback error:', error);
                        }}
                        // Cache the video for offline playback since URLs expire in 1 hour
                        ignoreSilentSwitch="ignore"
                        playInBackground={false}
                        playWhenInactive={false}
                    />
                )}

                {isVideo && !hasVideoUrl && (
                    <View style={styles.playButtonContainer}>
                        <Pressable
                            style={styles.playButton}
                            onPress={() => handleRequestVideoPlayback(item)}
                            disabled={videoState?.isLoading}
                        >
                            {videoState?.isLoading ? (
                                <ActivityIndicator size="large" color="white" />
                            ) : (
                                <Play size={64} color="white" fill="white" />
                            )}
                        </Pressable>
                    </View>
                )}
            </View>
        );
    }, [imageURIs, videoStates, handleRequestVideoPlayback]);

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    headerTitle: `${currentIndex + 1} / ${media.length}`,
                    headerStyle: { backgroundColor: 'black' },
                    headerTintColor: 'white',
                }}
            />

            <FlashList
                data={media}
                renderItem={renderMedia}
                keyExtractor={(item) => item._id}
                horizontal
                pagingEnabled
                estimatedItemSize={SCREEN_WIDTH}
                initialScrollIndex={initialIndex >= 0 ? initialIndex : 0}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                showsHorizontalScrollIndicator={false}
            />
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
