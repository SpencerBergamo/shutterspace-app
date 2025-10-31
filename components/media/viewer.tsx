import { useSignedUrls } from "@/context/SignedUrlsContext";
import { useTheme } from "@/context/ThemeContext";
import { DbMedia } from "@/types/Media";
import { X } from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import { Animated, FlatList, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions, View, ViewToken } from "react-native";

type MediaViewerProps = {
    media: DbMedia[];
    index: number;
    // onIndexChange: (index: number) => void;
    onClose: (lastIndex: number) => void;
}

export default function MediaViewer({ media, index, onClose }: MediaViewerProps) {
    const { theme } = useTheme();
    const { width, height } = useWindowDimensions();
    const { requestSignedEntry } = useSignedUrls();

    const flatListRef = useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = useState(index);

    const animatedOpacity = useRef(new Animated.Value(0)).current;

    const onIndexChange = useCallback((info: ViewToken<DbMedia>) => {
        setCurrentIndex(info.index ?? 0);
    }, []);

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.navbar, { opacity: animatedOpacity }]}>
                <TouchableOpacity style={styles.closeButton} onPress={() => onClose(currentIndex)}>
                    <X size={styles.closeButtonIcon.width} color='white' />
                </TouchableOpacity>
            </Animated.View>

            <ScrollView horizontal>
                {media.map(async (item, index) => {
                    const type = item.identifier.type;
                    const cloudflareId = type === 'image' ? item.identifier.imageId : item.identifier.videoUid;




                    return (
                        <View></View>
                    );
                })}
            </ScrollView>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'black',
    },

    navbar: {
        position: 'absolute',
        top: 56,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
    },

    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 999,
        justifyContent: 'center',
        alignItems: 'center',

    },

    closeButtonIcon: {
        width: 32,
        height: 32,
    },
});