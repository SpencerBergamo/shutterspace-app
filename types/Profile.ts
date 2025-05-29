export interface Profile {
    id: string;
    joined: Date;
    authProvider: "email" | "google" | "apple";
    email: string;
    avatarUrl: string;
    nickname: string;

    storageUsage: {
        total: number;
        limit: number;
        lastCalculated: Date;
    },

    friends: {
        id: string;
        status: "pending" | "accepted" | "rejected";
        since: Date;
    }[];

    blockedUsers: {
        id: string;
        since: Date;
        reason?: string;
    }[];
}