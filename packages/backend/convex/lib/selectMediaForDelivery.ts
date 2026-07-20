import { Doc, Id } from "../_generated/dataModel";

export type ResolvedMediaForDelivery = {
    mediaId: Id<"media">;
    kind: "image" | "video";
    objectId: string;
};

/**
 * Pure ownership / readiness filter used by `resolveMediaForDelivery`.
 * Throws if any row belongs to a different album (cross-album signing attack).
 */
export function selectMediaForDelivery(
    albumId: Id<"albums">,
    rows: Array<Doc<"media"> | null>,
): ResolvedMediaForDelivery[] {
    const resolved: ResolvedMediaForDelivery[] = [];

    for (const media of rows) {
        if (!media) continue;
        if (media.albumId !== albumId) {
            throw new Error("Media does not belong to this album");
        }
        if ((media as { isDeleted?: boolean }).isDeleted) continue;
        if (media.status !== "ready") continue;

        if (media.identifier.type === "image") {
            resolved.push({
                mediaId: media._id,
                kind: "image",
                objectId: media.identifier.imageId,
            });
        } else {
            resolved.push({
                mediaId: media._id,
                kind: "video",
                objectId: media.identifier.videoUid,
            });
        }
    }

    return resolved;
}
