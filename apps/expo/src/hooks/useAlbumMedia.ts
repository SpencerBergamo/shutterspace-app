import { api } from "@shutterspace/backend/convex/_generated/api";
import { Id } from "@shutterspace/backend/convex/_generated/dataModel";
import { Media } from "@shutterspace/backend/types/Media";
import { usePaginatedQuery } from "convex/react";
import { useCallback } from "react";

const PAGE_SIZE = 60;

export type AlbumMediaStatus =
    | "LoadingFirstPage"
    | "CanLoadMore"
    | "LoadingMore"
    | "Exhausted";

export interface UseAlbumMediaResult {
    media: Media[];
    status: AlbumMediaStatus;
    loadMore: () => void;
    isLoading: boolean;
}

export function useAlbumMedia(albumId: Id<"albums"> | undefined): UseAlbumMediaResult {
    const { results, status, loadMore: loadMorePage } = usePaginatedQuery(
        api.media.paginateMedia,
        albumId ? { albumId } : "skip",
        { initialNumItems: PAGE_SIZE },
    );

    const loadMore = useCallback(() => {
        if (status === "CanLoadMore") {
            loadMorePage(PAGE_SIZE);
        }
    }, [status, loadMorePage]);

    return {
        media: results ?? [],
        status,
        loadMore,
        isLoading: status === "LoadingFirstPage",
    };
}
