import { ASSETS } from '@/constants/assets';
import { useProfile } from '@/context/ProfileContext';
import { useSignedUrls } from '@/context/SignedUrlsContext';
import { Album } from '@/types/Album';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';


interface AlbumCardProps {
    album: Album;
    width: number;
    height: number;
}

export default function AlbumCard({ album, width, height }: AlbumCardProps) {
    const { profileId } = useProfile();
    const { getThumbnailURL } = useSignedUrls();

    const [thumbnail, setThumbnail] = useState<string | undefined>(undefined);
    const [imageError, setImageError] = useState<boolean>(false);

    useEffect(() => {
        const signed = async () => {
            if (album.thumbnailFileId?.fileId) {
                const { type, fileId } = album.thumbnailFileId;
                const signature = await getThumbnailURL({ type, fileId, albumId: album._id, profileId });
                if (signature) {
                    setThumbnail(signature);
                    setImageError(false);
                }
            } else {
                setThumbnail(ASSETS.defaultAlbumCover);
            }
        }

        signed();
    }, [getThumbnailURL, album, profileId, album.thumbnailFileId, thumbnail]);

    return (
        <Pressable onPress={() => router.push(`album/${album._id}`)} >
            <View style={[styles.container, { width: width, height: height }]}>
                <Image
                    source={{ uri: thumbnail }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0, 0, 0, 0.5)']}
                    style={styles.overlay}>
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>{album.title}</Text>
                        <Text style={styles.date}>
                            {new Date(album._creationTime).toLocaleDateString()}
                        </Text>
                    </View>
                </LinearGradient>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        position: 'relative',
        borderRadius: 16,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        justifyContent: 'flex-end',
        padding: 12,
    },
    textContainer: {
        justifyContent: 'flex-end',
        alignItems: 'flex-start',
    },
    title: {
        color: '#fff',
        // fontFamily: 'SansitaOne',
        fontWeight: '800',
        fontSize: 18,
        textAlign: 'left',
        marginBottom: 4,
    },
    date: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        opacity: 0.8,
    },
});
