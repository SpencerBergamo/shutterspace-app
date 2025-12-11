# ShutterSpace Optimization Guide

## Problem Analysis

Your app is experiencing:
1. **Duplicate function calls** during navigation (same queries called 2x)
2. **Loading states on re-render** even though Convex has cached queries
3. **Performance issues** when navigating between screens with previously viewed data

## Root Causes

1. **Component re-mounts** during Expo Router navigation
2. **No memoization** on expensive components (AlbumCover, GalleryTile)
3. **Authorization checks** happening on every query (albumMembers:getMembership)
4. **Image URL fetching** happening independently per component via useSignedUrls

---

## Optimization Strategy

### 1. Component Memoization (CRITICAL)

#### What to Memoize:
- **AlbumCover**: Rendered in FlatList on HomeScreen
- **GalleryTile**: Rendered in FlatList on AlbumDetail
- **Any component using useQuery/useAction**

#### Why:
React Native re-renders components frequently during:
- Navigation transitions
- Parent state changes
- FlatList recycling

#### Implementation:

**AlbumCover.tsx**
```tsx
import { memo } from 'react';

// Wrap the entire component
const AlbumCover = memo(function AlbumCover({ album, width, height, onPress }: AlbumCoverProps) {
  // ... existing code
});

export default AlbumCover;
```

**GalleryTile.tsx**
```tsx
import { memo } from 'react';

const GalleryTile = memo(function GalleryTile({ 
  media, 
  itemSize, 
  onPress, 
  onLongPress, 
  onRetry, 
  onReady,
  selectionMode,
  isSelected 
}: GalleryTileProps) {
  // ... existing code
});

export default GalleryTile;
```

---

### 2. Batch Authorization Checks

**Problem**: Each `getImageURL` action internally calls `albumMembers:getMembership`

**Current Flow**:
```
AlbumCover #1 → getAlbumCoverMedia → getImageURL → getMembership ❌
AlbumCover #2 → getAlbumCoverMedia → getImageURL → getMembership ❌
AlbumCover #3 → getAlbumCoverMedia → getImageURL → getMembership ❌
```

**Solution 1: Cache membership at context level**

Create a MembershipContext to cache album memberships:

```tsx
// src/context/MembershipContext.tsx
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { createContext, useContext, useMemo } from "react";

interface MembershipContextType {
  getMembership: (albumId: Id<'albums'>) => 'host' | 'member' | 'not-a-member' | undefined;
  isLoading: boolean;
}

const MembershipContext = createContext<MembershipContextType | null>(null);

export function MembershipProvider({ children }: { children: React.ReactNode }) {
  // Fetch all memberships once
  const memberships = useQuery(api.albumMembers.getAllMemberships);
  
  const membershipMap = useMemo(() => {
    if (!memberships) return new Map();
    return new Map(memberships.map(m => [m.albumId, m.role]));
  }, [memberships]);

  const getMembership = (albumId: Id<'albums'>) => {
    return membershipMap.get(albumId) ?? 'not-a-member';
  };

  return (
    <MembershipContext.Provider value={{ getMembership, isLoading: !memberships }}>
      {children}
    </MembershipContext.Provider>
  );
}

export function useMembership() {
  const context = useContext(MembershipContext);
  if (!context) throw new Error('useMembership must be used within MembershipProvider');
  return context;
}
```

**Solution 2: Batch image URL requests**

Instead of each component requesting URLs independently, batch them:

```tsx
// src/hooks/useSignedUrlsBatch.ts
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAction } from "convex/react";
import { useEffect, useState } from "react";

// Global request queue
const urlQueue = new Map<string, Promise<string | null>>();

export function useSignedUrlsBatch(mediaIds: Id<'media'>[]) {
  const getImageURLBatch = useAction(api.r2.getImageURLBatch);
  const [urls, setUrls] = useState<Map<Id<'media'>, string>>(new Map());
  
  useEffect(() => {
    // Batch request for all media IDs
    const fetchUrls = async () => {
      const results = await getImageURLBatch({ mediaIds });
      setUrls(new Map(results.map((r, i) => [mediaIds[i], r])));
    };
    
    fetchUrls();
  }, [mediaIds]);
  
  return urls;
}
```

---

### 3. Image Caching Strategy

**expo-image** is already doing heavy lifting, but optimize further:

