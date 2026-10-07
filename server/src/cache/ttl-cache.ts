interface CacheEntry<T> {
  expiresAt: number;
  value: Promise<T>;
}

// Caches pending and settled loads, so concurrent requests for one key share a single upstream call.
// Failed loads are dropped, and the oldest entry is evicted once the cache is full.
export class TtlCache<T> {
  private readonly entries = new Map<string, CacheEntry<T>>();

  public constructor(
    private readonly ttlMs: number,
    private readonly maxEntries: number
  ) {}

  public get(key: string, load: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const cached = this.entries.get(key);

    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    this.entries.delete(key);

    const value = load();

    value.catch(() => {
      if (this.entries.get(key)?.value === value) {
        this.entries.delete(key);
      }
    });
    this.entries.set(key, { expiresAt: now + this.ttlMs, value });

    if (this.entries.size > this.maxEntries) {
      const oldestKey = this.entries.keys().next().value;

      if (oldestKey !== undefined) {
        this.entries.delete(oldestKey);
      }
    }

    return value;
  }
}
