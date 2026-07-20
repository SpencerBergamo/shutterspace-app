import {
    __resetAlbumSnapshotsForTests,
    getAlbumSnapshot,
    rememberAlbum,
} from "./albumSnapshotCache";
import { Album } from "@shutterspace/backend/types/Album";
import { Id } from "@shutterspace/backend/convex/_generated/dataModel";

function makeAlbum(id: string, title: string): Album {
    return {
        _id: id as Id<"albums">,
        _creationTime: 1,
        hostId: "p1" as Id<"profiles">,
        title,
        isDynamicThumbnail: true,
        openInvites: true,
        updatedAt: 1,
    };
}

describe("albumSnapshotCache", () => {
    beforeEach(() => {
        __resetAlbumSnapshotsForTests();
    });

    it("remembers albums for warm navigation", () => {
        rememberAlbum(makeAlbum("a1", "Trip"));
        expect(getAlbumSnapshot("a1")?.title).toBe("Trip");
    });
});
