import useSignedUrls from "@/hooks/useSignedUrls";
import { Media } from "@/types/Media";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, Pressable, StyleSheet, View } from "react-native";
import Video from "react-native-video";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ViewerItemProps {
    media: Media;
    isViewable: boolean;
}

export default function ViewerItem({ media, isViewable }: ViewerItemProps) {
    const { thumbnail, requestingVideo, requestVideo } = useSignedUrls({ media });

    // Constants
    const type = media.identifier.type;

    // State
    const [videoUrl, setVideoUrl] = useState<string | undefined>(undefined);
    const [isPlaying, setIsPlaying] = useState(false);

    // Pause video when not viewable
    useEffect(() => {
        if (!isViewable && videoUrl) {
            setIsPlaying(false);
        }
    }, [isViewable, videoUrl]);

    const handleRequestVideo = useCallback(async () => {
        const url = await requestVideo();
        if (url) {
            setVideoUrl(url);
            setIsPlaying(true);
        }
    }, [requestVideo]);

    if (!thumbnail) {
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
            <Image
                source={{ uri: thumbnail, cacheKey: media._id }}
                style={styles.image}
                contentFit="contain"
                cachePolicy={'memory-disk'}
            />

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
