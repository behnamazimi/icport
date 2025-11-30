/**
 * Shared cache manager for platform adapters
 * Provides common cache management functionality
 */

interface CachedItem<T> {
  data: T;
  timestamp: number;
}

export class CacheManager<T> {
  private cache: Map<number, CachedItem<T>> = new Map();
  private readonly timeout: number;
  private readonly maxSize: number;

  constructor(timeout: number = 30000, maxSize: number = 1000) {
    this.timeout = timeout;
    this.maxSize = maxSize;
  }

  /**
   * Get cached item if it exists and is not expired
   */
  get(key: number): T | undefined {
    const cached = this.cache.get(key);
    if (!cached) return undefined;

    const now = Date.now();
    if (now - cached.timestamp > this.timeout) {
      // Expired, remove it
      this.cache.delete(key);
      return undefined;
    }

    return cached.data;
  }

  /**
   * Set cached item
   */
  set(key: number, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Check if key exists in cache and is valid
   */
  has(key: number): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;

    const now = Date.now();
    if (now - cached.timestamp > this.timeout) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete cached item
   */
  delete(key: number): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Cleanup expired cache entries and limit cache size
   */
  cleanup(): void {
    const now = Date.now();
    const entriesToDelete: number[] = [];

    // Remove expired entries
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.timeout) {
        entriesToDelete.push(key);
      }
    }

    for (const key of entriesToDelete) {
      this.cache.delete(key);
    }

    // If cache is still too large, remove oldest entries
    if (this.cache.size > this.maxSize) {
      const sortedEntries = Array.from(this.cache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      );

      const toRemove = sortedEntries.slice(0, this.cache.size - this.maxSize);
      for (const [key] of toRemove) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}
