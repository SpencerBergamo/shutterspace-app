export type LRUEntry<V> = {
    value: V;
    expiresAt: number;
}

export class LRUCache<K, V> {
    private maxSize: number;
    private map: Map<K, LRUEntry<V>>;

    constructor(maxSize: number = 200) {
        this.maxSize = maxSize;
        this.map = new Map();
    }

    getEntries(): [K, LRUEntry<V>][] {
        return Array.from(this.map.entries());
    }

    get(key: K): V | undefined {
        const entry = this.map.get(key);
        if (!entry) return undefined;

        // expire 30 seconds early to prevent race conditions
        if (entry.expiresAt < Date.now() + 30_000) {
            this.map.delete(key);
            return undefined;
        }

        this.map.delete(key);
        this.map.set(key, entry);
        return entry.value;
    }

    set(key: K, value: V, ttlMs: number): void {
        const expiresAt = Date.now() + ttlMs;

        if (this.map.has(key)) {
            this.map.delete(key);
        } else if (this.map.size >= this.maxSize) {
            const firstKey = this.map.keys().next().value;
            if (!firstKey) console.error("No first key found");

            this.map.delete(firstKey as K);
        }

        this.map.set(key, { value, expiresAt });
    }

    has(key: K): boolean {
        return this.get(key) !== undefined;
    }

    delete(key: K): void {
        this.map.delete(key);
    }

    clear(): void { this.map.clear(); }

    size(): number { return this.map.size; }
}