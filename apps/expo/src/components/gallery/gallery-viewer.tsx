import { Media } from "@shutterspace/backend/types/Media";
import { Image } from "expo-image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    FlatList,
    Modal,
    Pressable,
    StatusBar,
    StyleSheet,
    useWindowDimensions,
    View,
    type ListRenderItemInfo,
    type NativeScrollEvent,
    type NativeSyntheticEvent,
    type ViewToken,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ViewerItem } from "./viewer-item";

export interface GalleryViewerProps {
    media: Media[];
    initialIndex: number;
    visible: boolean;
    onClose: () => void;
    onIndexChange?: (index: number) => void;
    onNearEnd?: () => void;
}

export function GalleryViewer({
    media,
    initialIndex,
    visible,
    onClose,
    onIndexChange,
    onNearEnd,
}: GalleryViewerProps) {
    const insets = useSafeAreaInsets();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const listRef = useRef<FlatList<Media>>(null);
    const openIndexRef = useRef(initialIndex);
    const [activeIndex, setActiveIndex] = useState(initialIndex);
    const [isZoomed, setIsZoomed] = useState(false);

    useEffect(() => {
        if (!visible) return;

        StatusBar.setHidden(true, "fade");
        setActiveIndex(openIndexRef.current);
        setIsZoomed(false);

        return () => {
            StatusBar.setHidden(false, "fade");
        };
    }, [visible]);

    const onNearEndRef = useRef(onNearEnd);
    const onIndexChangeRef = useRef(onIndexChange);
    const mediaLengthRef = useRef(media.length);
    onNearEndRef.current = onNearEnd;
    onIndexChangeRef.current = onIndexChange;
    mediaLengthRef.current = media.length;

    const onViewableItemsChanged = useRef(
        ({ viewableItems }: { viewableItems: ViewToken[] }) => {
            const first = viewableItems[0];
            if (first?.index == null) return;
            setActiveIndex(first.index);
            onIndexChangeRef.current?.(first.index);
            if (first.index >= mediaLengthRef.current - 6) {
                onNearEndRef.current?.();
            }
        },
    ).current;

    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

    const renderItem = useCallback(
        ({ item, index }: ListRenderItemInfo<Media>) => (
            <View style={{ width: screenWidth, height: screenHeight, backgroundColor: "#000" }}>
                <ViewerItem
                    media={item}
                    isViewable={index === activeIndex}
                    onZoomChange={setIsZoomed}
                    width={screenWidth}
                    height={screenHeight}
                />
            </View>
        ),
        [activeIndex, screenWidth, screenHeight],
    );

    const getItemLayout = useCallback(
        (_: ArrayLike<Media> | null | undefined, index: number) => ({
            length: screenWidth,
            offset: screenWidth * index,
            index,
        }),
        [screenWidth],
    );

    const onScrollEnd = useCallback(
        (e: NativeSyntheticEvent<NativeScrollEvent>) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
            if (index !== activeIndex && index >= 0 && index < media.length) {
                setActiveIndex(index);
                onIndexChange?.(index);
            }
        },
        [activeIndex, media.length, onIndexChange, screenWidth],
    );

    if (!visible) return null;

    return (
        <Modal
            visible
            transparent={false}
            animationType="none"
            presentationStyle="fullScreen"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <GestureHandlerRootView style={styles.root}>
                <FlatList
                    ref={listRef}
                    data={media}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    getItemLayout={getItemLayout}
                    initialScrollIndex={Math.min(
                        openIndexRef.current,
                        Math.max(media.length - 1, 0),
                    )}
                    onMomentumScrollEnd={onScrollEnd}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    windowSize={5}
                    maxToRenderPerBatch={3}
                    initialNumToRender={Math.min(media.length, 3)}
                    removeClippedSubviews={false}
                    scrollEnabled={!isZoomed}
                    style={styles.list}
                    onScrollToIndexFailed={({ index }) => {
                        setTimeout(() => {
                            listRef.current?.scrollToOffset({
                                offset: index * screenWidth,
                                animated: false,
                            });
                        }, 16);
                    }}
                />

                <View
                    style={[styles.chrome, { paddingTop: insets.top + 8 }]}
                    pointerEvents="box-none"
                >
                    <Pressable
                        testID="gallery-viewer-close"
                        onPress={onClose}
                        hitSlop={12}
                        style={styles.closeButton}
                    >
                        <Image
                            source="sf:xmark"
                            style={styles.closeIcon}
                            tintColor="white"
                        />
                    </Pressable>
                </View>
            </GestureHandlerRootView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: "#000",
    },
    list: {
        flex: 1,
    },
    chrome: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "flex-end",
        paddingHorizontal: 16,
        zIndex: 10,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(0,0,0,0.45)",
        justifyContent: "center",
        alignItems: "center",
    },
    closeIcon: {
        width: 18,
        height: 18,
    },
});
