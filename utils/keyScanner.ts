/**
 * API Key Scanner Utility - Simplified for .env format
 * Automatically scans for API keys in .env format text
 */

export interface FoundApiKey {
  type: 'gemini';
  key: string;
  source: string;
  isValid: boolean;
}

export class ApiKeyScanner {
  
  /**
   * Parse .env format text and extract API keys
   */
  static parseEnvFormat(envText: string): FoundApiKey[] {
    const foundKeys: FoundApiKey[] = [];
    
    // First, try to split by newlines (normal format)
    let lines = envText.split('\n');
    
    // If there's only one line but it contains multiple KEY= patterns, split by KEY=
    if (lines.length === 1 && lines[0].includes('=')) {
      const singleLine = lines[0];
      // Split by pattern like KEYNAME="value"KEYNAME="value"
      const keyPattern = /([A-Z_]+)=["']?([^"']+?)["']?(?=[A-Z_]+=|$)/g;
      const matches = [...singleLine.matchAll(keyPattern)];
      
      if (matches.length > 1) {
        console.log(`🔧 Egy sorban ${matches.length} kulcs találva, szétbontás...`);
        lines = matches.map(match => `${match[1]}="${match[2]}"`);
      }
    }
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Skip comments and empty lines
      if (trimmedLine.startsWith('#') || !trimmedLine.includes('=')) {
        return;
      }
      
      // Parse KEY="value" or KEY=value format
      const match = trimmedLine.match(/^([A-Z_]+)=["']?([^"']+)["']?$/);
      if (!match) return;
      
      const [, envKey, value] = match;
      const cleanValue = value.replace(/^["']|["']$/g, ''); // Remove quotes
      
      // Identify API key type based on environment variable name and value format
      let keyType: 'gemini' | null = null;
      
      // Gemini keys (including numbered variants)
      if (envKey.includes('GEMINI') && cleanValue.startsWith('AIza')) {
        keyType = 'gemini';
      } 
      // Auto-detect by key format if env name doesn't match
      else if (cleanValue.startsWith('AIza')) {
        keyType = 'gemini'; // Gemini keys always start with AIza
      }
      
      if (keyType && this.isValidKey(keyType, cleanValue)) {
        foundKeys.push({
          type: keyType,
          key: cleanValue,
          source: `Line ${index + 1}: ${envKey}`,
          isValid: true
        });
      }
    });
    
    return foundKeys;
  }
  
  /**
   * Validate API key format
   */
  private static isValidKey(type: string, key: string): boolean {
    switch (type) {
      case 'gemini':
        return key.startsWith('AIza') && key.length >= 30;
      default:
        return false;
    }
  }
  
  /**
   * Auto-import found keys to localStorage
   */
  static importKeysToStorage(keys: FoundApiKey[]): void {
    // Group keys by type for pool functionality
    const geminiKeys = keys.filter(k => k.type === 'gemini').map(k => k.key);
    
    console.log('🔧 Kulcsok importálása:', {
      gemini: geminiKeys.length
    });
    
    // Import first Gemini key as primary
    if (geminiKeys.length > 0) {
      localStorage.setItem('gemini_api_key', geminiKeys[0]);
      console.log(`✅ Imported primary Gemini key: ${geminiKeys[0].substring(0, 15)}...`);
    }
    
    // Import ALL Gemini keys as pool (even if just 1)
    if (geminiKeys.length > 0) {
      localStorage.setItem('gemini_api_keys', geminiKeys.join('\n'));
      console.log(`✅ Imported ${geminiKeys.length} Gemini keys to pool`);
    } else {
      localStorage.removeItem('gemini_api_keys');
    }
  }
  
  /**
   * Get summary of found keys
   */
  static getSummary(keys: FoundApiKey[]): string {
    const counts = keys.reduce((acc, key) => {
      acc[key.type] = (acc[key.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const summary = Object.entries(counts)
      .map(([type, count]) => `${type.toUpperCase()}: ${count}`)
      .join(', ');
    
    return `Találva: ${summary} (összesen ${keys.length} kulcs)`;
  }
}