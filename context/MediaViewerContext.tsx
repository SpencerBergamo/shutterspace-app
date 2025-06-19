import { DbMedia } from "@/types/Media";
import { createContext, ReactNode, useContext, useState } from "react";

interface MediaViewerContextType {
    media: DbMedia[];
    currentIndex: number;
    setCurrentIndex: (index: number) => void;
    setMediaToView: (media: DbMedia[], initialIndex?: number) => void; // fn to se before navigating to the viewer
    clearMediaToView: () => void; // fn to clear the media to view
}

const MediaViewerContext = createContext<MediaViewerContextType | null>(null);

export const MediaViewerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [media, setMedia] = useState<DbMedia[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(0);

    const setMediaToView = (media: DbMedia[], initialIndex = 0) => {
        setMedia(media);
        setCurrentIndex(initialIndex ?? 0);
    }

    const clearMediaToView = () => setMediaToView([]);

    return (<MediaViewerContext.Provider value={{ media, currentIndex, setCurrentIndex, setMediaToView, clearMediaToView }}>
        {children}
    </MediaViewerContext.Provider>);
}

export const useMediaViewerContext = () => {
    const context = useContext(MediaViewerContext);
    if (!context) throw new Error('useMediaViewerContext must be used within a MediaViewerProvider');
    return context;
}