# ADR-0003: Joining model and invitations

- **Status:** Accepted
- **Date:** 2026-06-27
- **Deciders:** Album / membership design grilling session

## Context

The schema exposed several uncoordinated entry mechanisms with no defined
relationship: `inviteCodes` (role-granting codes), `albums.openInvites` *and*
`inviteCodes.openInvites` (the same flag in two places), a `friendships` social
graph, and a per-profile `profiles.shareCode`. Separately, ADR-0001 introduced a
membership `status: pending | active` with no defined producer of `pending` — and a
lifecycle state with no producer is dead weight.

Two concepts were conflated under the name "openInvites":
1. **who may create invites**, and
2. **whether redeeming a link requires approval**.

## Decision

**Two doors into an album, governed by two album-level policy flags.**

### Doors
1. **Invite link** (`inviteCodes`) — points at an album, carries a `role`
   (`member` | `moderator`). Redeeming joins the album; the *effect* of redeeming is
   decided by album policy (below), not by the link.
2. **Direct-add** — a Host/Moderator adds an existing **in-app friend**. This is
   **instant `active`** (friendship implies consent; the member can leave). Users
   are not searchable by name/username, so direct-add draws only from the adder's
   friends graph.

### Album-level policy flags
3. **`albums.openInvites: boolean`** — whether ordinary **Members** may create
   invite links. Host and Moderators may always create them. (This is *who may
   invite*.)
4. **`albums.autoAccept: boolean`** — redeeming a link with `true` → **instant
   `active`**; with `false` → **`pending`** until a Host/Moderator approves. (This
   is *how joining is moderated*, and is the **sole producer of `pending`**.)
   `inviteCodes.openInvites` is removed — the flag lives on the album only.

### Role/escalation rules
5. Members and Moderators may only invite at **`role: member`**. Granting
   **`moderator`** — whether via invite link or promotion — is **Host-only**,
   consistent with ADR-0001. (So a moderator-role `inviteCodes` row can only be
   created by the Host.)

### Social graph
6. **`friendships`** is a standalone social graph
   (`pending`/`accepted`/`blocked`/`rejected`). Its primary product purpose is to
   enable **direct-add**. **`profiles.shareCode`** generates "add me as a friend"
   links and is the *only* way to connect, since there is deliberately no
   username/name search.

## Consequences

- `inviteCodes` keeps `albumId`, `createdBy`, `code`, `role`; **`openInvites` is
  removed** from it.
- `albums` gains **`autoAccept: boolean`** (alongside the existing `openInvites`).
- Membership `status: 'pending'` is produced exactly when `autoAccept = false` and a
  link is redeemed; cleared to `'active'` on Host/Moderator approval. This is the
  one and only `pending` producer — if `autoAccept` is removed, `pending` must be
  removed too.
- Authorization on "create invite": allowed if actor is Host/Moderator, **or**
  actor is Member and `album.openInvites === true`; and `role === 'moderator'`
  requires actor is Host.
- Privacy: no name/username discovery; all connections go through `shareCode`
  friend-links, and album entry is always via an explicit link or a friend-based
  direct-add.

## Alternatives considered

- **Per-link `autoAccept`/role settings:** rejected in favor of **album-level**
  policy for simplicity. Tradeoff accepted: a Host cannot mint a single one-off
  instant link while keeping the rest of the album moderated; the album's policy
  applies uniformly to all links.
- **Username/name search for finding people:** rejected for privacy; connection is
  intentionally gated behind `shareCode` friend-links.
- **Drop `friendships` entirely:** rejected — it is load-bearing for consent-free
  direct-add and is the app's social connective tissue.
