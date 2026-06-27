# ADR-0001: Membership roles and album ownership

- **Status:** Accepted
- **Date:** 2026-06-27
- **Deciders:** Album / membership design grilling session

## Context

The product description named two roles (Owner, Member), but `schema.ts` shipped a
four-value `albumMembers.role` union (`host | moderator | member | pending`) and a
separate `albums.hostId` field. This created three concrete problems:

1. **`moderator` was undefined product-wise** yet had real power in code
   (`canDelete` let moderators delete others' content) — a security surface no one
   had deliberately signed off on.
2. **`pending` was a lifecycle state masquerading as a role.** Living in the same
   union as real roles meant every member-listing query had to remember to filter
   it out; one miss and a not-yet-approved user appears as a real member.
3. **Ownership was stored twice** — `albums.hostId` *and* an `albumMembers` row with
   `role: 'host'`. With ownership transfer being a desired feature, these two would
   inevitably drift.

## Decision

**Three roles, owner stored once, lifecycle split from role.**

1. **Roles are `member` and `moderator` only.** `albumMembers.role` becomes
   `v.union(v.literal('member'), v.literal('moderator'))`.

2. **The Host is `albums.hostId` — the single source of truth for ownership.**
   `host` is removed from the role union. Exactly one owner is enforced
   structurally by the single field. The Host has **no** `albumMembers` row; Host
   identity is derived (`profile._id === album.hostId`). The Host is still a full
   participant: the **roster** = Host (from `hostId`) ∪ `active` `albumMembers`.

3. **Membership lifecycle is a separate `status` field**, not a role:
   `v.union(v.literal('pending'), v.literal('active'))`. `pending` leaves the role
   union entirely.

4. **Permission model** (see CONTEXT.md for the full matrix). Key boundaries:
   - **Host-only:** delete the album, transfer ownership, promote/demote moderators.
   - **Moderator (in addition to member rights):** edit album/event settings,
     remove **members** (not peers/Host), and delete **any non-Host content**
     (including other moderators').
   - **Member:** upload; full control (edit metadata + delete) of **own** content
     only.
   - **Content moderation is flat** among non-Hosts; **people removal is ranked**
     (moderators may only remove members). This asymmetry is intentional: it closes
     the loophole where a moderator who *can't* demote a peer could simply *kick*
     them instead.

## Consequences

- `albumMembers.role` and the `inviteCodes.role` unions align (invites already used
  `member | moderator`).
- A migration is required: existing `role: 'host'` rows fold into `albums.hostId`
  (or are dropped if redundant); `role: 'pending'` rows become
  `status: 'pending'` with a real role; existing active rows get `status: 'active'`.
- All membership/authorization checks must treat the Host as an implicit member
  (`profileId === hostId`) rather than expecting an `albumMembers` row.
- **Ownership transfer** becomes a single-field write to `albums.hostId` (plus
  ensuring the outgoing Host gets an appropriate `albumMembers` row if they remain
  in the album). No multi-row role rewrite, so no drift.
- Nothing structurally prevents listing the Host in member queries incorrectly;
  the roster-union rule must be applied consistently (one shared helper).

## Alternatives considered

- **`albumMembers` as the only source of ownership** (`role: 'host'`): rejected —
  "exactly one host" becomes a code-enforced invariant instead of a structural one.
- **Keep both `hostId` and a `host` role row, sync transactionally:** rejected —
  permanent sync burden that breaks first at ownership transfer.
- **Drop moderator entirely (two roles):** rejected — moderation of others' content
  by a non-owner is a genuine product need.
