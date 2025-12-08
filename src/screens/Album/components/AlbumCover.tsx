import { api } from '@/convex/_generated/api';
import { useAppTheme } from '@/src/context/AppThemeContext';
import useSignedUrls from '@/src/hooks/useSignedUrls';
import { Album } from '@/src/types/Album';
import { formatAlbumData } from '@/src/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

interface AlbumCoverProps {
    album: Album;
    width: number;
    height: number;
    onPress: () => void;
}

export default function AlbumCover({ album, width, height, onPress }: AlbumCoverProps) {
    const { colors } = useAppTheme();

    const albumCover = useQuery(api.media.getAlbumCoverMedia, { albumId: album._id });
    const { requesting, thumbnail: uri } = useSignedUrls({ media: albumCover ?? undefined });

    const [imageError, setImageError] = useState(false);



    return (
        <Pressable
            style={[styles.container, { width, height }]}
            onPress={onPress}
        >
            {requesting ? (
                <View style={[styles.thumbnail, styles.placeholder]}>
                    <ActivityIndicator size="small" color="grey" />
                </View>
            ) : !albumCover ? (
                <View style={[styles.thumbnail, styles.placeholder]}>
                    <Ionicons name="image-outline" size={48} color="#777777" />
                </View>
            ) : uri === null || imageError ? (
                <View style={[styles.thumbnail, styles.placeholder]}>
                    <Ionicons name="alert-circle-outline" size={48} color="#D32F2F" />
                </View>
            ) : uri ? (
                <Image
                    source={{ uri, cacheKey: albumCover._id }}
                    style={styles.thumbnail}
                    contentFit="cover"
                    cachePolicy={'memory-disk'}
                    onError={(e) => {
                        console.error("Album Cover ERROR: ", e);
                        setImageError(true);
                    }}
                />
            ) : (
                <View style={[styles.thumbnail, styles.placeholder]}>
                    <ActivityIndicator size="small" color="grey" />
                </View>
            )}
            <Text
                style={[styles.albumTitle, { color: colors.text }]}
                numberOfLines={2}
            >
                {album.title}
            </Text>

            <Text style={[styles.albumDate, { color: colors.text + '80' }]}>
                {formatAlbumData(album._creationTime)}
            </Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    thumbnail: {
        width: '100%',
        aspectRatio: 1,
        backgroundColor: '#DEDEDEFF',
        borderRadius: 16,
        marginBottom: 8,
    },
    placeholder: {
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
    },
    albumTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
        paddingHorizontal: 8,
    },
    albumDate: {
        fontSize: 12,
        paddingHorizontal: 8,
    },
});
