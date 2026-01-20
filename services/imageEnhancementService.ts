// AI-powered image enhancement service for better OCR readability
export interface EnhancementOptions {
  autoStraighten?: boolean;
  enhanceContrast?: boolean;
  convertToGrayscale?: boolean;
  sharpenText?: boolean;
  removeNoise?: boolean;
  adjustBrightness?: boolean;
  quality?: number; // 0.1 to 1.0
}

export interface EnhancementResult {
  enhancedImageUrl: string;
  appliedEnhancements: string[];
  processingTime: number;
  originalSize: { width: number; height: number };
  enhancedSize: { width: number; height: number };
}

class ImageEnhancementService {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  /**
   * Main enhancement function that applies multiple improvements
   */
  async enhanceImage(
    imageUrl: string, 
    options: EnhancementOptions = {}
  ): Promise<EnhancementResult> {
    const startTime = performance.now();
    const appliedEnhancements: string[] = [];

    // Default options
    const opts: Required<EnhancementOptions> = {
      autoStraighten: true,
      enhanceContrast: true,
      convertToGrayscale: true,
      sharpenText: true,
      removeNoise: true,
      adjustBrightness: true,
      quality: 0.9,
      ...options
    };

    try {
      // Load image
      const img = await this.loadImage(imageUrl);
      const originalSize = { width: img.width, height: img.height };

      // Set canvas size
      this.canvas.width = img.width;
      this.canvas.height = img.height;

      // Draw original image
      this.ctx.drawImage(img, 0, 0);

      // Get image data for processing
      let imageData = this.ctx.getImageData(0, 0, img.width, img.height);

      // Apply enhancements in order
      if (opts.autoStraighten) {
        imageData = await this.straightenImage(imageData);
        appliedEnhancements.push('Kiegyenesítés');
      }

      if (opts.convertToGrayscale) {
        imageData = this.convertToGrayscale(imageData);
        appliedEnhancements.push('Fekete-fehér konverzió');
      }

      if (opts.adjustBrightness) {
        imageData = this.adjustBrightnessContrast(imageData);
        appliedEnhancements.push('Fényerő és kontraszt javítás');
      }

      if (opts.enhanceContrast) {
        imageData = this.enhanceContrast(imageData);
        appliedEnhancements.push('Kontraszt fokozás');
      }

      if (opts.removeNoise) {
        imageData = this.removeNoise(imageData);
        appliedEnhancements.push('Zaj eltávolítás');
      }

      if (opts.sharpenText) {
        imageData = this.sharpenText(imageData);
        appliedEnhancements.push('Szöveg élesítés');
      }

      // Apply processed image data back to canvas
      this.ctx.putImageData(imageData, 0, 0);

      // Convert to blob and create URL
      const enhancedImageUrl = await this.canvasToDataUrl(opts.quality);

      const processingTime = performance.now() - startTime;
      const enhancedSize = { width: this.canvas.width, height: this.canvas.height };

      return {
        enhancedImageUrl,
        appliedEnhancements,
        processingTime,
        originalSize,
        enhancedSize
      };

    } catch (error) {
      console.error('Image enhancement failed:', error);
      throw new Error('Képjavítás sikertelen: ' + (error instanceof Error ? error.message : 'Ismeretlen hiba'));
    }
  }

