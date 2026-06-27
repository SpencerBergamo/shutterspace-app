# ADR-0002: Event time representation and album lifecycle

- **Status:** Accepted
- **Date:** 2026-06-27
- **Deciders:** Album / membership design grilling session

## Context

The `albums` table mixed four time-ish fields with two incompatible
representations, and encoded album state implicitly:

- `dateRange: { start: string, end?: string }` — event dates as **ISO strings**.
- `expiresAt: number`, `deletionScheduledAt: number`, `updatedAt: number` — epoch
  **numbers**.
- `media.dateTaken: string` — another string timestamp.
- `isDeleted: boolean` + `expiresAt` + `deletionScheduledAt` — album state had to
  be inferred by evaluating three fields against `now()`, with many nonsensical
  combinations.

Problems: (1) strings vs numbers can't be compared without conversion; (2) naive
ISO strings have no timezone, which silently shifts *located, time-sensitive*
events when host and venue differ; (3) "what state is this album in" was implicit
and ambiguous.

## Decision

### Time representation
1. **All moments-in-time are epoch milliseconds (`number`).** This includes event
   `start`/`end` and `media.dateTaken`. No ISO strings in the database.
2. **Events store their IANA timezone** alongside the instant:
   `dateRange: { start: number, end?: number, timezone: string }`, derived from the
   event's location. Event times **display in venue-local time** regardless of the
   viewer's device.

### Lifecycle: three distinct stages, explicit status
3. **`albums.status: 'active' | 'archived' | 'trashed'`** replaces the `isDeleted`
   boolean. State is explicit and queryable.
   - **active** — accepts uploads/edits.
   - **archived** — read-only (no new uploads/edits); still viewable indefinitely;
     a member may still delete their *own* content.
   - **trashed** — host-deleted, hidden from everyone, restorable until purge.
4. **`expiresAt` auto-archives only.** Default `expiresAt = event end + grace
   window` (so stragglers can upload); host may override. A scheduled function
   flips `active → archived` at `expiresAt`; readers may also defensively treat
   `active && now ≥ expiresAt` as archived. **Expiry never schedules a purge.**
5. **Purge is host-initiated, with undo.** Only the Host can delete an album.
   Deletion sets `status = 'trashed'`, schedules a hard purge at
   `deletionScheduledAt` via a Convex scheduled function (`scheduledDeletionId`),
   and allows **restore** until that time. Purge deletes Convex docs **and** the
   backing R2 objects / Stream videos.

### Media deletion
6. **Media deletion is an immediate hard delete** (doc + R2/Stream asset). There is
   no per-media soft delete — `media.isDeleted` is removed. Album-level **trash** is
   the only undo path. This holds even when the album is `archived` (members retain
   the right to delete their own content).

### Discovery / indexing
7. **No global discovery.** A user only ever sees albums they belong to. Date and
   location filtering is **scoped to the user's own albums** (a small set), so:
   - Heavy geo indexing (geohash) is **not** needed; proximity over the user's
     albums can be computed in memory.
   - For range queries by date, prefer a **scalar** (e.g. top-level `startsAt:
     number`) over the current object index `by_dateRange` on `{start,end}`.
   - `by_location` on the `{lat,lng,...}` object is not a real geo index; keep
     location as descriptive data and use text search on `name`/`address` if needed.

## Consequences

- Schema changes: `albums.isDeleted` → `status`; `dateRange` fields become numbers +
  `timezone`; `media.dateTaken` → number; drop `media.isDeleted`. Migration must map
  old `isDeleted` and timestamps accordingly and parse existing ISO strings to epoch.
- A scheduled function is needed to flip `active → archived` at `expiresAt` (in
  addition to the existing purge scheduler).
- Authorization/read paths key off `status` rather than recomputing from three
  fields. Archived read-only enforcement lives in upload/edit mutations; own-content
  delete remains allowed in archived.
- Indexes `by_dateRange` / `by_location` should be revisited (scalar `startsAt`;
  location as in-memory/text filter).

## Alternatives considered

- **Derive all state from timestamps + isDeleted at read time:** rejected — every
  reader recomputes state, and the bool/timestamp combinations remain ambiguous.
- **ISO strings everywhere:** rejected — human-readable but costlier to compare and
  invites naive (offset-less) values; epoch + explicit IANA zone is unambiguous.
- **Auto-purge on expiry:** rejected — expiry should archive, not destroy; purge is
  a deliberate, host-initiated, reversible action.
- **Per-media soft delete with restore:** rejected — adds a second trash system;
  album-level trash is sufficient and keeps storage cleanup immediate.
