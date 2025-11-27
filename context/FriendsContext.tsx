import { api } from "@/convex/_generated/api";
import { Friendship } from "@/types/Friend";
import { useQuery } from "convex/react";
import { createContext, useContext, useEffect, useState } from "react";

interface FriendsContextType {
    isLoading: boolean;
    friendships: Friendship[];
}

const FriendsContext = createContext<FriendsContextType | null>(null);

export const FriendsProvider = ({ children }: { children: React.ReactNode }) => {

    // State
    const [isLoading, setIsLoading] = useState(true);

    // Provider Data
    const friendships: Friendship[] | undefined = useQuery(api.friendships.getFriendships);

    // Convex

    useEffect(() => {
        if (friendships !== undefined) {
            setIsLoading(false);
        }
    }, [friendships]);


    if (friendships === undefined) return null;

    const value = {
        isLoading,
        friendships,
    }

    return (
        <FriendsContext.Provider
            value={value}
        >
            {children}
        </FriendsContext.Provider>
    );
};

export const useFriends = (): FriendsContextType => {
    const ctx = useContext(FriendsContext);
    if (!ctx) throw new Error("useFriends must be used within a FriendsProvider");
    return ctx;
};
