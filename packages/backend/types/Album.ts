import * as ImagePicker from "expo-image-picker";
import { Id } from "../convex/_generated/dataModel";
import { Profile } from "./Profile";

// ADR-0002: explicit album lifecycle.
// - active   — accepts uploads/edits.
// - archived — read-only; still viewable; owner may delete own content.
// - trashed  — host-deleted, hidden from everyone, restorable until purge.
export type AlbumStatus = 'active' | 'archived' | 'trashed';

/** Denormalized album cover for list / header / invite surfaces. */
export type AlbumCover = {
    type: 'image';
    imageId: string;
    width: number;
    height: number;
    size?: number;
    mediaId?: Id<'media'>;
} | {
    type: 'video';
    videoUid: string;
    duration: number;
    width?: number;
    height?: number;
    mediaId?: Id<'media'>;
};

export interface Album {
    _id: Id<'albums'>;
    _creationTime: number;
    hostId: Id<'profiles'>;
    title: string;
    description?: string;
    /** @deprecated Legacy pin; dual-written alongside `cover` until dropAlbumThumbnails. */
    thumbnail?: Id<'media'>;
    cover?: AlbumCover;
    isDynamicThumbnail: boolean;
    openInvites: boolean;
    // ADR-0002: epoch ms + timezone (new) OR legacy ISO strings during dual-write.
    dateRange?:
        | { start: number; end?: number; timezone: string }
        | { start: string; end?: string };
    // ADR-0002: scalar mirror of dateRange.start for efficient range queries.
    startsAt?: number;
    location?: {
        lat: number;
        lng: number;
        name?: string;
        address?: string;
    };
    /** Optional until backfillAlbumLifecycleAndTimes; dual-read with `isDeleted`. */
    status?: AlbumStatus;
    /** @deprecated Dual-written until dropLegacyAlbumLifecycleFields. */
    isDeleted?: boolean;
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
    role: StoredRole | 'host' | 'pending';
    /** Optional until backfillAlbumMemberStatus. */
    status?: MembershipStatus;
    joinedAt: number;
    updatedAt?: number;
}

export interface AlbumFormData {
    title: string;
    description?: string;
    cover?: AlbumCover;
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