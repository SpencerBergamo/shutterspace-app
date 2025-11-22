import { Id } from "@/convex/_generated/dataModel";
import useSignedUrls from "@/hooks/useSignedUrls";
import { Media } from "@/types/Media";
import { Ionicons } from "@expo/vector-icons";
import { Image } from 'expo-image';
import { Play } from "lucide-react-native";
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from "react-native";

interface MediaTileProps {
    media: Media;
    itemSize: number;
    onPress: (mediaId: Id<'media'>) => void;
    onLongPress: (mediaId: Id<'media'>) => void;
    onReady: (mediaId: Id<'media'>) => void;
    retry: (mediaId: Id<'media'>) => void;
    placeholderUri?: string;
}

export default function MediaTile({ media, itemSize, onPress, onLongPress, onReady, retry, placeholderUri }: MediaTileProps) {
    const { requesting, thumbnail: uri } = useSignedUrls({ media });

    const mediaId = media._id;
    const type = media.identifier.type;

    if (media.status === 'error') {
        return (
            <TouchableOpacity style={{ width: itemSize, height: itemSize, marginBottom: 2, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="alert-circle-outline" size={24} color="red" />
            </TouchableOpacity>
        )
    }

    if (requesting) {
        return (
            <View style={{ width: itemSize, height: itemSize, marginBottom: 2, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="small" color="grey" />
            </View>
        );
    }

    return (
        <TouchableOpacity
            style={{ width: itemSize, height: itemSize, marginBottom: 2 }}
            onPress={() => onPress(mediaId)}
            onLongPress={() => onLongPress(mediaId)}
        >
            {!uri && placeholderUri && (
                <Image
                    source={{ uri: placeholderUri }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                />
            )}


            {uri && (
                <Image
                    source={{ uri, cacheKey: mediaId }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                    cachePolicy={'memory-disk'}
                    onDisplay={() => {
                        onReady(mediaId);
                    }}
                    onError={(e) => {
                        console.error("Rendering tile failed: ", e);
                    }}
                />
            )}


            {uri && type === 'video' && (
                <View style={styles.playIconPosition}>
                    <Play size={24} color="white" />
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        position: 'relative',
        borderRadius: 4,
    },

    playIconPosition: {
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        padding: 12,
    }
})