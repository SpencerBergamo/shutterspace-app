import { useAlbum } from "@/context/AlbumContext";
import { useMedia } from "@/hooks/useMedia";
import { DbMedia } from "@/types/Media";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useRef } from "react";
import AwesomeGallery, { GalleryRef } from "react-native-awesome-gallery";

export default function MediaDetailScreen() {

    const { album } = useAlbum();
    const { mediaIndex: index } = useLocalSearchParams<{ mediaIndex: string }>();

    const { dbMedia } = useMedia(album._id);

    const gallery = useRef<GalleryRef>(null);

    const onSwipeToClose = useCallback(() => router.back(), []);

    const renderItem = useCallback(({ item }: { item: DbMedia }) => {
        if (item.type === 'video') {
            return <></>
        }

        return <></>
    }, [index]);

    return (
        <AwesomeGallery
            ref={gallery}
            data={dbMedia}
            keyExtractor={(item) => item._id}
            initialIndex={Number(index)}
            emptySpaceWidth={10}
            disableTransitionOnScaledImage={true}
            hideAdjacentImagesOnScaledImage={true}
            onIndexChange={() => { }}
            onSwipeToClose={onSwipeToClose}
            renderItem={renderItem} />
    );
}