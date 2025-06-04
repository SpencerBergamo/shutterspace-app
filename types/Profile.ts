export interface Profile {
    _id: string;
    joined: number;
    authProvider: "email" | "google" | "apple";
    email: string;
    avatarUrl: string;
    nickname: string;

    storageUsage: {
        total: number;
        limit: number;
        lastCalculated: number;
    },

    friends: {
        id: string;
        status: "pending" | "accepted" | "rejected";
        since: number;
    }[];

    blockedUsers: {
        id: string;
        since: number;
        reason?: string;
    }[];
}