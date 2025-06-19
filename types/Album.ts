// import { Timestamp } from 'firebase/firestore';

import { Id } from "@/convex/_generated/dataModel";

interface AlbumBase {
    title: string;
    description?: string;
    openInvites?: boolean;
    permanentCover?: string;
    eventDetails?: {
        date?: number;
        time?: string;
        location?: string;
    };
    expiresAt?: number;
}

export interface Album extends AlbumBase {
    _id: Id<'albums'>;
    createdAt: number;
    updatedAt: number;
    hostId: Id<'profiles'>;
    joinCode: string;
}

export type CreateAlbumData = AlbumBase;
export type UpdateAlbumData = Partial<AlbumBase>;