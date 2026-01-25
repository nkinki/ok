// Safe localStorage wrapper that handles quota exceeded errors

export class SafeStorage {
  /**
   * Safely set item in localStorage with quota handling
   */
  static setItem(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.code === 22) {
        console.warn(`⚠️ localStorage quota exceeded for key: ${key}`);
        
        // Try to clean up some space
        this.emergencyCleanup();
        
        // Try again
        try {
          localStorage.setItem(key, value);
          console.log(`✅ Successfully stored ${key} after cleanup`);
          return true;
        } catch (secondError) {
          console.error(`❌ Failed to store ${key} even after cleanup`);
          return false;
        }
      } else {
        console.error(`❌ localStorage error for ${key}:`, error);
        return false;
      }
    }
  }

  /**
   * Safely get item from localStorage
   */
  static getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`❌ localStorage read error for ${key}:`, error);
      return null;
    }
  }

  /**
   * Safely remove item from localStorage
   */
  static removeItem(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`❌ localStorage remove error for ${key}:`, error);
      return false;
    }
  }

  /**
   * Emergency cleanup of old data
   */
  private static emergencyCleanup(): void {
    const keysToRemove: string[] = [];
    
    // Find old session data to remove
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('session_') ||
        key.startsWith('drive_session_') ||
        key.includes('_results') ||
        key.includes('_summary') ||
        key.includes('_cache')
      )) {
        keysToRemove.push(key);
      }
    }
    
    // Remove oldest items first (keep only 2 most recent)
    keysToRemove.sort().slice(0, -2).forEach(key => {
      try {
        localStorage.removeItem(key);
        console.log(`🗑️ Removed old data: ${key}`);
      } catch (error) {
        console.warn(`⚠️ Could not remove ${key}:`, error);
      }
    });
  }

  /**
   * Check if localStorage is available and has space
   */
  static isAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get approximate storage usage
   */
  static getUsage(): { used: number; percentage: number } {
    let used = 0;
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            used += key.length + value.length;
          }
        }
      }
    } catch (error) {
      console.warn('Could not calculate storage usage:', error);
    }
    
    const estimated = 5 * 1024 * 1024; // 5MB estimate
    return {
      used,
      percentage: Math.round((used / estimated) * 100)
    };
  }
}

export default SafeStorage;