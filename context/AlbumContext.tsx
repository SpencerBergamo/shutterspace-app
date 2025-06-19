import { Id } from "@/convex/_generated/dataModel";
import { Album } from "@/types/Album";
import { createContext, ReactNode, useContext } from "react";


interface AlbumContextType {
    albumId: Id<'albums'>;
    album: Album;
}

const AlbumContext = createContext<AlbumContextType | undefined>(undefined);

export const AlbumProvider = ({ children, albumId, album, }: {
    children: ReactNode;
    albumId: Id<'albums'>;
    album: Album;
}) => {
    return (
        <AlbumContext.Provider value={{ albumId, album }}>
            {children}
        </AlbumContext.Provider>
    );
};

export const useAlbum = () => {
    const context = useContext(AlbumContext);
    if (!context) {
        throw new Error('useAlbum must be used within an AlbumProvider');
    }
    return context;
}