import { useProfile } from "@/context/ProfileContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMedia } from "@/hooks/useMedia";
import { Media } from "@/types/Media";
import { useAction } from "convex/react";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, View } from "react-native";
import { VideoRef } from "react-native-video";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function MediaViewerScreen() {
    const { profileId } = useProfile();
    const { mediaId, albumId } = useLocalSearchParams<{
        mediaId: Id<'media'>;
        albumId: Id<'albums'>
    }>();
    const { media } = useMedia(albumId);
    const requestVideoPlaybackToken = useAction(api.cloudflare.requestVideoPlaybackToken);

    const [videoTokens, setVideoTokens] = useState<Map<Id<'media'>, string>>(new Map());
    const [activeVideo, setActiveVideo] = useState<Id<'media'> | null>(null);
    const videoRefs = useRef<VideoRef[]>([]);
    const scrollViewRef = useRef<ScrollView>(null);
    const [currentIndex, setCurrentIndex] = useState(0);



    // Find initial index based on mediaId
    useEffect(() => {
        if (media.length > 0 && mediaId) {
            const index = media.findIndex(m => m._id === mediaId);
            if (index !== -1) {
                setCurrentIndex(index);
                // Scroll to the initial media
                setTimeout(() => {
                    scrollViewRef.current?.scrollTo({
                        x: index * SCREEN_WIDTH,
                        animated: false,
                    });
                }, 100);
            }
        }
    }, [mediaId, media]);

    const requestVideoPlayback = useCallback(async (media: Media) => {
        const type = media.identifier.type;
        if (type !== 'video') return;

        try {
            const token = await requestVideoPlaybackToken({ albumId, profileId, videoUID: media.identifier.videoUid });
            const videoUrl = `${process.env.CLOUDFLARE_STREAMS_BASE_URL}/${token}/manifest/video.m3u8`;
            setVideoTokens(prev => prev.set(media._id, videoUrl));
            setActiveVideo(media._id);
        } catch (e) {
            console.error('Error requesting video playback: ', e);
        }
    }, []);

    const handleScroll = (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / SCREEN_WIDTH);
        setCurrentIndex(index);
    };

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    headerTitle: `${currentIndex + 1} / ${media.length}`,
                    headerStyle: { backgroundColor: '#000' },
                    headerTintColor: '#fff',
                }}
            />

            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                style={styles.scrollView}
            >
                {media.map((item, index) => (
                    <></>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    scrollView: {
        flex: 1,
    },
    mediaContainer: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
});