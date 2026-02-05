// Image caching utility to reduce Supabase egress
export class ImageCache {
  private static readonly CACHE_PREFIX = 'okos_img_';
  private static readonly CACHE_VERSION = 'v1';
  private static readonly MAX_CACHE_SIZE_MB = 50; // Maximum cache size in MB
  private static readonly CACHE_EXPIRY_DAYS = 7; // Cache expiry in days

  /**
   * Generate cache key for an image
   */
  private static getCacheKey(imageId: string): string {
    return `${this.CACHE_PREFIX}${this.CACHE_VERSION}_${imageId}`;
  }

  /**
   * Get cached image data
   */
  static getCachedImage(imageId: string): string | null {
    try {
      const cacheKey = this.getCacheKey(imageId);
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const now = Date.now();
      const expiryTime = cacheData.timestamp + (this.CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

      // Check if cache is expired
      if (now > expiryTime) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      console.log('📦 Image loaded from cache:', imageId);
      return cacheData.imageData;
    } catch (error) {
      console.warn('Cache read error:', error);
      return null;
    }
  }

  /**
   * Cache image data
   */
  static setCachedImage(imageId: string, imageData: string): void {
    try {
      // Check cache size before adding
      if (!this.canAddToCache(imageData)) {
        console.warn('⚠️ Cache full, cleaning old entries...');
        this.cleanOldEntries();
        
        // Try again after cleaning
        if (!this.canAddToCache(imageData)) {
          console.warn('⚠️ Image too large for cache, skipping:', imageId);
          return;
        }
      }

      const cacheKey = this.getCacheKey(imageId);
      const cacheData = {
        imageData,
        timestamp: Date.now(),
        size: imageData.length
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log('💾 Image cached:', imageId, `(${Math.round(imageData.length / 1024)}KB)`);
    } catch (error) {
      console.warn('Cache write error:', error);
      // Try to clean cache and retry once
      this.cleanOldEntries();
      try {
        const cacheKey = this.getCacheKey(imageId);
        const cacheData = {
          imageData,
          timestamp: Date.now(),
          size: imageData.length
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      } catch (retryError) {
        console.warn('Cache retry failed:', retryError);
      }
    }
  }

  /**
   * Check if we can add more data to cache
   */
  private static canAddToCache(newData: string): boolean {
    const currentSize = this.getCurrentCacheSize();
    const newDataSize = newData.length;
    const maxSizeBytes = this.MAX_CACHE_SIZE_MB * 1024 * 1024;
    
    return (currentSize + newDataSize) <= maxSizeBytes;
  }

  /**
   * Get current cache size in bytes
   */
  private static getCurrentCacheSize(): number {
    let totalSize = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.CACHE_PREFIX)) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }
    }
    
    return totalSize;
  }

  /**
   * Clean old cache entries
   */
  private static cleanOldEntries(): void {
    const entries: Array<{key: string, timestamp: number, size: number}> = [];
    
    // Collect all cache entries with timestamps
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.CACHE_PREFIX)) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const cacheData = JSON.parse(value);
            entries.push({
              key,
              timestamp: cacheData.timestamp || 0,
              size: cacheData.size || value.length
            });
          }
        } catch (error) {
          // Remove corrupted entries
          localStorage.removeItem(key);
        }
      }
    }

    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a.timestamp - b.timestamp);

    // Remove oldest entries until we're under 80% of max size
    const targetSize = this.MAX_CACHE_SIZE_MB * 1024 * 1024 * 0.8;
    let currentSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    let removedCount = 0;

    for (const entry of entries) {
      if (currentSize <= targetSize) break;
      
      localStorage.removeItem(entry.key);
      currentSize -= entry.size;
      removedCount++;
    }

    if (removedCount > 0) {
      console.log(`🧹 Cleaned ${removedCount} old cache entries`);
    }
  }

  /**
   * Clear all cached images
   */
  static clearCache(): void {
    const keys: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.CACHE_PREFIX)) {
        keys.push(key);
      }
    }

    keys.forEach(key => localStorage.removeItem(key));
    console.log(`🗑️ Cleared ${keys.length} cached images`);
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): {
    entryCount: number;
    totalSizeMB: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
  } {
    let entryCount = 0;
    let totalSize = 0;
    let oldestTimestamp = Infinity;
    let newestTimestamp = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.CACHE_PREFIX)) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const cacheData = JSON.parse(value);
            entryCount++;
            totalSize += cacheData.size || value.length;
            
            if (cacheData.timestamp) {
              oldestTimestamp = Math.min(oldestTimestamp, cacheData.timestamp);
              newestTimestamp = Math.max(newestTimestamp, cacheData.timestamp);
            }
          }
        } catch (error) {
          // Skip corrupted entries
        }
      }
    }

    return {
      entryCount,
      totalSizeMB: Math.round((totalSize / (1024 * 1024)) * 100) / 100,
      oldestEntry: oldestTimestamp === Infinity ? null : new Date(oldestTimestamp),
      newestEntry: newestTimestamp === 0 ? null : new Date(newestTimestamp)
    };
  }
}