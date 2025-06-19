import { DbMedia } from "@/types/Media";
import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { View } from "lucide-react-native";
import { ActivityIndicator, StyleSheet } from "react-native";


export default function VideoPlayer({ media }: { media: DbMedia }) {
    const player = useVideoPlayer(media.downloadUrl, player => {
        player.play();
    });

    const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
    const { status } = useEvent(player, 'statusChange', { status: player.status });


    return (
        <View style={styles.videoContainer}>
            <VideoView
                style={styles.video}
                player={player}
                contentFit="contain" />

            {status === 'loading' && (
                <ActivityIndicator
                    style={{ position: 'absolute' }}
                    size="large"
                    color="white" />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    videoContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    video: {
        width: '100%',
        height: '100%',
    },
})