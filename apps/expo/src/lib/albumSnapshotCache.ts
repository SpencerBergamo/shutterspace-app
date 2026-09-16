import { Album } from "@shutterspace/backend/types/Album";
import { Id } from "@shutterspace/backend/convex/_generated/dataModel";

/**
 * Display-only last-known album snapshots for warm navigation.
 * Not a source of truth — Convex queries remain authoritative.
 */
const snapshots = new Map<string, Album>();

export function rememberAlbum(album: Album): void {
    snapshots.set(album._id, album);
}

export function rememberAlbums(albums: Album[]): void {
    for (const album of albums) {
        rememberAlbum(album);
    }
}

export function getAlbumSnapshot(
    albumId: Id<"albums"> | string,
): Album | undefined {
    return snapshots.get(String(albumId));
}

export function __resetAlbumSnapshotsForTests(): void {
    snapshots.clear();
}
