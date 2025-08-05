import { Media } from '@/types/Media';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Video, { VideoRef } from 'react-native-video';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ScrollViewProps {
    data: Media[];
    initialIndex?: number;
    title?: string;
}

interface VideoPlayerProps {
    uri: string;
    onPlayPause: () => void;
    isPlaying: boolean;
    progress: number;
    duration: number;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
    uri,
    onPlayPause,
    isPlaying,
    progress,
    duration
}) => {
    const [currentTime, setCurrentTime] = useState(0);
    const [videoDuration, setVideoDuration] = useState(0);
    const videoRef = useRef<VideoRef>(null);

    useEffect(() => {
        setVideoDuration(duration);
    }, [duration]);

    const onProgress = (data: { currentTime: number }) => {
        setCurrentTime(data.currentTime);
    };

    const onLoad = (data: { duration: number }) => {
        setVideoDuration(data.duration);
    };

    const progressPercentage = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0;

    return (
        <View style={styles.videoContainer}>
            <Video
                ref={videoRef}
                source={{ uri }}
                style={styles.video}
                resizeMode="contain"
                onProgress={onProgress}
                onLoad={onLoad}
                paused={!isPlaying}
                repeat={false}
            />

            {/* Video Controls Overlay */}
            <TouchableOpacity
                style={styles.videoControlsOverlay}
                onPress={onPlayPause}
                activeOpacity={0.8}
            >
                <View style={styles.videoControls}>
                    <TouchableOpacity onPress={onPlayPause} style={styles.playButton}>
                        <Ionicons
                            name={isPlaying ? 'pause' : 'play'}
                            size={24}
                            color="white"
                        />
                    </TouchableOpacity>

                    {/* Progress Bar */}
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View
                                style={[
                                    styles.progressFill,
                                    { width: `${progressPercentage}%` }
                                ]}
                            />
                        </View>
                        <Text style={styles.timeText}>
                            {Math.floor(currentTime)}s / {Math.floor(videoDuration)}s
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        </View>
    );
};

const MediaItem: React.FC<{ item: Media; onPlayPause?: () => void; isPlaying?: boolean }> = ({
    item,
    onPlayPause,
    isPlaying
}) => {
    if (item.type === 'video') {
        return (
            <VideoPlayer
                uri={'downloadUrl' in item ? item.downloadUrl : (item as any).asset?.uri}
                onPlayPause={onPlayPause || (() => { })}
                isPlaying={isPlaying || false}
                progress={0}
                duration={item.duration || 0}
            />
        );
    } else {
        return (
            <Image
                source={{ uri: 'downloadUrl' in item ? item.downloadUrl : (item as any).asset?.uri }}
                style={styles.image}
                contentFit="contain"
                transition={200}
            />
        );
    }
};

export default function ScrollView() {
    const params = useLocalSearchParams();
    const insets = useSafeAreaInsets();

    // Parse the data from params - you can pass this as a stringified JSON
    const data: Media[] = params.data ? JSON.parse(params.data as string) : [];
    const initialIndex = params.initialIndex ? parseInt(params.initialIndex as string) : 0;
    const title = params.title as string || 'Media Viewer';

    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [videoStates, setVideoStates] = useState<{ [key: string]: boolean }>({});

    const handleIndexChange = useCallback((index: number) => {
        setCurrentIndex(index);

        // Pause all videos when changing index
        setVideoStates({});
    }, []);

    const handlePlayPause = useCallback((itemId: string) => {
        setVideoStates(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
    }, []);

    const handleClose = useCallback(() => {
        router.back();
    }, []);

    const renderItem = useCallback(({ item, index }: { item: Media; index: number }) => {
        const itemId = (item as any)._id || `item-${index}`;
        const isPlaying = videoStates[itemId] || false;

        return (
            <View style={styles.itemContainer}>
                <MediaItem
                    item={item}
                    onPlayPause={() => handlePlayPause(itemId)}
                    isPlaying={isPlaying}
                />
            </View>
        );
    }, [videoStates, handlePlayPause]);

    if (data.length === 0) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.title}>{title}</Text>
                    <View style={styles.placeholder} />
                </View>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No media to display</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="light-content" backgroundColor="black" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.title}>
                    {title} • {currentIndex + 1} of {data.length}
                </Text>
                <View style={styles.placeholder} />
            </View>

            {/* Media Content */}
            <View style={styles.content}>
                {data.map((item, index) => (
                    <View
                        key={(item as any)._id || `item-${index}`}
                        style={[
                            styles.itemContainer,
                            { display: index === currentIndex ? 'flex' : 'none' }
                        ]}
                    >
                        {renderItem({ item, index })}
                    </View>
                ))}
            </View>

            {/* Navigation Dots */}
            {data.length > 1 && (
                <View style={styles.dotsContainer}>
                    {data.map((_, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.dot,
                                index === currentIndex && styles.activeDot
                            ]}
                            onPress={() => setCurrentIndex(index)}
                        />
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    closeButton: {
        padding: 8,
    },
    title: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
        textAlign: 'center',
    },
    placeholder: {
        width: 40,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemContainer: {
        width: screenWidth,
        height: screenHeight * 0.8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    videoContainer: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    videoControlsOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 20,
    },
    videoControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    playButton: {
        padding: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 25,
    },
    progressContainer: {
        flex: 1,
        marginLeft: 15,
    },
    progressBar: {
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 2,
        marginBottom: 5,
    },
    progressFill: {
        height: '100%',
        backgroundColor: 'white',
        borderRadius: 2,
    },
    timeText: {
        color: 'white',
        fontSize: 12,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: 'white',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        color: 'white',
        fontSize: 16,
    },
});
