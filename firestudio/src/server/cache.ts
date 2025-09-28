/**
 * Simple in-memory LRU cache with TTL support
 * Server-only caching utility for eNAM market data
 */

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

class LRUCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  private evictLRU(): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
  }

  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    // Clean up expired entries periodically
    if (this.cache.size > this.maxSize * 0.8) {
      this.evictExpired();
    }

    // Ensure we don't exceed max size
    this.evictLRU();

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    this.evictExpired();
    return this.cache.size;
  }
}

// Singleton cache instance
const cacheInstance = new LRUCache(200);

// Default TTL from environment or 60 minutes
const DEFAULT_TTL_MS = process.env.ENAM_CACHE_TTL_MS 
  ? parseInt(process.env.ENAM_CACHE_TTL_MS, 10)
  : 60 * 60 * 1000; // 60 minutes

export function getCache<T>(key: string): T | undefined {
  return cacheInstance.get<T>(key);
}

export function setCache<T>(key: string, value: T, ttlMs: number = DEFAULT_TTL_MS): void {
  cacheInstance.set(key, value, ttlMs);
}

export function clearCache(): void {
  cacheInstance.clear();
}

export function getCacheStats() {
  return {
    size: cacheInstance.size(),
    maxSize: 200,
    defaultTtl: DEFAULT_TTL_MS,
  };
}
