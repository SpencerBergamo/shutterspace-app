import { Id } from "../convex/_generated/dataModel";

export interface Profile {
    _id: Id<'profiles'>;
    firebaseUID: string;
    joined: number;
    authProvider: "email" | "google" | "apple";
    email: string;
    nickname: string;
    avatarKey?: string;
    ssoAvatarUrl?: string;
    shareCode?: string;
    // ADR-0004: per-user global storage accounting.
    storageUsedBytes?: number;
    storageLimitBytes?: number;
}

export interface PublicProfile {
    _id: Id<'profiles'>;
    nickname: string;
    avatarKey?: string;
    ssoAvatarUrl?: string;
}