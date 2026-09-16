import { api } from "@shutterspace/backend/convex/_generated/api";
import { usePaginatedQuery } from "convex/react";

const PAGE_SIZE = 20;

export function useUserAlbums() {
    const { results, status, loadMore } = usePaginatedQuery(
        api.albums.queryUserAlbums,
        {},
        { initialNumItems: PAGE_SIZE },
    );

    return {
        albums: results,
        status,
        loadMore: () => loadMore(PAGE_SIZE),
    };
}
