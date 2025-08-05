import { ASSETS } from '@/constants/assets';
import { Album } from '@/types/Album';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface AlbumCardProps {
    album: Album;
    width: number;
    height: number;
}

export default function AlbumCard({ album, width, height }: AlbumCardProps) {
    return (
        <Pressable style={[styles.container, { width: width, height: height }]}
            onPress={() => router.push(`album/${album._id}`)} >
            <Image
                source={{ uri: album.coverImageUrl || ASSETS.defaultAlbumCover }}
                style={styles.coverImage}
                contentFit="cover" />
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
        // width: '100%',
        // height: '100%',
        // height: 200,
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
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
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
