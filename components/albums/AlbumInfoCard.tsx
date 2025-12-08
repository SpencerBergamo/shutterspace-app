import { MAX_WIDTH } from "@/constants/styles";
import { useAppTheme } from "@/context/AppThemeContext";
import useSignedUrls from "@/hooks/useSignedUrls";
import { Media } from "@/types/Media";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { ActivityIndicator, StyleSheet, Text, useWindowDimensions, View } from "react-native";

interface AlbumInfoCardProps {
    title: string;
    cover: Media | null;
    mediaCount: number;
}

export default function AlbumInfoCard({ title, cover, mediaCount }: AlbumInfoCardProps) {
    const { width } = useWindowDimensions();
    const { colors } = useAppTheme();
    const { requesting, thumbnail: coverUrl } = useSignedUrls({ media: cover ?? undefined });

    if (cover === null || coverUrl === null || width > MAX_WIDTH) {
        return (
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.grey2,
                padding: 16,
                marginBottom: 8,
            }}>
                <Text
                    style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: colors.text,
                    }}
                >
                    {title}
                </Text>

                <View
                    style={{
                        flexDirection: 'row',
                        gap: 8,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colors.grey1,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 16,
                    }}
                >
                    <Ionicons name="images" size={14} color="white" />
                    <Text style={{ fontSize: 13, fontWeight: '600', color: 'white' }}>{mediaCount}</Text>
                </View>
            </View>
        )
    }

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
                    <Ionicons name="image-outline" size={64} color={colors.grey1} />
                </View>
            )}

            <View style={styles.coverOverlay} >
                <Text style={styles.overlayTitle} numberOfLines={2}>{title}</Text>
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
        borderRadius: 16,
        borderColor: 'rgba(0, 0, 0, 0.1)',
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