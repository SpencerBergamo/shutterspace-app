// import { Timestamp } from 'firebase/firestore';

import { Id } from "@/convex/_generated/dataModel";

export interface Album {
    // albumId: string;
    _id: Id<'albums'>;
    title: string;
    description?: string;
    thumbnail?: string;
    createdAt: number;
    updatedAt: number;
    hostId: string;
    joinCode: string;
    openInvites: boolean;
    permanentCover?: string;
    eventDetails?: {
        date?: number;
        time?: string;
        location?: string;
    };
    expiresAt?: number;
} 