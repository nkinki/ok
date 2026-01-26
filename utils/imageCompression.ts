// Image compression utility for reducing payload sizes
export class ImageCompressor {
  
  /**
   * Compress a base64 image by reducing quality
   */
  static async compressBase64Image(base64Data: string, quality: number = 0.7, maxWidth: number = 800): Promise<string> {
    return new Promise((resolve) => {
      try {
        // Create image element
        const img = new Image();
        img.onload = () => {
          // Create canvas
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            resolve(base64Data); // Return original if canvas not supported
            return;
          }
          
          // Calculate new dimensions
          let { width, height } = img;
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          // Set canvas size
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          
          // Get compressed base64
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
        
        img.onerror = () => {
          resolve(base64Data); // Return original on error
        };
        
        img.src = base64Data;
      } catch (error) {
        console.warn('Image compression failed:', error);
        resolve(base64Data); // Return original on error
      }
    });
  }
  
  /**
   * Compress all images in session data
   */
  static async compressSessionImages(sessionData: any, quality: number = 0.6, maxWidth: number = 600): Promise<any> {
    const compressedData = { ...sessionData };
    
    if (compressedData.exercises && Array.isArray(compressedData.exercises)) {
      console.log('🗜️ Compressing images for', compressedData.exercises.length, 'exercises...');
      
      const compressionPromises = compressedData.exercises.map(async (exercise: any, index: number) => {
        if (exercise.imageUrl && exercise.imageUrl.startsWith('data:image/')) {
          const originalSize = exercise.imageUrl.length;
          console.log(`🗜️ Compressing image ${index + 1}/${compressedData.exercises.length} (${Math.round(originalSize / 1024)}KB)`);
          
          const compressedImage = await this.compressBase64Image(exercise.imageUrl, quality, maxWidth);
          const newSize = compressedImage.length;
          const savings = Math.round((1 - newSize / originalSize) * 100);
          
          console.log(`✅ Image ${index + 1} compressed: ${Math.round(originalSize / 1024)}KB → ${Math.round(newSize / 1024)}KB (${savings}% savings)`);
          
          return {
            ...exercise,
            imageUrl: compressedImage
          };
        }
        return exercise;
      });
      
      compressedData.exercises = await Promise.all(compressionPromises);
      
      const originalTotalSize = JSON.stringify(sessionData).length;
      const compressedTotalSize = JSON.stringify(compressedData).length;
      const totalSavings = Math.round((1 - compressedTotalSize / originalTotalSize) * 100);
      
      console.log(`🎯 Total compression: ${Math.round(originalTotalSize / 1024)}KB → ${Math.round(compressedTotalSize / 1024)}KB (${totalSavings}% savings)`);
    }
    
    return compressedData;
  }
  
  /**
   * Check if payload is too large for Vercel
   */
  static isPayloadTooLarge(data: any, limitMB: number = 4.5): boolean {
    const sizeBytes = JSON.stringify(data).length;
    const sizeMB = sizeBytes / (1024 * 1024);
    return sizeMB > limitMB;
  }
  
  /**
   * Get payload size info
   */
  static getPayloadInfo(data: any): { sizeBytes: number, sizeKB: number, sizeMB: number } {
    const sizeBytes = JSON.stringify(data).length;
    return {
      sizeBytes,
      sizeKB: Math.round(sizeBytes / 1024),
      sizeMB: Math.round((sizeBytes / (1024 * 1024)) * 100) / 100
    };
  }
}