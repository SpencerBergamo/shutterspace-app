import { api } from '@/convex/_generated/api';
import useSignedUrls from '@/hooks/useSignedUrls';
import { Album } from '@/types/Album';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useQuery } from 'convex/react';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


interface AlbumCardProps {
    album: Album;
    width: number;
}

export default function AlbumCover({ album, width }: AlbumCardProps) {
    const theme = useTheme();
    const albumCover = useQuery(api.albums.getAlbumCover, { albumId: album._id });
    const { requesting, thumbnail: uri } = useSignedUrls({ media: albumCover ?? undefined });

    return (
        <TouchableOpacity
            style={[styles.albumContainer, { width }]}
            onPress={() => router.push(`album/${album._id}`)}
        >
            <View style={styles.albumThumbnailContainer}>
                {!albumCover && (
                    <View style={[styles.albumThumbnail, styles.placeholderThumbnail, { backgroundColor: theme.colors.border }]}>
                        <Ionicons name="image-outline" size={64} color={theme.colors.text} />
                    </View>
                )}

                {requesting && (
                    <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="small" color="grey" />
                    </View>
                )}

                {albumCover && uri ? (
                    <Image
                        source={{ uri, cacheKey: albumCover._id }}
                        style={styles.albumThumbnail}
                        contentFit="cover"
                        cachePolicy={'memory-disk'}
                    />
                ) : (
                    <View style={[styles.albumThumbnail, styles.placeholderThumbnail, { backgroundColor: theme.colors.border }]}>
                        <Ionicons name="alert-circle-outline" size={64} color={theme.colors.text} />
                    </View>
                )}
            </View>
            <Text
                style={[styles.albumTitle, { color: theme.colors.text }]}
                numberOfLines={2}
            >
                {album.title}
            </Text>

            <Text style={[styles.albumDate, { color: theme.colors.text + '80' }]}>
                {new Date(album._creationTime).toLocaleDateString()}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    albumContainer: {
        marginBottom: 16,
    },
    albumThumbnailContainer: {
        marginBottom: 8,
    },
    albumThumbnail: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 16,
    },
    placeholderThumbnail: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    albumTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
        paddingHorizontal: 8,
    },
    albumDate: {
        fontSize: 12,
        paddingHorizontal: 8,
    },
});
