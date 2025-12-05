import { useAppTheme } from "@/context/AppThemeContext";
import useSignedUrls from "@/hooks/useSignedUrls";
import { Album } from "@/types/Album";
import { Media } from "@/types/Media";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

interface AlbumInfoCardProps {
    album: Album;
    cover: Media | undefined;
    mediaCount: number;
}

export default function AlbumInfoCard({ album, cover, mediaCount }: AlbumInfoCardProps) {
    const { colors } = useAppTheme();
    const { requesting, thumbnail: coverUrl } = useSignedUrls({ media: cover });

    return (
        <View style={styles.container}>
            {requesting && (
                <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="grey" />
                </View>
            )}

            {coverUrl && cover ? (
                <Image
                    source={{ uri: coverUrl, cacheKey: cover._id }}
                    style={styles.cover}
                    contentFit="cover"
                    cachePolicy={'memory-disk'}
                />
            ) : (
                <View style={styles.coverPlaceholder}>
                    <Ionicons name="image-outline" size={64} color={colors.text} />
                </View>
            )}

            <View style={styles.coverOverlay} >
                <Text style={styles.overlayTitle} numberOfLines={2}>{album.title}</Text>
                <View style={styles.overlayStats}>
                    <View style={styles.statBadge}>
                        <Ionicons name="images" size={14} color="white" />
                        <Text style={styles.statText}>{mediaCount}</Text>
                    </View>
                    {/* <View style={styles.statBadge}>
                        <Ionicons name="people" size={14} color="white" />
                        <Text style={styles.statText}>{memberCount}</Text>
                    </View> */}
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
        position: 'relative',
    },
    cover: {
        width: '100%',
        height: '100%',
    },
    coverPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    coverOverlay: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    overlayTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: 'white',
        marginBottom: 8,
    },
    overlayStats: {
        flexDirection: 'row',
        gap: 12,
    },
    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '600',
    },
})