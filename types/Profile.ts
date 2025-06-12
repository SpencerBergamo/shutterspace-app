import { Id } from "@/convex/_generated/dataModel";

export interface Profile {
    _id: Id<'profiles'>;
    joined: number;
    authProvider: "email" | "google" | "apple";
    email: string;
    avatarUrl: string;
    nickname: string;
}