import { useProfile } from "@/context/ProfileContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Album, AlbumFormData, MemberRole } from "@/types/Album";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useState } from "react";

interface UseAlbumsResult {
    albums: Album[];
    isLoading: boolean;
    getAlbumById: (id: Id<'albums'>) => Album | undefined;
    createAlbum: (data: AlbumFormData) => Promise<Id<'albums'>>;
    updateAlbum: (albumId: Id<'albums'>, data: AlbumFormData) => Promise<Id<'albums'> | null>;
    deleteAlbum: (albumId: Id<'albums'>) => Promise<void>;
}

export const useAlbums = (): UseAlbumsResult => {
    const { profile } = useProfile();

    const [isLoading, setIsLoading] = useState(false);
    const albums = useQuery(api.albums.getUserAlbums, { profileId: profile?._id });
    const createMutation = useMutation(api.albums.createAlbum);
    const updateMutation = useMutation(api.albums.updateAlbum);
    const deleteMutation = useMutation(api.albums.deleteAlbum);

    const getAlbumById = useCallback((albumId: Id<'albums'>) => {
        return albums?.find(album => album._id === albumId);
    }, [albums]);

    const getMemberRole = useCallback(async (albumId: Id<'albums'>): Promise<MemberRole> => {
        return useQuery(api.albums.getAlbumMembership, {
            albumId,
            profileId: profile._id,
        }) || 'not-a-member';
    }, [profile._id]);

    const createAlbum = useCallback(async (data: AlbumFormData): Promise<Id<'albums'>> => {
        return await createMutation({
            createdAt: Date.now(),
            updatedAt: Date.now(),
            hostId: profile._id,
            title: data.title,
            description: data.description,
            openInvites: data.openInvites ?? true,
            // coverImageUrl: data.coverImageUrl,
            staticCover: data.staticCover ?? false,
            dateRange: data.dateRange ? {
                start: data.dateRange.start.toISOString(),
                end: data.dateRange.end?.toISOString(),
            } : undefined,
            location: data.location,
        });
    }, [createMutation, profile._id]);

    const updateAlbum = useCallback(async (albumId: Id<'albums'>, data: AlbumFormData) => {

        const role = await getMemberRole(albumId);
        if (!role || (role !== 'host' && role !== 'moderator')) {
            throw new Error("Not authorized to update this album");
        }

        return await updateMutation({
            albumId,
            ...{
                title: data.title,
                description: data.description,
                coverImageUrl: data.coverImageUrl,
                staticCover: data.staticCover ?? false,
                dateRange: data.dateRange ? {
                    start: data.dateRange.start.toISOString(),
                    end: data.dateRange.end?.toISOString(),
                } : undefined,
                location: data.location,
                openInvites: data.openInvites ?? true,
            },
        });
    }, [updateMutation]);

    const deleteAlbum = useCallback(async (albumId: Id<'albums'>) => {
        const role = await getMemberRole(albumId);
        if (!role || role !== 'host') {
            throw new Error("Not authorized to delete this album");
        }

        await deleteMutation({ albumId });
    }, [deleteMutation, profile._id]);

    return {
        albums: albums || [],
        isLoading: albums === undefined,
        getAlbumById,
        createAlbum,
        updateAlbum,
        deleteAlbum,
    }
}