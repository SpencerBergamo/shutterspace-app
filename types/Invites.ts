import { Id } from "@/convex/_generated/dataModel";

export interface Invite {
    code: string;
    albumId: Id<'albums'>;
    createdBy: Id<'profiles'>;
    role: 'member' | 'moderator';
}

export interface InviteCode extends Invite {
    _id: Id<'inviteCodes'>;
    _creationTime: number;
}

export interface Invitation extends InviteCode {
    sender: string;
    avatarUrl?: string;
    title: string;
    description?: string;
    coverUrl?: string;
    dateRange?: { start: string, end?: string };
    location?: {
        lat: number;
        lng: number;
        name?: string;
    };
    message?: string;
}