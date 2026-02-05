// Google Drive optimalizált képkezelés - magas minőség megtartása
import { ImageCompressor } from './imageCompression';

export class GoogleDriveImageOptimizer {
  
  /**
   * Optimize image for Google Drive storage (high quality)
   */
  static async optimizeForGoogleDrive(base64Image: string, hasText: boolean = true): Promise<string> {
    try {
      console.log('🎨 Optimizing image for Google Drive (high quality)...');
      
      const originalSize = base64Image.length;
      console.log(`📊 Original size: ${Math.round(originalSize / 1024)}KB`);
      
      // High quality settings for Google Drive
      const settings = this.getGoogleDriveSettings(originalSize, hasText);
      
      console.log(`⚙️ Using settings: ${settings.description}`);
      console.log(`📐 Quality: ${settings.quality * 100}%, Max width: ${settings.maxWidth}px`);
      
      const optimizedImage = await ImageCompressor.compressBase64Image(
        base64Image, 
        settings.quality, 
        settings.maxWidth
      );
      
      const newSize = optimizedImage.length;
      const savings = Math.round((1 - newSize / originalSize) * 100);
      
      console.log(`✅ Google Drive optimization complete:`);
      console.log(`   Original: ${Math.round(originalSize / 1024)}KB`);
      console.log(`   Optimized: ${Math.round(newSize / 1024)}KB`);
      console.log(`   Savings: ${savings}% (Quality preserved: ${settings.quality * 100}%)`);
      
      return optimizedImage;
      
    } catch (error) {
      console.error('❌ Google Drive optimization failed:', error);
      return base64Image; // Return original on error
    }
  }
  
  /**
   * Get optimal settings for Google Drive storage
   */
  private static getGoogleDriveSettings(sizeBytes: number, hasText: boolean): {
    quality: number;
    maxWidth: number;
    description: string;
  } {
    const sizeMB = sizeBytes / (1024 * 1024);
    
    if (hasText) {
      // Prioritize text readability with high quality
      if (sizeMB > 15) {
        return { 
          quality: 0.85, 
          maxWidth: 1200, 
          description: 'Kiváló minőség (nagy kép, szöveg olvasható)' 
        };
      } else if (sizeMB > 10) {
        return { 
          quality: 0.9, 
          maxWidth: 1400, 
          description: 'Kiváló minőség (szöveg tökéletesen olvasható)' 
        };
      } else if (sizeMB > 5) {
        return { 
          quality: 0.92, 
          maxWidth: 1500, 
          description: 'Szinte eredeti minőség (szöveg kristálytiszta)' 
        };
      } else {
        return { 
          quality: 0.95, 
          maxWidth: 1600, 
          description: 'Eredeti minőség (minimális optimalizálás)' 
        };
      }
    } else {
      // Photo-only content can handle slightly more compression
      if (sizeMB > 15) {
        return { 
          quality: 0.8, 
          maxWidth: 1000, 
          description: 'Jó minőség (nagy fotó)' 
        };
      } else if (sizeMB > 10) {
        return { 
          quality: 0.85, 
          maxWidth: 1200, 
          description: 'Kiváló minőség (fotó)' 
        };
      } else {
        return { 
          quality: 0.9, 
          maxWidth: 1400, 
          description: 'Szinte eredeti minőség (fotó)' 
        };
      }
    }
  }
  
  /**
   * Check if image needs optimization
   */
  static needsOptimization(base64Image: string, maxSizeMB: number = 20): boolean {
    const sizeMB = base64Image.length / (1024 * 1024);
    return sizeMB > maxSizeMB;
  }
  
  /**
   * Get image analysis
   */
  static analyzeImage(base64Image: string): {
    sizeMB: number;
    sizeKB: number;
    format: string;
    needsOptimization: boolean;
    recommendedAction: string;
  } {
    const sizeBytes = base64Image.length;
    const sizeMB = sizeBytes / (1024 * 1024);
    const sizeKB = sizeBytes / 1024;
    
    // Detect format from data URL
    let format = 'unknown';
    if (base64Image.startsWith('data:image/png')) format = 'PNG';
    else if (base64Image.startsWith('data:image/jpeg')) format = 'JPEG';
    else if (base64Image.startsWith('data:image/webp')) format = 'WebP';
    
    const needsOptimization = this.needsOptimization(base64Image);
    
    let recommendedAction = '';
    if (sizeMB > 20) {
      recommendedAction = 'Erős optimalizálás szükséges (>20MB)';
    } else if (sizeMB > 10) {
      recommendedAction = 'Enyhe optimalizálás javasolt (>10MB)';
    } else if (sizeMB > 5) {
      recommendedAction = 'Opcionális optimalizálás (<10MB)';
    } else {
      recommendedAction = 'Optimalizálás nem szükséges (<5MB)';
    }
    
    return {
      sizeMB: Math.round(sizeMB * 100) / 100,
      sizeKB: Math.round(sizeKB),
      format,
      needsOptimization,
      recommendedAction
    };
  }
  
  /**
   * Batch optimize multiple images for Google Drive
   */
  static async batchOptimizeForGoogleDrive(
    images: Array<{id: string, base64: string, hasText?: boolean}>
  ): Promise<Array<{id: string, original: string, optimized: string, savings: number}>> {
    console.log(`🔄 Starting batch optimization for ${images.length} images (Google Drive quality)`);
    
    const results: Array<{id: string, original: string, optimized: string, savings: number}> = [];
    
    for (const image of images) {
      try {
        const optimized = await this.optimizeForGoogleDrive(image.base64, image.hasText);
        const savings = Math.round((1 - optimized.length / image.base64.length) * 100);
        
        results.push({
          id: image.id,
          original: image.base64,
          optimized: optimized,
          savings: savings
        });
        
        console.log(`✅ Optimized ${image.id}: ${savings}% size reduction, quality preserved`);
        
      } catch (error) {
        console.error(`❌ Failed to optimize ${image.id}:`, error);
        results.push({
          id: image.id,
          original: image.base64,
          optimized: image.base64, // Keep original on error
          savings: 0
        });
      }
    }
    
    const totalSavings = results.reduce((sum, r) => sum + r.savings, 0) / results.length;
    console.log(`🎯 Batch optimization complete: ${Math.round(totalSavings)}% average savings`);
    
    return results;
  }
}