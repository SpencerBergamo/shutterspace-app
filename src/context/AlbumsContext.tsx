import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Album } from "@/src/types/Album";
import { useQuery } from "convex/react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";


interface AlbumsContextType {
    isLoading: boolean;
    albums: Album[];
    getAlbum: (albumId: Id<'albums'>) => Album | null;
}

const AlbumsContext = createContext<AlbumsContextType | null>(null);

export const AlbumsProvider = ({ children }: { children: React.ReactNode }) => {

    // state
    const [isLoading, setIsLoading] = useState(true);

    // provider data
    const albums = useQuery(api.albums.getUserAlbums);

    useEffect(() => {
        if (albums !== undefined) {
            setIsLoading(false);
        }
    }, [albums]);

    const getAlbum = useCallback((albumId: Id<'albums'>) => {
        return albums?.find(album => album._id === albumId) ?? null;
    }, [albums]);

    if (albums === undefined) return null;

    const value = {
        isLoading,
        albums: albums,
        getAlbum,

    }

    return <AlbumsContext.Provider value={value}>
        {children}
    </AlbumsContext.Provider>
}

export function useAlbums() {
    const context = useContext(AlbumsContext);
    if (!context) {
        throw new Error('useAlbums must be used within a AlbumsProvider');
    }
    return context;
}