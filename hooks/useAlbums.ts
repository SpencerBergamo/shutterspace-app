import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Album, CreateAlbumData, UpdateAlbumData } from "@/types/Album";
import { useMutation, useQuery } from "convex/react";
import { useCallback } from "react";

interface UseAlbumsResult {
    albums: Album[];
    isLoading: boolean;
    getAlbumById: (id: Id<'albums'>) => Album;
    createAlbum: (data: CreateAlbumData) => Promise<Id<'albums'>>;
    updateAlbum: (albumId: Id<'albums'>, data: UpdateAlbumData) => Promise<Id<'albums'> | null>;
    deleteAlbum: (albumId: Id<'albums'>) => Promise<void>;
}

export const useAlbums = (profileId: Id<'profiles'>): UseAlbumsResult => {
    const albums = useQuery(api.albums.getUserAlbums, { profileId });
    const createMutation = useMutation(api.albums.createAlbum);
    const updateMutation = useMutation(api.albums.updateAlbum);
    const deleteMutation = useMutation(api.albums.deleteAlbum);

    const getAlbumById = useCallback((albumId: Id<'albums'>) => {
        const album = albums?.find(album => album._id === albumId);
        if (!album) throw new Error('Album not found');
        return album;
    }, [albums]);

    const getMemberRole = useCallback(async (albumId: Id<'albums'>) => {
        return useQuery(api.albums.getAlbumMembership, {
            albumId,
            profileId,
        });
    }, [profileId]);

    const createAlbum = useCallback(async (data: CreateAlbumData) => {
        return await createMutation(data);
    }, [createMutation, profileId]);

    const updateAlbum = useCallback(async (albumId: Id<'albums'>, data: UpdateAlbumData) => {

        const role = await getMemberRole(albumId);
        if (!role || (role !== 'host' && role !== 'moderator')) {
            throw new Error("Not authorized to update this album");
        }

        return await updateMutation({
            albumId,
            ...data,
        });
    }, [updateMutation]);

    const deleteAlbum = useCallback(async (albumId: Id<'albums'>) => {
        const role = await getMemberRole(albumId);
        if (!role || role !== 'host') {
            throw new Error("Not authorized to delete this album");
        }

        await deleteMutation({ albumId });
    }, [deleteMutation, profileId]);

    return {
        albums: albums || [],
        isLoading: albums === undefined,
        getAlbumById,
        createAlbum,
        updateAlbum,
        deleteAlbum,
    }
}