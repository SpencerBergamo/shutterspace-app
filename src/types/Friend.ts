import { Id } from "@/convex/_generated/dataModel";

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked' | 'rejected';

export interface Friendship {
    _id: Id<'friendships'>;
    _creationTime: number;
    senderId: Id<'profiles'>;
    recipientId: Id<'profiles'>;
    status: FriendshipStatus;
    createdAt: number;
    updatedAt: number;
}

export interface Friend {
    _id: Id<'profiles'>;
    nickname: string;
    ssoAvatarUrl?: string;
    avatarKey?: string;
}