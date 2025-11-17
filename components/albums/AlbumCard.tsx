import { Album } from '@/types/Album';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';


interface AlbumCardProps {
    album: Album;
    width: number;
    height: number;
}

export default function AlbumCard({ album, width, height }: AlbumCardProps) {

    const [thumbnail, setThumbnail] = useState<string | null>(null);
    const theme = useTheme();

    useEffect(() => {
        (async () => {
            if (album.thumbnail) {
                const localUri = await Image.getCachePathAsync(album.thumbnail);
                setThumbnail(localUri);
            }
        })();
    }, [album]);

    return (
        <TouchableOpacity
            style={[styles.albumContainer, { width }]}
            onPress={() => router.push(`album/${album._id}`)}
        >
            <View style={styles.albumThumbnailContainer}>
                {thumbnail ? (
                    <Image
                        source={{ uri: album.thumbnail }}
                        style={styles.albumThumbnail}
                        contentFit="cover"
                    />
                ) : (
                    <View style={[styles.albumThumbnail, styles.placeholderThumbnail, { backgroundColor: theme.colors.border }]}>
                        <Ionicons name="image-outline" size={64} color={theme.colors.text} />
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
    },
    albumDate: {
        fontSize: 12,
    },
});
