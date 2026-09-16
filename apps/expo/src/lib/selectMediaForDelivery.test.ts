import { Doc, Id } from "@shutterspace/backend/convex/_generated/dataModel";
import { selectMediaForDelivery } from "@shutterspace/backend/convex/lib/selectMediaForDelivery";

function makeImage(
    overrides: Partial<Doc<"media">> & { _id: Id<"media">; albumId: Id<"albums"> },
): Doc<"media"> {
    return {
        _creationTime: 1,
        createdBy: "profile1" as Id<"profiles">,
        assetId: "asset1",
        filename: "photo.jpg",
        identifier: {
            type: "image",
            imageId: "img-1.jpg",
            width: 100,
            height: 100,
        },
        status: "ready",
        ...overrides,
    };
}

describe("selectMediaForDelivery", () => {
    const albumId = "albumA" as Id<"albums">;

    it("returns ready image and video rows for the album", () => {
        const rows = [
            makeImage({ _id: "m1" as Id<"media">, albumId }),
            makeImage({
                _id: "m2" as Id<"media">,
                albumId,
                identifier: {
                    type: "video",
                    videoUid: "vid-1",
                    duration: 12,
                },
            }),
            null,
        ];

        expect(selectMediaForDelivery(albumId, rows)).toEqual([
            { mediaId: "m1", kind: "image", objectId: "img-1.jpg" },
            { mediaId: "m2", kind: "video", objectId: "vid-1" },
        ]);
    });

    it("skips soft-deleted and non-ready media", () => {
        const rows = [
            makeImage({
                _id: "m1" as Id<"media">,
                albumId,
                status: "pending",
            }),
            makeImage({
                _id: "m2" as Id<"media">,
                albumId,
                isDeleted: true,
            } as Doc<"media">),
        ];

        expect(selectMediaForDelivery(albumId, rows)).toEqual([]);
    });

    it("throws when a media row belongs to another album", () => {
        const rows = [
            makeImage({
                _id: "m1" as Id<"media">,
                albumId: "albumB" as Id<"albums">,
            }),
        ];

        expect(() => selectMediaForDelivery(albumId, rows)).toThrow(
            "Media does not belong to this album",
        );
    });
});
