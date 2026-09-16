import {
    __resetDeliveryCacheForTests,
    applyDeliveryBatch,
    ensureDeliveryUrl,
    getDeliveryUrlSync,
    invalidateDeliveryEntry,
    setDeliveryEntry,
} from "./mediaDeliveryCache";

jest.mock("expo-image", () => ({
    Image: {
        prefetch: jest.fn(() => Promise.resolve(true)),
    },
}));

jest.mock("@/src/hooks/useCache", () => ({
    getCached: jest.fn(async () => null),
    setCacheUntil: jest.fn(async () => undefined),
    removeCache: jest.fn(async () => undefined),
}));

describe("mediaDeliveryCache", () => {
    beforeEach(() => {
        __resetDeliveryCacheForTests();
        jest.clearAllMocks();
    });

    it("returns sync URLs after setDeliveryEntry", () => {
        setDeliveryEntry("m1", "media_thumbnail", "https://cdn/a.jpg", Date.now() + 60_000);
        expect(getDeliveryUrlSync("m1", "media_thumbnail")).toBe("https://cdn/a.jpg");
    });

    it("applies a batch into the sync memory cache", () => {
        applyDeliveryBatch([
            {
                key: "m1",
                purpose: "media_thumbnail",
                url: "https://cdn/1.jpg",
                expiresAt: Date.now() + 60_000,
                imageCacheKey: "m1",
            },
            {
                key: "m2",
                purpose: "media_thumbnail",
                url: "https://cdn/2.jpg",
                expiresAt: Date.now() + 60_000,
            },
        ]);

        expect(getDeliveryUrlSync("m1", "media_thumbnail")).toBe("https://cdn/1.jpg");
        expect(getDeliveryUrlSync("m2", "media_thumbnail")).toBe("https://cdn/2.jpg");
    });

    it("dedupes in-flight ensureDeliveryUrl calls", async () => {
        let resolveFetch!: (value: { url: string; expiresAt: number }) => void;
        const fetcher = jest.fn(
            () =>
                new Promise<{ url: string; expiresAt: number } | null>((resolve) => {
                    resolveFetch = resolve;
                }),
        );

        const p1 = ensureDeliveryUrl("m1", "media_thumbnail", fetcher);
        const p2 = ensureDeliveryUrl("m1", "media_thumbnail", fetcher);

        // Allow hydrate-from-disk to settle before the shared fetcher runs.
        await Promise.resolve();
        await Promise.resolve();

        expect(fetcher).toHaveBeenCalledTimes(1);

        resolveFetch({ url: "https://cdn/a.jpg", expiresAt: Date.now() + 60_000 });
        await expect(Promise.all([p1, p2])).resolves.toEqual([
            expect.objectContaining({ url: "https://cdn/a.jpg" }),
            expect.objectContaining({ url: "https://cdn/a.jpg" }),
        ]);
    });

    it("invalidates entries so the next ensure refetches", async () => {
        setDeliveryEntry("m1", "media_thumbnail", "https://cdn/old.jpg", Date.now() + 60_000);
        invalidateDeliveryEntry("m1", "media_thumbnail");
        expect(getDeliveryUrlSync("m1", "media_thumbnail")).toBeUndefined();

        const entry = await ensureDeliveryUrl("m1", "media_thumbnail", async () => ({
            url: "https://cdn/new.jpg",
            expiresAt: Date.now() + 60_000,
        }));

        expect(entry?.url).toBe("https://cdn/new.jpg");
    });
});
