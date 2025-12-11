import useAlbumCover from "@/src/hooks/useAlbumCover";
import { Album } from "@/src/types/Album";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { memo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

const AlbumCoverImage = ({ album }: { album: Album }) => {
    const { requesting, coverUrl: uri, mediaId } = useAlbumCover(album._id);

    const [imageError, setImageError] = useState(false);

    return (
        <View style={styles.container}>

            {uri === null && (
                <Ionicons name="image-outline" size={48} color="#777777" />
            )}

            {uri && mediaId && (
                <Image
                    source={{ uri, cacheKey: mediaId }}
                    style={{ width: '100%', height: '100%', backgroundColor: '#DEDEDEFF' }}
                    contentFit="cover"
                    cachePolicy={'memory-disk'}
                    onError={(e) => {
                        console.error("Album Cover Image ERROR: ", e);
                        setImageError(true);
                    }}
                />
            )}

            {imageError && (
                <Ionicons name="alert-circle-outline" size={48} color="#D32F2F" />
            )}

            {requesting && (
                <ActivityIndicator size="small" color="grey" />
            )}
        </View>
    );
}

export default memo(AlbumCoverImage, (prevProps, nextProps) => {
    // Only re-render if the album ID changes
    return prevProps.album._id === nextProps.album._id;
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    image: {
        width: '100%',
        height: '100%',
        backgroundColor: '#DEDEDEFF',
    },
})