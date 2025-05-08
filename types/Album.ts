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
    albumId: string;
    hostId: string;
    expiresAt?: Date;
    joinToken: string;
    title: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
    lastMessage?: Message;
    albumCover?: AlbumCover;
    maxMembers: number;
    openInvites: boolean;
    joinRequests: string[];
    members: string[];
    moderators: string[];
    permenantCover?: string;
} 