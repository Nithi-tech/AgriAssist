// ============================================================================
// CACHE UTILITY - Memory Cache for Market Prices
// ============================================================================

class Cache {
  constructor() {
    this.store = new Map();
    this.metadata = new Map();
  }

  /**
   * Set data in cache with expiration
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} ttlMs - Time to live in milliseconds (default: 7 days)
   */
  set(key, data, ttlMs = 7 * 24 * 60 * 60 * 1000) {
    const expiresAt = Date.now() + ttlMs;
    this.store.set(key, data);
    this.metadata.set(key, {
      createdAt: Date.now(),
      expiresAt,
      size: JSON.stringify(data).length
    });
    
    console.log(`🗄️ Cache SET: ${key} (${this.formatBytes(this.metadata.get(key).size)})`);
  }

  /**
   * Get data from cache
   * @param {string} key - Cache key
   * @returns {any|null} Cached data or null if expired/not found
   */
  get(key) {
    const metadata = this.metadata.get(key);
    
    if (!metadata) {
      console.log(`🗄️ Cache MISS: ${key} (not found)`);
      return null;
    }

    if (Date.now() > metadata.expiresAt) {
      console.log(`🗄️ Cache EXPIRED: ${key}`);
      this.delete(key);
      return null;
    }

    const data = this.store.get(key);
    console.log(`🗄️ Cache HIT: ${key} (${this.formatBytes(metadata.size)})`);
    return data;
  }

  /**
   * Delete from cache
   * @param {string} key - Cache key
   */
  delete(key) {
    this.store.delete(key);
    this.metadata.delete(key);
    console.log(`🗄️ Cache DELETE: ${key}`);
  }

  /**
   * Clear all cache
   */
  clear() {
    const keys = Array.from(this.store.keys());
    this.store.clear();
    this.metadata.clear();
    console.log(`🗄️ Cache CLEARED: ${keys.length} items removed`);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const keys = Array.from(this.metadata.keys());
    const totalSize = keys.reduce((sum, key) => {
      return sum + (this.metadata.get(key)?.size || 0);
    }, 0);

    return {
      itemCount: keys.length,
      totalSize: this.formatBytes(totalSize),
      items: keys.map(key => {
        const meta = this.metadata.get(key);
        return {
          key,
          size: this.formatBytes(meta.size),
          createdAt: new Date(meta.createdAt).toISOString(),
          expiresAt: new Date(meta.expiresAt).toISOString(),
          expired: Date.now() > meta.expiresAt
        };
      })
    };
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Check if key exists and is not expired
   */
  has(key) {
    const metadata = this.metadata.get(key);
    if (!metadata) return false;
    if (Date.now() > metadata.expiresAt) {
      this.delete(key);
      return false;
    }
    return true;
  }
}

// Create singleton instance
const cache = new Cache();

module.exports = cache;
