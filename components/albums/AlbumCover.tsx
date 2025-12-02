import { useAppTheme } from '@/context/AppThemeContext';
import { api } from '@/convex/_generated/api';
import useSignedUrls from '@/hooks/useSignedUrls';
import { Album } from '@/types/Album';
import { formatAlbumData } from '@/utils/dateFormatters';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

interface AlbumCardProps {
    album: Album;
    width: number;
    height: number;
}

export default function AlbumCover({ album, width, height }: AlbumCardProps) {
    const { colors } = useAppTheme();
    const albumCover = useQuery(api.albums.getAlbumCover, { albumId: album._id });
    const { requesting, thumbnail: uri } = useSignedUrls({ media: albumCover ?? undefined });

    return (
        <Pressable
            style={[styles.albumContainer, { width, height }]}
            onPress={() => router.push(`album/${album._id}`)}
        >
            <View style={styles.albumThumbnailContainer}>
                {requesting ? (
                    <View style={[styles.albumThumbnail, { justifyContent: 'center', alignItems: 'center' }]}>
                        <ActivityIndicator size="small" color="grey" />
                    </View>
                ) : !albumCover ? (
                    <View style={[styles.albumThumbnail, styles.placeholderThumbnail, { backgroundColor: "#DEDEDEFF" }]}>
                        <Ionicons name="image-outline" size={48} color="#777777FF" />
                    </View>
                ) : uri ? (
                    <Image
                        source={{ uri, cacheKey: albumCover._id }}
                        style={styles.albumThumbnail}
                        contentFit="cover"
                        cachePolicy={'memory-disk'}
                        onError={(e) => {
                            console.error("Album Cover ERROR: ", e);
                        }}
                    />
                ) : (
                    <View style={[styles.albumThumbnail, styles.placeholderThumbnail, { backgroundColor: colors.border }]}>
                        <Ionicons name="alert-circle-outline" size={48} color={colors.text} />
                    </View>
                )}
            </View>
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
