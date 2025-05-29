import { Media, OptimisticMedia } from "@/types/Media";
import { Image } from "expo-image";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

interface MediaTileProps {
    item: Media | OptimisticMedia;
}

export default function MediaTile({ item }: MediaTileProps) {

    // check for OptimisticMedia and retrieve it's status value
    const isOptimistic = (item: Media | OptimisticMedia): item is OptimisticMedia => {
        return 'status' in item && item.status !== 'success';
    }

    const renderContent = () => {
        if (isOptimistic(item)) {
            switch (item.status) {
                case 'uploading':
                    return (
                        <View style={sty.uploadingContainer}>
                            <ActivityIndicator size="small" color="#fff" />
                            {item.progress !== undefined && (
                                <Text style={sty.progressText}>{Math.round(item.progress)}%</Text>
                            )}
                        </View>
                    );
                case 'error': return (
                    <View style={sty.errorContainer}>
                        <Text style={sty.errorText}>
                            {item.error || 'Upload Failed'}
                        </Text>
                    </View>
                );
                case 'pending': return (
                    <View style={sty.pendingContainer}>
                        <ActivityIndicator size='small' color='#fff' />
                        <Text style={sty.pendingText}>Preparing...</Text>
                    </View>
                );
                default: return null;
            }
        }

        return (
            <Image
                source={{ uri: item.cloudinaryId }}
                style={StyleSheet.absoluteFill}
                contentFit='cover'
                transition={200} />
        );
    };

    return (
        <View style={sty.container}>
            {renderContent()}
        </View>
    )


}

const sty = StyleSheet.create({
    container: {
        borderRadius: 2,
        overflow: 'hidden',

    },
    uploadingContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pendingContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressText: {
        color: '#fff',
        marginTop: 4,
        fontSize: 12,
    },
    errorText: {
        color: '#fff',
        fontSize: 12,
        textAlign: 'center',
        padding: 8,
    },
    pendingText: {
        color: '#fff',
        marginTop: 4,
        fontSize: 12,
    }
});