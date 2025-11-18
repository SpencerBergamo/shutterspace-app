import { Id } from "@/convex/_generated/dataModel";
import * as ImagePicker from "expo-image-picker";
import { Profile } from "./Profile";

export type MemberRole = 'host' | 'moderator' | 'member' | 'not-a-member';

export interface Album {
    _id: Id<'albums'>;
    _creationTime: number;
    hostId: Id<'profiles'>;
    title: string;
    description?: string;
    thumbnail?: Id<'media'>;
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
    deletionScheduledAt?: number;
    scheduledDeletionId?: Id<'_scheduled_functions'>;
}

export interface AlbumFormData {
    title: string;
    description?: string;
    thumbnail?: Id<'media'>;
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

interface ValidationField {
    isValid: boolean;
    error: string | null;
}

export interface AlbumFormState {
    hasChanges: boolean;
    isFormValid: boolean;

    title: ValidationField;
    description: ValidationField;

    // -- TODO Fields --
    // thumbnailFileId?: ValidationField;
    // dateRange?: ValidationField;
    // location?: ValidationField;
    // expiresAt?: ValidationField;
}

export type CreateAlbumData = Omit<Album, '_id'>;
export type UpdateAlbumData = Partial<AlbumFormData>;


export type PublicAlbumInfo = Omit<
    Album,
    | 'hostId'
    | 'isDynamicThumbnail'
    | 'openInvites'> & {
        host: Profile;
    };