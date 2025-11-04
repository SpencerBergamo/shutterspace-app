import { Media } from "@/types/Media";
import { Image } from "expo-image";
import { PlayIcon } from "lucide-react-native";
import { RefObject } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Video, { VideoRef } from "react-native-video";

type VideoStatus = 'loading' | 'ready' | 'playing' | 'paused' | 'error' | null;

interface MediaViewerProps {
    uri: string;
    media: Media;
    onRequestVideoPlayback: () => void;
    videoURL?: string;
    videoStatus?: VideoStatus;
    videoRef?: RefObject<VideoRef>;
}

export default function MediaViewer({
    uri,
    media,
    onRequestVideoPlayback,
    videoURL,
    videoStatus,
    videoRef
}: MediaViewerProps) {
    const isVideo = media.identifier.type === 'video';

    if (videoStatus && videoStatus === 'ready') {
        return (
            <View style={styles.container}>
                <Video
                    ref={videoRef}
                    source={{ uri: videoURL }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="contain"
                    onError={(error) => {
                        console.error('Error playing video: ', error);
                    }}
                    onLoad={() => {
                        console.log('Video loaded');
                    }}
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Image
                source={{ uri, cacheKey: media._id }}
                style={{}}
                contentFit="contain"
                cachePolicy={'disk'}
            />

            {isVideo && (
                <Pressable onPress={onRequestVideoPlayback}>
                    <PlayIcon size={24} color="white" />
                </Pressable>
            )}
        </View>
    )
}

export const styles = StyleSheet.create({
    container: {},

    playIcon: {}
})