import { Media } from '@/types/Media';
import { Image } from 'expo-image';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface MediaGalleryProps {
    media: Media[];
    title?: string;
}

export default function MediaGallery({ media, title = 'Gallery' }: MediaGalleryProps) {
    const handleMediaPress = (index: number) => {
        // navigateToScrollView(media, index, title);
    };

    const renderMediaItem = ({ item, index }: { item: Media; index: number }) => {
        const uri = 'downloadUrl' in item ? item.downloadUrl : (item as any).asset?.uri;

        return (
            <TouchableOpacity
                style={styles.mediaItem}
                onPress={() => handleMediaPress(index)}
                activeOpacity={0.8}
            >
                <Image
                    source={{ uri }}
                    style={styles.thumbnail}
                    contentFit="cover"
                />
                {item.type === 'video' && (
                    <View style={styles.videoIndicator}>
                        <Text style={styles.videoText}>▶</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>
            <FlatList
                data={media}
                renderItem={renderMediaItem}
                keyExtractor={(item, index) => (item as any)._id || `item-${index}`}
                numColumns={3}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 15,
        paddingHorizontal: 20,
    },
    listContainer: {
        paddingHorizontal: 20,
    },
    mediaItem: {
        flex: 1,
        margin: 2,
        aspectRatio: 1,
        position: 'relative',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    videoIndicator: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoText: {
        color: 'white',
        fontSize: 12,
    },
}); 