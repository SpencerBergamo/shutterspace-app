import { Id } from "@/convex/_generated/dataModel";
import { Media } from "@/types/Media";
import { Image } from "expo-image";
import { CloudAlert, Play } from "lucide-react-native";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

interface MediaTileProps {
    media: Media;
    onPress: (mediaId: Id<'media'>) => void;
    onDelete: (mediaId: Id<'media'>) => void;
    onError: () => void;
}


export default function MediaTile({ media, onPress, onDelete, onError }: MediaTileProps) {

    const mediaId = media._id;
    const uri = media.uri;
    const type = media.identifier.type;
    const status = media.status;

    if (status === 'error') {
        return (
            <View style={styles.container}>
                <CloudAlert size={24} color="red" />
            </View>
        );
    }

    return (
        <Pressable style={styles.container} onPress={() => onPress(mediaId)} onLongPress={() => onDelete(mediaId)}>
            <Image
                source={{ uri }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                onError={(e) => {
                    console.error(`Error loading uri for media ${mediaId}: ${e}`);
                }}
            />

            {status === 'pending' && (
                <ActivityIndicator size="small" color="white" />
            )}

            {type === 'video' && (
                <View style={styles.videoIconPosition}>
                    <Play size={24} color="white" />
                </View>
            )}

        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        position: 'relative',
        borderRadius: 4,
    },

    stackContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },

    videoIconPosition: {
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        padding: 12,
    }
});