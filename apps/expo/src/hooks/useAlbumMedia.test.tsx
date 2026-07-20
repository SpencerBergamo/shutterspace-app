import { Id } from "@shutterspace/backend/convex/_generated/dataModel";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Pressable, Text, View } from "react-native";

const loadMorePage = jest.fn();
const mockUsePaginatedQuery = jest.fn();

jest.mock("convex/react", () => ({
    usePaginatedQuery: (...args: unknown[]) => mockUsePaginatedQuery(...args),
}));

jest.mock("@shutterspace/backend/convex/_generated/api", () => ({
    api: {
        media: {
            paginateMedia: "media.paginateMedia",
        },
    },
}));

import { useAlbumMedia } from "./useAlbumMedia";

function HookProbe({ albumId }: { albumId?: Id<"albums"> }) {
    const { media, status, loadMore, isLoading } = useAlbumMedia(albumId);

    return (
        <View>
            <Text testID="media-count">{media.length}</Text>
            <Text testID="status">{status}</Text>
            <Text testID="is-loading">{String(isLoading)}</Text>
            <Pressable testID="load-more" onPress={loadMore} />
        </View>
    );
}

describe("useAlbumMedia", () => {
    beforeEach(() => {
        loadMorePage.mockClear();
        mockUsePaginatedQuery.mockReset();
    });

    it("returns media and pages when CanLoadMore", async () => {
        mockUsePaginatedQuery.mockReturnValue({
            results: [{ _id: "m1" }, { _id: "m2" }],
            status: "CanLoadMore",
            loadMore: loadMorePage,
        });

        await render(<HookProbe albumId={"album1" as Id<"albums">} />);

        expect(screen.getByTestId("media-count")).toHaveTextContent("2");
        expect(screen.getByTestId("is-loading")).toHaveTextContent("false");

        fireEvent.press(screen.getByTestId("load-more"));
        expect(loadMorePage).toHaveBeenCalledWith(60);
    });

    it("skips the query when albumId is undefined", async () => {
        mockUsePaginatedQuery.mockReturnValue({
            results: undefined,
            status: "LoadingFirstPage",
            loadMore: loadMorePage,
        });

        await render(<HookProbe />);

        expect(mockUsePaginatedQuery).toHaveBeenCalledWith(
            "media.paginateMedia",
            "skip",
            { initialNumItems: 60 },
        );
        expect(screen.getByTestId("media-count")).toHaveTextContent("0");
        expect(screen.getByTestId("is-loading")).toHaveTextContent("true");
    });

    it("does not page when exhausted", async () => {
        mockUsePaginatedQuery.mockReturnValue({
            results: [],
            status: "Exhausted",
            loadMore: loadMorePage,
        });

        await render(<HookProbe albumId={"album1" as Id<"albums">} />);

        fireEvent.press(screen.getByTestId("load-more"));
        expect(loadMorePage).not.toHaveBeenCalled();
    });
});
