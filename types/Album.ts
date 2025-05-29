// import { Timestamp } from 'firebase/firestore';

export interface Message {
    // Add message properties as needed
    id: string;
    content: string;
    senderId: string;
    timestamp: Date;
}

export interface AlbumCover {
    // Add album cover properties as needed
    url: string;
    thumbnailUrl: string;
}

export interface Album {
    // albumId: string;
    title: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
    hostId: string;
    joinCode: string;
    openInvites: boolean;
    permanentCover?: string;
    eventDetails?: {
        date: Date;
        time: string;
        location: string;
    };
    expiresAt?: number;
} 