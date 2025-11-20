import { Id } from "@/convex/_generated/dataModel";

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

export interface Friendship {
    _id: Id<'friendships'>;
    _creationTime: number;
    profileId: Id<'profiles'>;
    friendId: Id<'profiles'>;
    status: FriendshipStatus;
    createdAt: number;
    updatedAt: number;
}

export interface Friend {
    _id: Id<'profiles'>;
    friendshipId: Id<'friendships'>;
    nickname: string;
}