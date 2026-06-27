import { Doc, Id } from "../_generated/dataModel";
import { MutationCtx } from "../_generated/server";

/** ADR-0004: default free-tier storage cap — 5 GB. */
export const DEFAULT_STORAGE_LIMIT_BYTES = 5_368_709_120;

export function storageUsed(profile: Doc<"profiles">): number {
    return profile.storageUsedBytes ?? 0;
}

export function storageLimit(profile: Doc<"profiles">): number {
    return profile.storageLimitBytes ?? DEFAULT_STORAGE_LIMIT_BYTES;
}

/** ADR-0004 enforcement: would this upload exceed the user's cap? */
export function wouldExceedQuota(
    profile: Doc<"profiles">,
    incomingSize: number,
): boolean {
    return storageUsed(profile) + incomingSize > storageLimit(profile);
}

/** Adjust a profile's used bytes, clamped at zero. */
export async function adjustStorageUsed(
    ctx: MutationCtx,
    profileId: Id<"profiles">,
    deltaBytes: number,
): Promise<void> {
    if (deltaBytes === 0) return;
    const profile = await ctx.db.get(profileId);
    if (!profile) return;
    const next = Math.max(0, storageUsed(profile) + deltaBytes);
    await ctx.db.patch(profileId, { storageUsedBytes: next });
}
