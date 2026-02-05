// Google Drive Image Service - Supabase egress csökkentéshez (magas minőség)
import { GoogleDriveImageOptimizer } from '../utils/googleDriveImageOptimizer';

export class GoogleDriveImageService {
  
  /**
   * Upload image to Google Drive and return public URL (with high quality optimization)
   */
  static async uploadImage(imageBase64: string, exerciseId: string, fileName: string): Promise<string | null> {
    try {
      console.log('📤 Uploading image to Google Drive (high quality):', exerciseId, fileName);
      
      // Optimize for Google Drive (high quality, text-friendly)
      const optimizedImage = await GoogleDriveImageOptimizer.optimizeForGoogleDrive(imageBase64, true);
      
      const response = await fetch('/api/simple-api/images/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: optimizedImage, // Use optimized version
          exerciseId: exerciseId,
          fileName: fileName || `exercise_${exerciseId}.png`
        })
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.driveUrl) {
        console.log('✅ High quality image uploaded to Google Drive:', result.driveUrl);
        return result.driveUrl;
      } else {
        throw new Error(result.error || 'Upload failed');
      }
      
    } catch (error) {
      console.error('❌ Google Drive upload failed:', error);
      return null;
    }
  }
  
  /**
   * Get image URL from Google Drive (with caching)
   */
  static async getImageUrl(exerciseId: string): Promise<string | null> {
    try {
      // Try cache first to avoid API calls
      const { ImageCache } = await import('../utils/imageCache');
      const cached = ImageCache.getCachedImage(exerciseId);
      if (cached && typeof cached === 'string') {
        console.log('📦 Using cached image URL for:', exerciseId);
        return cached;
      }
      
      console.log('🔍 Fetching image URL from Google Drive:', exerciseId);
      
      const response = await fetch(`/api/simple-api/images/${exerciseId}`);
      
      if (!response.ok) {
        console.warn('⚠️ Image not found in Google Drive:', exerciseId);
        return null;
      }
      
      const data = await response.json();
      
      if (data.driveUrl) {
        console.log('✅ Image URL retrieved from Google Drive:', exerciseId);
        
        // Cache for future use
        if (data.driveUrl) {
          ImageCache.setCachedImage(exerciseId, data.driveUrl);
        }
        
        return data.driveUrl;
      }
      
      return null;
      
    } catch (error) {
      console.error('❌ Failed to get image URL:', error);
      return null;
    }
  }
  
  /**
   * Migrate existing base64 image to Google Drive
   */
  static async migrateImageToDrive(exerciseId: string, imageBase64: string, fileName?: string): Promise<string | null> {
    try {
      console.log('🔄 Migrating image to Google Drive:', exerciseId);
      
      // Check if already migrated
      const existingUrl = await this.getImageUrl(exerciseId);
      if (existingUrl && !existingUrl.startsWith('data:')) {
        console.log('✅ Image already migrated:', exerciseId);
        return existingUrl;
      }
      
      // Upload to Google Drive
      const driveUrl = await this.uploadImage(imageBase64, exerciseId, fileName || `exercise_${exerciseId}.png`);
      
      if (driveUrl) {
        console.log('✅ Image migrated successfully:', exerciseId);
        return driveUrl;
      } else {
        console.error('❌ Migration failed:', exerciseId);
        return null;
      }
      
    } catch (error) {
      console.error('❌ Migration error:', error);
      return null;
    }
  }
  
  /**
   * Batch migrate multiple images (with high quality optimization)
   */
  static async batchMigrateImages(exercises: Array<{id: string, imageUrl: string, fileName?: string}>): Promise<void> {
    console.log('🔄 Starting high quality batch migration of', exercises.length, 'images');
    
    let successCount = 0;
    let failCount = 0;
    
    for (const exercise of exercises) {
      if (exercise.imageUrl && exercise.imageUrl.startsWith('data:')) {
        console.log(`📸 Processing ${exercise.id} with high quality optimization...`);
        
        const driveUrl = await this.migrateImageToDrive(
          exercise.id, 
          exercise.imageUrl, 
          exercise.fileName
        );
        
        if (driveUrl) {
          // Update the exercise object
          exercise.imageUrl = driveUrl;
          successCount++;
          console.log(`✅ High quality migration successful: ${exercise.id}`);
        } else {
          failCount++;
          console.error(`❌ Migration failed: ${exercise.id}`);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    console.log(`✅ High quality batch migration complete: ${successCount} success, ${failCount} failed`);
    console.log(`🎨 All images optimized with high quality settings for Google Drive`);
  }
  
  /**
   * Check if image is stored in Google Drive
   */
  static isGoogleDriveUrl(url: string): boolean {
    return Boolean(url && (
      url.includes('drive.google.com') || 
      url.includes('googleapis.com') ||
      url.includes('googleusercontent.com')
    ));
  }
  
  /**
   * Get image storage info
   */
  static getImageStorageInfo(imageUrl: string): {
    type: 'google-drive' | 'base64' | 'other';
    size: number;
    isOptimal: boolean;
  } {
    if (!imageUrl) {
      return { type: 'other', size: 0, isOptimal: false };
    }
    
    if (this.isGoogleDriveUrl(imageUrl)) {
      return { 
        type: 'google-drive', 
        size: imageUrl.length, 
        isOptimal: true 
      };
    }
    
    if (imageUrl.startsWith('data:')) {
      return { 
        type: 'base64', 
        size: imageUrl.length, 
        isOptimal: false 
      };
    }
    
    return { 
      type: 'other', 
      size: imageUrl.length, 
      isOptimal: false 
    };
  }
  
  /**
   * Convert base64 to blob for upload
   */
  private static base64ToBlob(base64Data: string): Blob {
    const byteCharacters = atob(base64Data.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: 'image/png' });
  }
}