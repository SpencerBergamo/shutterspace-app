import { useCallback } from 'react';
import { useMediaCache as useMediaCacheContext } from '@/context/MediaCacheContext';
import { Id } from '@/convex/_generated/dataModel';

export function useMediaCache() {
    const context = useMediaCacheContext();

    /**
     * Gets cached media, attempts to cache if not found
     * @param mediaId - The media ID to retrieve
     * @param albumId - The album ID (required for caching if not already cached)
     * @param profileId - The profile ID (required for caching if not already cached)
     * @param subType - For videos: 'thumbnail' or 'video'
     * @returns Promise<{localUri: string} | null>
     */
    const getOrCacheMedia = useCallback(async (
        mediaId: Id<'media'>, 
        albumId: Id<'albums'>, 
        profileId: Id<'profiles'>, 
        subType?: 'thumbnail' | 'video'
    ) => {
        try {
            // First, try to get from cache
            let cachedMedia = await context.getCachedMedia(mediaId, subType);
            
            if (!cachedMedia) {
                // Not cached, attempt to cache it
                console.log(`Caching media ${mediaId}${subType ? `_${subType}` : ''}`);
                await context.cacheMedia(mediaId, albumId, profileId);
                
                // Try to get it again after caching
                cachedMedia = await context.getCachedMedia(mediaId, subType);
            }
            
            if (cachedMedia) {
                return { localUri: cachedMedia.localUri };
            }
            
            return null;
        } catch (error) {
            console.error('Failed to get or cache media:', error);
            return null;
        }
    }, [context]);

    /**
     * Gets cached image with automatic fallback to caching
     */
    const getCachedImage = useCallback(async (
        mediaId: Id<'media'>, 
        albumId: Id<'albums'>, 
        profileId: Id<'profiles'>
    ) => {
        return await getOrCacheMedia(mediaId, albumId, profileId);
    }, [getOrCacheMedia]);

    /**
     * Gets cached video thumbnail with automatic fallback to caching
     */
    const getCachedVideoThumbnail = useCallback(async (
        mediaId: Id<'media'>, 
        albumId: Id<'albums'>, 
        profileId: Id<'profiles'>
    ) => {
        return await getOrCacheMedia(mediaId, albumId, profileId, 'thumbnail');
    }, [getOrCacheMedia]);

    /**
     * Gets cached video file with automatic fallback to caching
     */
    const getCachedVideo = useCallback(async (
        mediaId: Id<'media'>, 
        albumId: Id<'albums'>, 
        profileId: Id<'profiles'>
    ) => {
        return await getOrCacheMedia(mediaId, albumId, profileId, 'video');
    }, [getOrCacheMedia]);

    /**
     * Preloads media into cache (useful for album preloading)
     */
    const preloadMedia = useCallback(async (
        mediaIds: Id<'media'>[], 
        albumId: Id<'albums'>, 
        profileId: Id<'profiles'>
    ) => {
        const promises = mediaIds.map(mediaId => 
            context.cacheMedia(mediaId, albumId, profileId).catch(error => {
                console.warn(`Failed to preload media ${mediaId}:`, error);
                return [];
            })
        );
        
        const results = await Promise.all(promises);
        const totalCached = results.reduce((sum, entries) => sum + entries.length, 0);
        
        console.log(`Preloaded ${totalCached} media files for album ${albumId}`);
        return totalCached;
    }, [context]);

    /**
     * Tracks album access for cleanup purposes
     */
    const accessAlbum = useCallback(async (
        albumId: Id<'albums'>, 
        profileId: Id<'profiles'>
    ) => {
        await context.trackAlbumAccess(albumId, profileId);
    }, [context]);

    return {
        // Core functions
        getCachedMedia: context.getCachedMedia,
        cacheMedia: context.cacheMedia,
        
        // Convenience functions
        getCachedImage,
        getCachedVideoThumbnail,
        getCachedVideo,
        preloadMedia,
        accessAlbum,
        
        // Management functions
        clearAlbumCache: context.clearAlbumCache,
        performCleanup: context.performCleanup,
        clearAll: context.clearAll,
        getCacheStats: context.getCacheStats,
    };
}

export default useMediaCache;