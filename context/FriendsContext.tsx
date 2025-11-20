

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Friend } from "@/types/Friend";
import { useMutation, useQuery } from "convex/react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

type AcceptStatus = "accepted" | "blocked";

interface FriendsContextType {
    isLoading: boolean;
    friends: Friend[];
    sendFriendRequest: (friendId: Id<'profiles'>) => Promise<void>;
    acceptFriendRequest: (friendshipId: Id<'friendships'>, status?: AcceptStatus) => Promise<void>;
    removeFriend: (friendId: Id<'profiles'>) => Promise<void>;
}

const FriendsContext = createContext<FriendsContextType | null>(null);

export const FriendsProvider = ({ children }: { children: React.ReactNode }) => {

    // State
    const [isLoading, setIsLoading] = useState(true);

    // Provider Data
    const friends = useQuery(api.friendships.getFriends);

    // Provider Functions
    const send = useMutation(api.friendships.sendFriendRequest);
    const accept = useMutation(api.friendships.acceptFriendRequest);
    const remove = useMutation(api.friendships.removeFriend);

    useEffect(() => {
        if (friends !== undefined) {
            setIsLoading(false);
        }
    }, [friends]);

    const sendFriendRequest = useCallback(async (friendId: Id<"profiles">) => {
        try {
            await send({ friendId });
        } catch (e) {
            console.error('Failed to send friend request', e);
        }
    }, [send]);

    const acceptFriendRequest = useCallback(async (friendshipId: Id<"friendships">, status?: AcceptStatus) => {
        try {
            await accept({ friendshipId, status: status });
        } catch (e) {
            console.error('Failed to accept friend request', e);
        }
    }, [accept]);

    const removeFriend = useCallback(async (friendId: Id<"profiles">) => {
        try {
            await remove({ friendId });
        } catch (e) {
            console.error('Failed to remove friend', e);
        }
    }, [remove]);

    if (friends === undefined) return null;

    const value = {
        isLoading,
        friends,
        sendFriendRequest,
        acceptFriendRequest,
        removeFriend,
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
