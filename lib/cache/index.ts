/**
 * Custom In-Memory LRU Cache with TTL
 * No third-party dependencies — pure TypeScript.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  lastAccessed: number;
}

class LRUCache<T = unknown> {
  private capacity: number;
  private ttlMs: number;
  private cache: Map<string, CacheEntry<T>>;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(capacity: number = 200, ttlMs: number = 5 * 60 * 1000) {
    this.capacity = capacity;
    this.ttlMs = ttlMs;
    this.cache = new Map();
    // Periodic cleanup every minute
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.evictExpired(), 60_000);
    }
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Update access time (LRU: move to end by deleting + re-inserting)
    this.cache.delete(key);
    entry.lastAccessed = Date.now();
    this.cache.set(key, entry);

    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Evict LRU: Map preserves insertion order, first key = least recently used
      const lruKey = this.cache.keys().next().value;
      if (lruKey) this.cache.delete(lruKey);
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.ttlMs),
      lastAccessed: Date.now(),
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  /** Delete all keys matching a prefix. Use for namespace invalidation. */
  invalidatePattern(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  getStats() {
    return {
      size: this.cache.size,
      capacity: this.capacity,
      ttlMs: this.ttlMs,
    };
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

// ─── Cache TTL Constants ──────────────────────────────────────────────────────
export const TTL = {
  SHORT: 2 * 60 * 1000,       // 2 minutes
  MEDIUM: 5 * 60 * 1000,      // 5 minutes
  LONG: 10 * 60 * 1000,       // 10 minutes
  VERY_LONG: 60 * 60 * 1000,  // 1 hour
};

// ─── Singleton Cache Instances ────────────────────────────────────────────────
// Use global to survive Next.js hot reloads in development
declare global {
  // eslint-disable-next-line no-var
  var __courseCache: LRUCache | undefined;
  // eslint-disable-next-line no-var
  var __taxonomyCache: LRUCache | undefined;
  // eslint-disable-next-line no-var
  var __userCache: LRUCache | undefined;
}

export const courseCache: LRUCache =
  globalThis.__courseCache ?? (globalThis.__courseCache = new LRUCache(200, TTL.MEDIUM));

export const taxonomyCache: LRUCache =
  globalThis.__taxonomyCache ?? (globalThis.__taxonomyCache = new LRUCache(20, TTL.VERY_LONG));

export const userCache: LRUCache =
  globalThis.__userCache ?? (globalThis.__userCache = new LRUCache(500, TTL.MEDIUM));

export { LRUCache };
