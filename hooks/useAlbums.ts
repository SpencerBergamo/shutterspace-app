import { useProfile } from "@/context/ProfileContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Album, AlbumFormData, MemberRole } from "@/types/Album";
import { useMutation, useQuery } from "convex/react";
import { useCallback } from "react";

interface UseAlbumsResult {
    albums: Album[];
    isLoading: boolean;
    getAlbumById: (id: Id<'albums'>) => Album | null;
    createAlbum: (data: AlbumFormData) => Promise<Id<'albums'>>;
    updateAlbum: (albumId: Id<'albums'>, data: AlbumFormData) => Promise<Id<'albums'> | null>;
    deleteAlbum: (albumId: Id<'albums'>) => Promise<void>;
}

export const useAlbums = (): UseAlbumsResult => {
    const { profile } = useProfile();

    const albums = useQuery(api.albums.getUserAlbums, { profileId: profile._id });
    const createMutation = useMutation(api.albums.createAlbum);
    const updateMutation = useMutation(api.albums.updateAlbum);
    const deleteMutation = useMutation(api.albums.deleteAlbum);

    const getAlbumById = useCallback((albumId: Id<'albums'>) => {
        const result = albums?.find(album => album._id === albumId);
        return result ?? null;
    }, [albums]);

    const getMemberRole = useCallback(async (albumId: Id<'albums'>): Promise<MemberRole> => {
        return useQuery(api.albums.getAlbumMembership, {
            albumId,
            profileId: profile._id,
        }) || 'not-a-member';
    }, [profile._id]);

    const createAlbum = useCallback(async (data: AlbumFormData): Promise<Id<'albums'>> => {

        const isDynamicThumbnail: boolean = data.thumbnailFileId ? true : false;

        const openInvites: boolean = data.openInvites ?? true;

        const dateRange: {
            start: string;
            end?: string;
        } | undefined = data.dateRange ? {
            start: data.dateRange.start.toISOString(),
            end: data.dateRange.end?.toISOString(),
        } : undefined;

        const location: {
            lat: number;
            lng: number;
            name?: string;
            address?: string;
        } | undefined = data.location ? {
            lat: data.location.lat,
            lng: data.location.lng,
            name: data.location?.name,
            address: data.location?.address,
        } : undefined;

        const expiresAt: number | undefined = data.expiresAt ? data.expiresAt.getTime() : undefined;

        return await createMutation({
            hostId: profile._id,
            title: data.title,
            description: data.description,
            isDynamicThumbnail,
            openInvites,
            dateRange,
            location,
            expiresAt,
        });
    }, [createMutation, profile._id]);

    const updateAlbum = useCallback(async (albumId: Id<'albums'>, data: AlbumFormData) => {

        const role = await getMemberRole(albumId);
        if (!role || (role !== 'host' && role !== 'moderator')) {
            throw new Error("Not authorized to update this album");
        }

        const updates = {
            title: data.title,
            description: data.description,
            isDynamicThumbnail: data.isDynamicThumbnail ?? false,
            openInvites: data.openInvites ?? true,
            dateRange: data.dateRange ? {
                start: data.dateRange.start.toISOString(),
                end: data.dateRange.end?.toISOString(),
            } : undefined,
            location: data.location,
            expiresAt: data.expiresAt ? data.expiresAt.getTime() : undefined,
            isDeleted: false,
        }

        return await updateMutation({
            albumId,
            ...updates,
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