```tsx
// src/components/CachedImage.tsx
import { Image } from "expo-image";
import { memo } from "react";

const CachedImage = memo(function CachedImage({ 
  uri, 
  cacheKey, 
  width, 
  height,
  ...props 
}: any) {
  return (
    <Image
      source={{ uri, cacheKey }}
      style={{ width, height }}
      contentFit="cover"
      cachePolicy="memory-disk"
      placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }} // Add blurhash
      transition={100} // Reduce to 100ms for smoother feel
      {...props}
    />
  );
});

export default CachedImage;
```

---

### 4. FlatList Optimization

**HomeScreen.tsx & AlbumDetail.tsx**:

```tsx
<FlatList
  data={items}
  keyExtractor={(item) => item._id}
  
  // CRITICAL: Render more items initially to reduce loading states
  initialNumToRender={20}
  maxToRenderPerBatch={10}
  windowSize={21} // Render 10 screens worth of content
  
  // Prevent unmounting for better re-navigation
  removeClippedSubviews={false} // Keep mounted for faster re-entry
  
  // Performance optimizations
  getItemLayout={(data, index) => ({
    length: itemSize,
    offset: itemSize * index,
    index,
  })}
  
  renderItem={renderItem}
/>
```

---

### 5. Navigation Optimization

**Prevent unmounting screens** when navigating:

```tsx
// src/app/(home)/_layout.tsx
<Stack.Screen 
  name="album/[albumId]/index" 
  options={{
    headerShown: true,
    // Keep screen mounted when navigating away
    freezeOnBlur: true, // Expo Router v3+
  }} 
/>
```

---

### 6. Loading State Management

**Problem**: Even with cached Convex queries, UI shows loading states on re-render

**Solution**: Optimistic state + skeleton screens

```tsx
// src/hooks/useOptimisticQuery.ts
import { useQuery } from "convex/react";
import { useRef } from "react";

export function useOptimisticQuery<T>(query: any, args: any) {
  const data = useQuery(query, args);
  const lastDataRef = useRef<T | undefined>(undefined);
  
  // Keep last successful data for instant display
  if (data !== undefined) {
    lastDataRef.current = data;
  }
  
  return {
    data: data ?? lastDataRef.current,
    isLoading: data === undefined && lastDataRef.current === undefined,
    isRefreshing: data === undefined && lastDataRef.current !== undefined,
  };
}
```

**Usage**:
```tsx
const { data: albums, isLoading, isRefreshing } = useOptimisticQuery(
  api.albums.getUserAlbums
);

// Show data immediately, just add subtle refresh indicator
return (
  <View>
    {isRefreshing && <SmallSpinner />}
    <FlatList data={albums} ... />
  </View>
);
```

---

### 7. Preload Next Screen Data

**HomeScreen.tsx**: Preload album data on hover/press:

```tsx
const preloadAlbum = usePreloadedQuery(api.media.getMediaForAlbum);

<AlbumCover
  album={item}
  onPressIn={() => {
    // Preload album data before navigation
    preloadAlbum({ albumId: item._id, profileId });
  }}
  onPress={() => router.push(`/album/${item._id}`)}
/>
```

---

## Priority Implementation Order

### Phase 1: Immediate Fixes (30 min)
1. ✅ Add `memo()` to AlbumCover
2. ✅ Add `memo()` to GalleryTile
3. ✅ Update FlatList props (initialNumToRender, windowSize)

### Phase 2: Caching Layer (2 hours)
4. ✅ Implement useOptimisticQuery hook
5. ✅ Replace useQuery with useOptimisticQuery in key screens
6. ✅ Add MembershipContext for batched auth checks

### Phase 3: Advanced Optimizations (4 hours)
7. ✅ Implement batch image URL fetching
8. ✅ Add preloading on navigation
9. ✅ Implement skeleton screens instead of spinners

---

## Measuring Success

**Before**:
- 2x duplicate calls per navigation
- 500ms+ loading states on revisit
- Janky scrolling in galleries

**After**:
- 0 duplicate calls
- <100ms perceived load time on revisit (from cache)
- Smooth 60fps scrolling

---

## Testing Checklist

- [ ] Navigate Home → AlbumDetail → Home → AlbumDetail (should be instant)
- [ ] Scroll through 100+ images (should be smooth)
- [ ] Check Convex logs for duplicate calls (should be eliminated)
- [ ] Test on slow network (3G) - images should load progressively
- [ ] Background → Foreground app (should restore state instantly)

---

## Additional Resources

- [Convex Query Caching](https://docs.convex.dev/client/react#query-caching)
- [Expo Image Caching](https://docs.expo.dev/versions/latest/sdk/image/#caching)
- [React.memo Best Practices](https://react.dev/reference/react/memo)
- [FlatList Performance](https://reactnative.dev/docs/optimizing-flatlist-configuration)
