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
            style={[styles.container, { width, height }]}
            onPress={() => router.push(`album/${album._id}`)}
        >
            {requesting ? (
                <View style={[styles.thumbnail, styles.placeholder, { backgroundColor: '#F5F5F5' }]}>
                    <ActivityIndicator size="small" color="grey" />
                </View>
            ) : !albumCover ? (
                <View style={[styles.thumbnail, styles.placeholder, { backgroundColor: '#DEDEDE' }]}>
                    <Ionicons name="image-outline" size={48} color="#777777" />
                </View>
            ) : uri ? (
                <Image
                    source={{ uri, cacheKey: albumCover._id }}
                    style={styles.thumbnail}
                    contentFit="cover"
                    cachePolicy={'memory-disk'}
                    onError={(e) => {
                        console.error("Album Cover ERROR: ", e);
                    }}
                />
            ) : (
                <View style={[styles.thumbnail, styles.placeholder]}>
                    <Ionicons name="alert-circle-outline" size={48} color={colors.text} />
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
        borderRadius: 16,
        marginBottom: 8,
    },
    placeholder: {
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
