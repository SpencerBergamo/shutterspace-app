import { DbMedia } from "@/types/Media";
import { Image } from "expo-image";
import { CircleX } from "lucide-react-native";
import { Modal, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface MediaViewerProps {
    open: boolean;
    DbMedia: DbMedia[];
    onClose: () => void;
}

const MediaItem = ({ item, onPlayPause, isPlaying }: {
    item: DbMedia, onPlayPause: () => void, isPlaying: boolean
}) => {
    if (item.type === 'video') { } else {
        return (
            <Image source={{ uri: item.thumbnailUrl }} />
        );
    }
}

export default function MediaViewer({
    open, DbMedia, onClose
}: MediaViewerProps) {
    const insets = useSafeAreaInsets();

    return (
        <Modal
            visible={open}
            animationType="fade"
            onRequestClose={onClose}
            backdropColor={'#000000'} >

            <View style={[styles.container, { paddingTop: insets.top }]}>
                <StatusBar barStyle="light-content" backgroundColor='black' />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <CircleX size={24} color='white' />
                    </TouchableOpacity>

                    <Text style={styles.title}>{ }</Text>

                    <View style={styles.placeholder} />
                </View>

                {/* DbMedia Content */}
                {/* <View style={styles.content}>
                    {DbMedia.map((item, index) => (
                        <View key={(item as DbMedia).filename}
                            style={[styles.mediaContainer, { display: index === currentIndex ? 'flex' : 'none' }]} >



                        </View>
                    ))}
                </View> */}

            </View>

        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
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
    content: {},
});