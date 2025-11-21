import useSignedUrls from "@/hooks/useSignedUrls";
import { Media } from "@/types/Media";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useCallback, useEffect, useState } from "react";
import { Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";
import Video from "react-native-video";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ViewerItemProps {
    media: Media;
    isViewable: boolean;
}

export default function ViewerItem({ media, isViewable }: ViewerItemProps) {
    const { thumbnail, requestVideo } = useSignedUrls({ media });

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

    const renderImage = useCallback(() => {
        return (
            <View style={styles.container}>
                <Image
                    source={{ uri: thumbnail, cacheKey: media._id }}
                    style={styles.image}
                    contentFit="contain"
                    cachePolicy={'memory-disk'}
                />

                {type === 'video' && !isPlaying && (
                    <TouchableOpacity
                        onPress={handleRequestVideo}
                    >
                        <Ionicons name="play-circle-outline" size={24} color="white" />
                    </TouchableOpacity>
                )}
            </View>
        );
    }, [thumbnail, type, isPlaying, handleRequestVideo]);

    const renderVideo = useCallback(() => {
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
                    ignoreSilentSwitch="ignore"
                    playInBackground={false}
                />
            </View>
        );
    }, [videoUrl, isPlaying]);

    if (!thumbnail) {
        return (
            <View style={styles.container}>
                <Ionicons name="alert-outline" size={24} color="red" />
            </View>
        );
    }

    return videoUrl ? renderVideo() : renderImage();
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

    video: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        zIndex: 1000,
    },
})
