# ADR-0004: Storage quotas, comments, likes, and media metadata

- **Status:** Accepted
- **Date:** 2026-06-27
- **Deciders:** Domain grilling session (main)

## Context

`profiles.storageQuota` incremented on `createMedia` but never decremented on
delete, and the name implied a limit when it behaved as a one-way counter. Comments
and likes existed in `schema.ts` with almost no server logic (`comment.ts` is
read-only; no like mutations). Media carried editable-looking fields
(`filename`, `dateTaken`, `location`) with no update path and no policy.

Subscription tiers will eventually cap how much each user can store; social
features needed a moderation model consistent with ADR-0001.

## Decision

### Storage (per-user, global)

1. Replace `storageQuota` with two fields on `profiles`:
   - **`storageUsedBytes`** — running total of bytes currently stored by this
     profile **globally** (all albums).
   - **`storageLimitBytes`** — cap from subscription tier. Default free tier:
     **5 GB** (`5_368_709_120` bytes).

2. **Counting** — images and videos both use **actual file bytes** (`size` field).
   No separate video-minute accounting.

3. **Lifecycle** — increment `storageUsedBytes` when media is committed; **decrement
   on hard delete** (ADR-0002). Pending uploads that never complete `createMedia` do
   not count.

4. **Enforcement** — block at **upload-URL mint time** in `prepareImageUpload` /
   `prepareVideoUpload`: reject if
   `storageUsedBytes + incomingSize > storageLimitBytes`. Do not mint signed URLs
   for over-quota users (avoids orphaned R2/Stream objects).

### Comments

5. Any **active** album member may comment on any media, **including archived
   albums** (comments are social activity, not uploads).

6. **Deletion**: author deletes own; Moderator/Host deletes any comment (flat
   content moderation, consistent with media).

7. **Threading**: **one level** only — top-level comment + direct replies via
   `parentCommentId`; no deeper nesting.

### Likes

8. Any member may **toggle** one like per media (like/unlike).

9. Likes are **not moderatable** — only the liker can unlike. Allowed on any
   album status including archived.

### Media metadata

10. **Immutable after upload** — `filename`, `dateTaken`, and `location` are set at
    upload and cannot be edited. To change metadata, delete and re-upload.

## Consequences

- Schema migration on `schema/membership-lifecycle-redesign` branch: rename
  `storageQuota` → `storageUsedBytes`, add `storageLimitBytes` with 5 GB default.
- `deleteMedia` (and purge paths) must decrement `storageUsedBytes` by `media.size`.
- `r2.ts` / `cloudflare.ts` prepare-upload actions need `incomingSize` (or
  equivalent) and quota check before returning URLs.
- Implement comment create/delete mutations and like toggle mutation; enforce
  membership + album visibility.
- No `updateMedia` mutation for metadata; remove any UI affordance for editing
  EXIF fields.
- Update permission matrix in CONTEXT.md: "edit own content" is **delete own
  media**, not metadata edit.

## Alternatives considered

- **Per-album or host-pays quota:** rejected — per-user global is simpler for
  subscription billing and matches "my uploads, my bytes."
- **Enforce only at `createMedia`:** rejected — URLs already minted, orphan risk.
- **Block comments/likes on archived albums:** rejected — archived freezes uploads,
  not social engagement.
- **Editable metadata (caption, date, location):** rejected — immutable keeps v1
  simple; re-upload is the correction path.
- **Moderator removal of likes:** rejected — likes are lightweight signals, not
  moderatable content.
