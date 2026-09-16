import { Id } from "../convex/_generated/dataModel";
import { AlbumCover } from "./Album";

export type InviteRole = 'member' | 'moderator';

export interface InviteCode {
    _id: Id<'inviteCodes'>;
    _creationTime: number;
    code: string;
    albumId: Id<'albums'>;
    createdBy: Id<'profiles'>;
    role: InviteRole;
}

export interface Invitation {
    albumId: Id<'albums'>;
    sender: string;
    ssoAvatarUrl?: string;
    avatarKey?: string;
    title: string;
    description?: string;
    cover?: AlbumCover;
    role: InviteRole;
    created: number;
    message?: string;
}