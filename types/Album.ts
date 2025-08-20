import { Id } from "@/convex/_generated/dataModel";
import * as ImagePicker from "expo-image-picker";

export type MemberRole = 'host' | 'moderator' | 'member' | 'not-a-member';

export interface Album {
    _id: Id<'albums'>;
    _creationTime: number;

    hostId: Id<'profiles'>;
    title: string;
    description?: string;

    thumbnailFileId?: Id<'media'>;
    isDynamicThumbnail: boolean;

    openInvites: boolean;
    dateRange?: { start: string, end?: string };
    location?: {
        lat: number;
        lng: number;
        name?: string;
        address?: string;
    };

    updatedAt: number;
    expiresAt?: number;
    isDeleted: boolean;
}

export interface AlbumFormData {
    title: string;
    description?: string;
    thumbnailFileId?: Id<'media'>;
    file?: ImagePicker.ImagePickerAsset;
    isDynamicThumbnail?: boolean;
    dateRange?: { start: Date, end?: Date };
    location?: {
        lat: number;
        lng: number;
        name?: string;
        address?: string;
    };
    openInvites?: boolean;
    expiresAt?: Date;
}

export type CreateAlbumData = Omit<Album, '_id'>;
export type UpdateAlbumData = Partial<AlbumFormData>;
