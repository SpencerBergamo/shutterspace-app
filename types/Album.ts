import { Id } from "@/convex/_generated/dataModel";
import * as ImagePicker from "expo-image-picker";

export type MemberRole = 'host' | 'moderator' | 'member' | 'not-a-member';

export interface Album {
    _id: Id<'albums'>;
    createdAt: number;
    updatedAt: number;
    hostId: Id<'profiles'>;
    title: string;
    description?: string;
    coverImageUrl?: string;
    staticCover: boolean;
    dateRange?: { start: string, end?: string };
    location?: string;
    openInvites: boolean;
    expiresAt?: number;
}

export interface AlbumFormData {
    title: string;
    description?: string;
    coverImageUrl?: string;
    coverImage?: ImagePicker.ImagePickerAsset;
    staticCover?: boolean;
    dateRange?: { start: Date, end?: Date };
    location?: string;
    openInvites?: boolean;
}

export type CreateAlbumData = Omit<Album, '_id'>;
export type UpdateAlbumData = Partial<AlbumFormData>;
