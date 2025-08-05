import { useProfile } from "@/context/ProfileContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { DbMedia, Media, OptimisticMedia } from "@/types/Media";
import { createOptimisticMedia } from "@/utils/mediaFactory";
import { usePaginatedQuery } from "convex/react";
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useMemo } from "react";
import { Alert } from "react-native";
import { useUploadQueue } from "./useUploadQueue";

type UseAlbumMediaResult = {
    media: Media[];
    dbMedia: DbMedia[];
    handleMediaSelection: () => void;
    canLoadMore: boolean;
    loadMore: () => void;
}

export const useMedia = (albumId: Id<'albums'>): UseAlbumMediaResult => {
    const { profileId } = useProfile();

    const { results: dbMedia, loadMore, status } = usePaginatedQuery(
        api.media.getMediaForAlbum,
        { albumId },
        { initialNumItems: 30 }
    );

    // const storageRef = storage().ref(`albums/${albumId}`);
    const { queue, uploadMedia } = useUploadQueue(albumId);

    const media = useMemo(() => {
        return [
            ...(queue as OptimisticMedia[]),
            ...(dbMedia as DbMedia[]),
        ] as Media[];

    }, [dbMedia, queue]);

    const handleLoadMore = useCallback(() => {
        if (status === 'CanLoadMore') loadMore(30);
    }, [loadMore, status]);

    const handleMediaSelection = useCallback(async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission required", "Please grant permission to access your media library");
            return;
        }

        const { assets } = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsMultipleSelection: true,
            quality: 1,
            exif: true,
        });

        if (assets && assets.length > 0) {
            const newOptimisticMedia = createOptimisticMedia(assets, albumId, profileId);
            uploadMedia(newOptimisticMedia);
        }
    }, [albumId]);

    return {
        media,
        dbMedia,
        handleMediaSelection,
        canLoadMore: status === 'CanLoadMore',
        loadMore: handleLoadMore,
    }
}