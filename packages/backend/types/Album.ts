import { Id } from "../convex/_generated/dataModel";
import * as ImagePicker from "expo-image-picker";
import { Profile } from "./Profile";

// ADR-0002: explicit album lifecycle.
// - active   — accepts uploads/edits.
// - archived — read-only; still viewable; owner may delete own content.
// - trashed  — host-deleted, hidden from everyone, restorable until purge.
export type AlbumStatus = 'active' | 'archived' | 'trashed';

export interface Album {
    _id: Id<'albums'>;
    _creationTime: number;
    hostId: Id<'profiles'>;
    title: string;
    description?: string;
    thumbnail?: Id<'media'>;
    isDynamicThumbnail: boolean;
    openInvites: boolean;
    // ADR-0002: epoch ms + the event's IANA timezone (venue-local display).
    dateRange?: { start: number, end?: number, timezone: string };
    // ADR-0002: scalar mirror of dateRange.start for efficient range queries.
    startsAt?: number;
    location?: {
        lat: number;
        lng: number;
        name?: string;
        address?: string;
    };
    status: AlbumStatus;
    updatedAt: number;
    expiresAt?: number;
    scheduledArchiveId?: Id<'_scheduled_functions'>;
    deletionScheduledAt?: number;
    scheduledDeletionId?: Id<'_scheduled_functions'>;
}

// ADR-0001: the persisted role on an `albumMembers` row.
export type StoredRole = 'member' | 'moderator';

// ADR-0001: membership lifecycle, kept separate from role.
export type MembershipStatus = 'pending' | 'active';

// The effective/derived role used for permission checks and display. `host` is
// derived from `albums.hostId` (no `albumMembers` row); `not-a-member` covers
// both non-members and not-yet-approved (`pending`) memberships.
export type MemberRole = 'host' | 'moderator' | 'member' | 'not-a-member';

export interface Membership {
    _id: Id<'albumMembers'>;
    albumId: Id<'albums'>;
    profileId: Id<'profiles'>;
    role: StoredRole;
    status: MembershipStatus;
    joinedAt: number;
    updatedAt?: number;
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