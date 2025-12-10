import { Id } from "@/convex/_generated/dataModel";
import { MediaIdentifier } from "./Media";

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
    cover?: MediaIdentifier;
    role: InviteRole;
    created: number;
    message?: string;
}