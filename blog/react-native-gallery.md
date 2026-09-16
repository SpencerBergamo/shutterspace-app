# React Native Gallery

*Learning notes while building Shutterspace — album list → gallery grid → full-screen viewer with Expo Router and realtime data.*

This isn’t a polished tutorial. It’s a dump of what I ran into while wiring a collaborative photo album experience in React Native / Expo, so I can come back and refine it later.

---

## The product shape

Users land on an **albums list**, tap into an **album gallery** (a dense grid of images/videos), then open a **viewer** for one item and swipe between neighbors.

That sounds like three screens. In practice it’s also:

- Shared state across gallery + viewer (same media pages, same signed delivery URLs)
- Instant feel when navigating *back* to something you’ve already loaded
- Native-feeling navigation (headers, back, sheets) without fighting Expo Router

---

## Navigation: album list → gallery → viewer

### File-based routes

Rough structure under the home stack:

```
(home)/
  albums.tsx
  album/[id]/
    _layout.tsx      ← provider + nested Stack
    index.tsx        ← gallery grid
    media/[mediaId].tsx
    settings.tsx     ← form sheet
```

Expo Router’s file system is the navigator. Dynamic `[id]` and `[mediaId]` become `useLocalSearchParams`. Links look like:

```tsx
<Link href={`/(home)/album/${albumId}`} asChild>
  <Pressable>...</Pressable>
</Link>

<Link href={`/album/${albumId}/media/${mediaId}`} asChild>
  <Pressable>...</Pressable>
</Link>
```

Extras that helped the list feel native:

- `Link.AppleZoom` for the cover → gallery transition (iOS)
- FlashList for the albums grid and gallery grid

### Nested stack vs parent stack

I wanted one React context (`AlbumGalleryProvider`) to stay mounted while moving between the grid and the viewer, so both screens share one paginated subscription and one delivery-prefetch pipeline.

That pushed me toward:

```tsx
// album/[id]/_layout.tsx
<AlbumGalleryProvider albumId={albumId}>
  <Stack>
    <Stack.Screen name="index" />
    <Stack.Screen name="media/[mediaId]" />
    <Stack.Screen name="settings" options={{ presentation: "formSheet" }} />
  </Stack>
</AlbumGalleryProvider>
```

And on the parent `(home)` stack: `headerShown: false` for `album/[id]`, so we don’t get double headers.

**Tradeoff I didn’t expect:** the nested stack’s *first* screen (gallery index) has nothing to go “back” to *inside* that stack, so the automatic back button disappears — even though the parent stack *can* go back to Albums.

Fix that worked for me: an explicit left toolbar back on the album index that calls `router.back()` (pops the parent). Media → gallery still gets the normal nested-stack back / close affordance.

### Slot vs Stack (lesson)

I briefly considered wrapping only with `<Slot />` so screens would hoist onto the parent stack and “just get” automatic back buttons.

`Slot` is great for **providers and shells** that shouldn’t invent a new navigator. It’s a bad fit when screens rely on **native stack chrome** — `Stack.Toolbar`, transparent headers, fade transitions into the viewer. Slot doesn’t draw that UI.

Rule I’m keeping:

| Need | Use |
|---|---|
| Context / auth / theme wrapper | `Slot` |
| Headers, toolbars, push/pop chrome | `Stack` |
| Shared album state + toolbars | Nested `Stack` + provider (and manual parent back on the root screen) |

### Form sheets

Album settings use `presentation: "formSheet"` with detents / grabber options available on the stack screen. That gives a floating sheet on iOS and a material-style bottom sheet on Android from one Expo Router config — better than rolling a custom modal for route-backed UI.

---

## Data fetching: what actually hurt

Realtime object data (albums, media rows, membership) comes from **Convex** (`useQuery` / `usePaginatedQuery`). Bytes for thumbnails and full images come from **signed URLs** that expire (on the order of an hour).

### Pagination

Galleries can get large. The client uses `usePaginatedQuery` with a page size of **60**, `loadMore` only when status is `CanLoadMore`, and FlashList `onEndReached` to page.

Early mistake: opening the **viewer** with a *second* independent paginated query. That meant a fresh first page, a spinner, and a possible wrong `initialIndex` until data caught up — even if the grid already had the page in memory.

Fix: hoist media into `AlbumGalleryProvider` so grid and viewer share one subscription + loaded pages. Viewer still calls `loadMore` near the end so swipe-through can grow the list.

### The 100–200ms flash on “warm” navigation

Coming back to an album I’d already opened showed a brief blank/spinner. Causes stacked on each other:

1. **UI treated `undefined` as empty screen** — full-screen `ActivityIndicator` even when Convex likely had a cached result or I had a last-known album title/cover from the list.
2. **Per-tile signed URL fetches** — each gallery cell ran its own effect → action → URL. Remount = async gap = gray tile / spinner before `expo-image` could paint.
3. **Hiding the `Image` behind a spinner** while `requesting` — amplified flashes instead of keeping the last bitmap.
4. **No shared URL memory** — covers had a small in-memory map; thumbnails didn’t, so every remount paid the same cost.

Direction that helped:

- **Stale-while-revalidate UI** — if you’ve ever shown album chrome or a tile, keep showing it while subscriptions / signatures refresh.
- **Album snapshot cache** — display-only last-known album from the list for warm handoff (not a second source of truth).
- **Batch delivery URLs** for a page of media IDs (membership once; resolve IDs server-side; don’t trust client-supplied storage keys).
- **Sync memory map + SQLite TTL** for signed URLs (expire a bit *before* the real signature TTL), then **`expo-image`** with stable `cacheKey` / `recyclingKey` = media id so new query strings don’t bust the byte cache.
- Prefer **keeping the Image mounted**; `transition={0}` when a URI is already warm; spinner only on true cold tiles.

Pending uploads (optimistic local rows) also belong in that shared album result so they don’t live in a disconnected hook the gallery never reads.

### Mental model

```
Convex pages  →  AlbumGalleryProvider  →  batch signed URLs
                      ↓                         ↓
                 gallery grid              memory → SQLite → expo-image
                 media viewer
```

Realtime patches still flow from Convex; caches are for *presentation*, not ownership of truth.

---

## Expo Router tools I actually touched

- File routes + dynamic segments
- Nested `Stack` layouts and `Stack.Screen` options
- `Stack.Toolbar` / menus on gallery and viewer
- `Link` (+ Apple Zoom on album cards)
- `presentation: "formSheet"` for settings
- `router.back()` / `router.setParams` in the viewer as the current media id changes
- The Slot vs Stack distinction when designing providers

---

## Still rough / next passes

- Polish the nested-root back control so it feels 100% system-native
- Tighten sheet detents and Android in-sheet chrome (headers inside form sheets are limited on Android)
- Decide how aggressive prefetch should be for viewer neighbors
- Write smaller notes per topic (pagination only, signed-URL cache only) instead of one mega post

---

## Takeaway

The gallery wasn’t hard because “grids are hard.” It was hard because **navigation lifetime** and **data lifetime** don’t line up unless you design them together: a provider that outlives grid↔viewer, pagination that isn’t duplicated, and image delivery that doesn’t blank the UI on every remount.

Expo Router gives you the native stack pieces; the learning curve is knowing when a nested stack helps (shared chrome + shared context) and when it steals your back button — and treating signed, expiring media URLs as a first-class caching problem, not an afterthought in each tile’s `useEffect`.
