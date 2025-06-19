import { DbMedia } from "@/types/Media";
import { router } from "expo-router";
import { useCallback, useRef } from "react";
import AwesomeGallery, { GalleryRef } from "react-native-awesome-gallery";

interface MediaViewerProps {
    data: DbMedia[];
    initialIndex: number;
    onIndexChange?: (index: number) => void;
}

export default function MediaViewer({
    data,
    initialIndex,
    onIndexChange,
}: MediaViewerProps) {
    const gallery = useRef<GalleryRef>(null);

    const onSwipeToClose = useCallback(() => {
        router.back();
    }, []);

    const keyExtractor = useCallback((item: DbMedia) => item._id, []);

    const renderItem = useCallback(({ item }: { item: DbMedia }) => {
        if (item.type === 'video') {
            return <></>
        } else {
            return <></>
        }
    }, []);

    return <>
        <AwesomeGallery
            ref={gallery}
            data={[]}
            keyExtractor={keyExtractor}
            initialIndex={initialIndex}
            emptySpaceWidth={10}
            disableTransitionOnScaledImage={true}
            hideAdjacentImagesOnScaledImage={true}
            onIndexChange={onIndexChange}
            onSwipeToClose={onSwipeToClose}
            renderItem={renderItem} />
    </>
}