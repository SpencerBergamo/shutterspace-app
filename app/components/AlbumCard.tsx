import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Album } from '../../types/Album';

interface AlbumCardProps {
    album: Album;
}

export default function AlbumCard({ album }: AlbumCardProps) {
    return (
        <Pressable style={styles.container}
            onPress={() => router.push(`/album/${album.albumId}`)}
        >
            <Image
                source={{ uri: album.albumCover?.url }}
                style={styles.coverImage}
                contentFit="cover"
            />
            <View style={styles.overlay}>
                <View style={styles.textContainer}>
                    <Text style={styles.title}>{album.title}</Text>
                    <Text style={styles.date}>
                        {new Date(album.createdAt).toLocaleDateString()}
                    </Text>
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
        overflow: 'hidden',
    },
    coverImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end',
        padding: 12,
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        color: '#fff',
        fontFamily: 'SansitaOne',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 4,
    },
    date: {
        color: '#fff',
        fontSize: 12,
        opacity: 0.8,
    },
});
