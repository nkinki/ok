// localStorage utility functions for quota management

export interface StorageInfo {
  used: number;
  available: number;
  total: number;
  usedMB: number;
  availableMB: number;
  totalMB: number;
  percentage: number;
}

export class StorageManager {
  /**
   * Get localStorage usage information
   */
  static getStorageInfo(): StorageInfo {
    let used = 0;
    
    // Calculate used space
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          used += key.length + value.length;
        }
      }
    }
    
    // Estimate total available space (varies by browser, typically 5-10MB)
    const total = 10 * 1024 * 1024; // 10MB estimate
    const available = total - used;
    
    return {
      used,
      available,
      total,
      usedMB: Math.round(used / 1024 / 1024 * 100) / 100,
      availableMB: Math.round(available / 1024 / 1024 * 100) / 100,
      totalMB: Math.round(total / 1024 / 1024 * 100) / 100,
      percentage: Math.round((used / total) * 100)
    };
  }

  /**
   * Check if there's enough space for data
   */
  static hasSpaceFor(dataSize: number): boolean {
    const info = this.getStorageInfo();
    return info.available > dataSize * 1.1; // 10% buffer
  }

  /**
   * Clean up old session data
   */
  static cleanupOldSessions(keepCount: number = 3): number {
    const sessionKeys: { key: string; timestamp: number }[] = [];
    
    // Find all session-related keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('session_') || 
        key.startsWith('drive_session_') || 
        key.startsWith('teacher_drive_session_')
      )) {
        // Try to extract timestamp from session data
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            const timestamp = parsed.createdAt ? new Date(parsed.createdAt).getTime() : 0;
            sessionKeys.push({ key, timestamp });
          }
        } catch (error) {
          // If can't parse, assume it's old and should be removed
          sessionKeys.push({ key, timestamp: 0 });
        }
      }
    }
    
    // Sort by timestamp (newest first)
    sessionKeys.sort((a, b) => b.timestamp - a.timestamp);
    
    // Remove old sessions (keep only the specified count)
    const toRemove = sessionKeys.slice(keepCount);
    let removedCount = 0;
    
    toRemove.forEach(({ key }) => {
      localStorage.removeItem(key);
      removedCount++;
      console.log('🗑️ Removed old session:', key);
    });
    
    return removedCount;
  }

  /**
   * Clean up all non-essential data
   */
  static emergencyCleanup(): number {
    let removedCount = 0;
    const keysToRemove: string[] = [];
    
    // Find all non-essential keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('session_') ||
        key.startsWith('drive_session_') ||
        key.startsWith('teacher_drive_session_') ||
        key.startsWith('exerciseLibrary') ||
        key.startsWith('okosgyakorlo_collections') ||
        key.includes('_cache') ||
        key.includes('_temp')
      )) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      removedCount++;
    });
    
    console.log(`🧹 Emergency cleanup: removed ${removedCount} items`);
    return removedCount;
  }

  /**
   * Try to store data with automatic cleanup if needed
   */
  static safeSetItem(key: string, value: string): boolean {
    try {
      // First attempt
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.code === 22) {
        console.warn('⚠️ localStorage quota exceeded, attempting cleanup...');
        
        // Try cleanup and retry
        const cleaned = this.cleanupOldSessions(2);
        
        if (cleaned > 0) {
          try {
            localStorage.setItem(key, value);
            console.log('✅ Successfully stored after cleanup');
            return true;
          } catch (secondError) {
            console.warn('⚠️ Still failed after cleanup, trying emergency cleanup...');
            
            // Emergency cleanup
            this.emergencyCleanup();
            
            try {
              localStorage.setItem(key, value);
              console.log('✅ Successfully stored after emergency cleanup');
              return true;
            } catch (finalError) {
              console.error('❌ Failed to store even after emergency cleanup');
              return false;
            }
          }
        } else {
          console.error('❌ No old sessions to clean up');
          return false;
        }
      } else {
        console.error('❌ localStorage error:', error);
        return false;
      }
    }
  }

  /**
   * Get storage usage by category
   */
  static getUsageByCategory(): Record<string, number> {
    const categories: Record<string, number> = {
      sessions: 0,
      library: 0,
      settings: 0,
      other: 0
    };
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        const size = value ? key.length + value.length : 0;
        
        if (key.startsWith('session_') || key.startsWith('drive_session_') || key.startsWith('teacher_drive_session_')) {
          categories.sessions += size;
        } else if (key.includes('Library') || key.includes('library') || key.includes('collections')) {
          categories.library += size;
        } else if (key.includes('api_key') || key.includes('settings') || key.includes('config')) {
          categories.settings += size;
        } else {
          categories.other += size;
        }
      }
    }
    
    return categories;
  }
}

export default StorageManager;