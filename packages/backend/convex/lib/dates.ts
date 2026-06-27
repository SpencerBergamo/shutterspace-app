/**
 * ADR-0002: all moments-in-time are epoch milliseconds.
 *
 * Normalizes a media `dateTaken` value to epoch ms. Accepts:
 *  - a number (already epoch ms) — returned as-is,
 *  - an EXIF `DateTimeOriginal` string ("YYYY:MM:DD HH:MM:SS"), or
 *  - any Date.parse-able string.
 *
 * EXIF carries no timezone, so the wall-clock time is interpreted as UTC for a
 * deterministic, device-independent epoch.
 */
export function parseExifToEpoch(
    value: string | number | undefined | null,
): number | undefined {
    if (value === undefined || value === null) return undefined;
    if (typeof value === "number") return value;

    const exif = value.match(
        /^(\d{4})[:-](\d{2})[:-](\d{2})[ T](\d{2}):(\d{2}):(\d{2})/,
    );
    if (exif) {
        const [, y, mo, d, h, mi, s] = exif;
        return Date.UTC(+y, +mo - 1, +d, +h, +mi, +s);
    }

    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? undefined : parsed;
}
