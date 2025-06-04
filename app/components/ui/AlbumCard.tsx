import { Album } from '@/types/Album';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function AlbumCard({ album }: { album: Album }) {

    return (
        <Pressable style={styles.container}
            onPress={() => router.push(`/album/${album._id}`)}
        >
            <Image
                source={{ uri: album.thumbnail || '@/assets/images/default-album-cover.png' }}
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
        alignItems: 'flex-start',
    },
    title: {
        color: '#fff',
        fontFamily: 'SansitaOne',
        fontSize: 16,
        textAlign: 'left',
        marginBottom: 4,
    },
    date: {
        color: '#fff',
        fontSize: 12,
        opacity: 0.8,
    },
});