  /**
   * Load image from URL
   */
  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Kép betöltése sikertelen'));
      img.src = url;
    });
  }

  /**
   * Auto-straighten image using edge detection
   */
  private async straightenImage(imageData: ImageData): Promise<ImageData> {
    // Simple skew detection and correction
    const angle = this.detectSkewAngle(imageData);
    
    if (Math.abs(angle) > 0.5) { // Only correct if angle is significant
      return this.rotateImage(imageData, -angle);
    }
    
    return imageData;
  }

  /**
   * Detect skew angle using Hough transform (simplified)
   */
  private detectSkewAngle(imageData: ImageData): number {
    const { data, width, height } = imageData;
    const edges: number[] = [];
    
    // Simple edge detection (Sobel-like)
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
        
        // Calculate gradient
        const gx = -data[((y-1) * width + (x-1)) * 4] + data[((y-1) * width + (x+1)) * 4] +
                   -2 * data[(y * width + (x-1)) * 4] + 2 * data[(y * width + (x+1)) * 4] +
                   -data[((y+1) * width + (x-1)) * 4] + data[((y+1) * width + (x+1)) * 4];
        
        const gy = -data[((y-1) * width + (x-1)) * 4] - 2 * data[((y-1) * width + x) * 4] - data[((y-1) * width + (x+1)) * 4] +
                   data[((y+1) * width + (x-1)) * 4] + 2 * data[((y+1) * width + x) * 4] + data[((y+1) * width + (x+1)) * 4];
        
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        if (magnitude > 50) {
          const angle = Math.atan2(gy, gx) * 180 / Math.PI;
          edges.push(angle);
        }
      }
    }
    
    // Find dominant angle
    const histogram: { [key: number]: number } = {};
    edges.forEach(angle => {
      const bucket = Math.round(angle / 2) * 2; // 2-degree buckets
      histogram[bucket] = (histogram[bucket] || 0) + 1;
    });
    
    let maxCount = 0;
    let dominantAngle = 0;
    Object.entries(histogram).forEach(([angle, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantAngle = parseInt(angle);
      }
    });
    
    return dominantAngle;
  }

  /**
   * Rotate image by given angle
   */
  private rotateImage(imageData: ImageData, angle: number): ImageData {
    const { width, height } = imageData;
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;
    
    tempCanvas.width = width;
    tempCanvas.height = height;
    tempCtx.putImageData(imageData, 0, 0);
    
    // Create new canvas for rotated image
    const rotatedCanvas = document.createElement('canvas');
    const rotatedCtx = rotatedCanvas.getContext('2d')!;
    rotatedCanvas.width = width;
    rotatedCanvas.height = height;
    
    // Rotate
    rotatedCtx.translate(width / 2, height / 2);
    rotatedCtx.rotate(angle * Math.PI / 180);
    rotatedCtx.drawImage(tempCanvas, -width / 2, -height / 2);
    
    return rotatedCtx.getImageData(0, 0, width, height);
  }

  /**
   * Convert to grayscale for better OCR
   */
  private convertToGrayscale(imageData: ImageData): ImageData {
    const { data } = imageData;
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      data[i] = gray;     // Red
      data[i + 1] = gray; // Green
      data[i + 2] = gray; // Blue
      // Alpha stays the same
    }
    
    return imageData;
  }

  /**
   * Adjust brightness and contrast automatically
   */
  private adjustBrightnessContrast(imageData: ImageData): ImageData {
    const { data } = imageData;
    
    // Calculate histogram
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      histogram[gray]++;
    }
    
    // Find optimal brightness and contrast
    let min = 0, max = 255;
    const totalPixels = data.length / 4;
    const threshold = totalPixels * 0.01; // 1% threshold
    
    // Find actual min/max (ignoring outliers)
    let count = 0;
    for (let i = 0; i < 256; i++) {
      count += histogram[i];
      if (count > threshold && min === 0) {
        min = i;
      }
      if (count > totalPixels - threshold && max === 255) {
        max = i;
        break;
      }
    }
    
    // Apply contrast stretching
    const range = max - min;
    if (range > 0) {
      for (let i = 0; i < data.length; i += 4) {
        for (let j = 0; j < 3; j++) {
          const normalized = (data[i + j] - min) / range;
          data[i + j] = Math.max(0, Math.min(255, normalized * 255));
        }
      }
    }
    
    return imageData;
  }

  /**
   * Enhance contrast using histogram equalization
   */
  private enhanceContrast(imageData: ImageData): ImageData {
    const { data } = imageData;
    
    // Calculate histogram
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      histogram[gray]++;
    }
    
    // Calculate cumulative distribution
    const cdf = new Array(256);
    cdf[0] = histogram[0];
    for (let i = 1; i < 256; i++) {
      cdf[i] = cdf[i - 1] + histogram[i];
    }
    
    // Normalize CDF
    const totalPixels = data.length / 4;
    const lookupTable = cdf.map(value => Math.round((value / totalPixels) * 255));
    
    // Apply histogram equalization
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      const enhanced = lookupTable[gray];
      data[i] = enhanced;     // Red
      data[i + 1] = enhanced; // Green
      data[i + 2] = enhanced; // Blue
    }
    
    return imageData;
  }

  /**
   * Remove noise using median filter
   */
  private removeNoise(imageData: ImageData): ImageData {
    const { data, width, height } = imageData;
    const newData = new Uint8ClampedArray(data);
    
    // 3x3 median filter
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) { // RGB channels
          const values: number[] = [];
          
          // Collect 3x3 neighborhood
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const idx = ((y + dy) * width + (x + dx)) * 4 + c;
              values.push(data[idx]);
            }
          }
          
          // Find median
          values.sort((a, b) => a - b);
          const median = values[4]; // Middle value of 9 elements
          
          const idx = (y * width + x) * 4 + c;
          newData[idx] = median;
        }
      }
    }
    
    return new ImageData(newData, width, height);
  }

  /**
   * Sharpen text using unsharp mask
   */
  private sharpenText(imageData: ImageData): ImageData {
    const { data, width, height } = imageData;
    const newData = new Uint8ClampedArray(data);
    
    // Unsharp mask kernel
    const kernel = [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
    ];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) { // RGB channels
          let sum = 0;
          
          // Apply kernel
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4 + c;
              const kernelIdx = (ky + 1) * 3 + (kx + 1);
              sum += data[idx] * kernel[kernelIdx];
            }
          }
          
          const idx = (y * width + x) * 4 + c;
          newData[idx] = Math.max(0, Math.min(255, sum));
        }
      }
    }
    
    return new ImageData(newData, width, height);
  }

  /**
   * Convert canvas to data URL
   */
  private canvasToDataUrl(quality: number): Promise<string> {
    return new Promise((resolve) => {
      this.canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          resolve(url);
        } else {
          resolve(this.canvas.toDataURL('image/jpeg', quality));
        }
      }, 'image/jpeg', quality);
    });
  }

  /**
   * Quick enhancement preset for documents
   */
  async enhanceDocument(imageUrl: string): Promise<EnhancementResult> {
    return this.enhanceImage(imageUrl, {
      autoStraighten: true,
      enhanceContrast: true,
      convertToGrayscale: true,
      sharpenText: true,
      removeNoise: true,
      adjustBrightness: true,
      quality: 0.95
    });
  }

  /**
   * Quick enhancement preset for photos
   */
  async enhancePhoto(imageUrl: string): Promise<EnhancementResult> {
    return this.enhanceImage(imageUrl, {
      autoStraighten: true,
      enhanceContrast: true,
      convertToGrayscale: false,
      sharpenText: false,
      removeNoise: true,
      adjustBrightness: true,
      quality: 0.9
    });
  }
}

// Export singleton instance
export const imageEnhancementService = new ImageEnhancementService();