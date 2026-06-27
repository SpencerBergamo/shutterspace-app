# Shutterspace — Domain Glossary (CONTEXT.md)

The canonical vocabulary for Shutterspace. Use these terms exactly — in code,
schema, UI copy, and conversation. If a term here and the code disagree, the code
is wrong until this file is changed deliberately.

Shutterspace is an Expo (iOS + Android) app for **collaborative photo/video albums**.
Stack: Firebase Auth (identity) · Convex (database + server logic) · Cloudflare
R2 (images/avatars) + Stream (video).

---

## People & access

- **Profile** — A Shutterspace user. Backed by a Firebase identity (`firebaseUID`),
  represented by the `profiles` table. One human = one profile.

- **Album** — A collaborative collection of media owned by exactly one Host. May
  optionally describe a time-bound, located **Event** (see below).

- **Host** — The single **Owner** of an album. Stored as `albums.hostId` (one
  field, one owner — structurally enforced). The Host is *not* stored as an
  `albumMembers` row; Host status is derived from `hostId`. The Host still counts
  as a full member of the album (appears in the roster, can upload/comment/like).
  "Owner" is the product-facing word; **Host** is the canonical domain term.

- **Moderator** — A trusted, non-owner member. May exist in any number per album.
  Powers above a Member, below the Host (see Permission model).

- **Member** — A regular participant. Can upload media and fully control **their
  own** content, but cannot act on others'.

- **Role** — A member's permission tier *within one album*: `member` or
  `moderator`. (Host is **not** a role — it is `albums.hostId`.) Lives on the
  `albumMembers.role` field.

- **Membership status** — The *lifecycle* state of a membership, kept **separate**
  from Role: `pending` (requested/invited, not yet active) or `active`. Splitting
  this from Role prevents a not-yet-approved person from ever being mistaken for a
  real member.

- **Roster** — The list of people in an album: the Host (derived from `hostId`)
  plus all `active` `albumMembers`.

## Permission model (per album)

| Capability | Member | Moderator | Host |
|---|---|---|---|
| Upload media | ✓ | ✓ | ✓ |
| Edit/delete **own** content (incl. metadata) | ✓ | ✓ | ✓ |
| Delete/moderate **others'** content | ✗ | ✓ — any **non-Host** content (incl. other moderators') | ✓ |
| Remove people | ✗ | members only | anyone |
| Promote/demote moderators | ✗ | ✗ | ✓ |
| Edit album/event settings (title, dates, location) | ✗ | ✓ | ✓ |
| Delete the whole album | ✗ | ✗ | ✓ |
| Transfer ownership | ✗ | ✗ | ✓ |

Two deliberate asymmetries:
- **Content moderation is flat** among non-Hosts: a Moderator may remove *any*
  non-Host's content, including another Moderator's. Host content is untouchable.
- **People removal is ranked**: a Moderator may only remove Members — never a
  peer Moderator or the Host. (Clean up anything; expel no peers.)

## Event & time

- **Event** — The optional time-and-place aspect of an album (a wedding, a trip, a
  party). An album with event data has a **date range** and (optionally) a
  **location**. Event data is descriptive *and* drives the lifecycle (see below).

- **Date range** — `{ start, end?, timezone }`. `start`/`end` are **epoch
  milliseconds**; `timezone` is the event's **IANA zone** (e.g.
  `America/New_York`), derived from the location, so the event displays in
  *venue-local* time regardless of the viewer's device.

- **Moment-in-time representation** — Every timestamp in the system (event
  start/end, `expiresAt`, `dateTaken`, etc.) is **epoch milliseconds (number)**.
  No ISO strings in the database. Timezone is stored separately only where
  venue-local display matters (the Event).

- **Album status** — Explicit lifecycle state: `active` → `archived` → `trashed`.
  - **active** — Normal; accepts uploads and edits.
  - **archived** — Read-only after expiry. New uploads/edits blocked, but a member
    may still **delete their own** content. Stays viewable indefinitely.
  - **trashed** — Host-deleted; hidden from everyone, restorable until purge.

- **`expiresAt`** — Epoch ms when the album auto-**archives**. Default = event
  `end` + a grace window (so stragglers can still upload); host may override.
  Expiry only archives — it **never** auto-purges.

- **Trash & purge** — Only the **Host** can delete an album. Deleting moves it to
  `trashed`, schedules a hard **purge** at `deletionScheduledAt` (a Convex
  scheduled function, `scheduledDeletionId`), and lets the host **restore** until
  then. Purge removes Convex docs **and** R2 objects / Stream videos.

## Media

- **Media** — A single image or video in an album (`media` table). Carries an
  `identifier` discriminated by `type: 'image' | 'video'`.
- **Image** — Stored in Cloudflare R2 (`uploads` bucket), keyed
  `album/{albumId}/{imageId}`. Served via short-lived signed URLs.
- **Video** — Stored in Cloudflare Stream (`requireSignedURLs`), referenced by
  `videoUid`. Played via signed HLS manifest.
- **Avatar** — A profile picture in R2 (`avatar` bucket, public).
- **Media deletion is immediate** — Deleting media (by its owner, or moderation by
  a Moderator/Host) is a **hard delete**: the doc and the R2/Stream asset are
  removed now. There is no per-media trash; album-level **trash** is the only undo.

## Joining & invitations

There are exactly two doors into an album: **invite links** and **direct-add**.

- **Invite link** — A 6-char code (`inviteCodes`) pointing at an album, carrying a
  **role** (`member` | `moderator`). Redeeming it joins the album; what happens on
  redeem is governed by the album's policy flags, not the link.

- **`openInvites`** (album policy) — May ordinary **Members** create invite links?
  Host and Moderators always can. (This is *who may invite* — nothing to do with
  approval.)

- **`autoAccept`** (album policy) — On redeeming a link: `true` → join **instantly
  as `active`**; `false` → land as **`pending`** until a Host/Moderator approves.
  (This is *how joining is moderated*.)

- **Invite role rules** — Members and Moderators may only invite at **`member`**.
  Granting **`moderator`** — by invite *or* promotion — is **Host-only** (see
  ADR-0001).

- **Direct-add** — A Host/Moderator adds an existing **in-app friend** to the album.
  This is **instant `active`** (friendship implies consent; the person can leave).
  Users are *not* searchable by name/username, so direct-add draws only from the
  adder's friends.

- **Friendship** — A connection between two Profiles (`friendships`;
  `pending`/`accepted`/`blocked`/`rejected`). A separate social graph whose main job
  is to enable direct-add.

- **Share code** — A per-Profile code (`profiles.shareCode`) used to create
  "add me as a friend" links. The *only* way to connect, since there is no
  username/name search.

---

*Still under design: storage quotas, comment/like moderation, media metadata edits.*
