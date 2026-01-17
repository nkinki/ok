
/**
 * Compresses and resizes an image file to ensure it's small enough for quick API transmission.
 * Target: Max 2000px (increased for quality), JPEG format, 0.9 quality (high fidelity).
 */
export const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Max dimension limit
        const MAX_SIZE = 2000;
        
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            resolve(img.src.split(',')[1]); // Fallback
            return;
        }
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        resolve(dataUrl.split(',')[1]); 
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

/**
 * Crops an image based on Gemini's 0-1000 scale bounding box.
 * USES ROW SLICE LOGIC: Keeps full width (minus trim) to ensure left-side images are preserved.
 */
export const cropImage = (base64Image: string, box: { ymin: number; xmin: number; ymax: number; xmax: number }): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = `data:image/jpeg;base64,${base64Image}`;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                resolve(base64Image);
                return;
            }

            // Calculate vertical crop based on AI (0-1000 scale)
            const y = (box.ymin / 1000) * img.height;
            const h = ((box.ymax - box.ymin) / 1000) * img.height;

            // Safety padding for top/bottom
            const vPadding = 30;
            const finalY = Math.max(0, y - vPadding);
            const finalH = Math.min(img.height - finalY, h + (vPadding * 2));

            // SIDE TRIM: Cut off 15% from left and right to remove table/background
            const sideTrimRatio = 0.15; 
            const finalX = img.width * sideTrimRatio;
            const finalW = img.width * (1 - (sideTrimRatio * 2));

            if (finalH < 50 || finalW < 50) {
                resolve(base64Image);
                return;
            }

            canvas.width = finalW;
            canvas.height = finalH;

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // Draw the cropped area
            ctx.drawImage(img, finalX, finalY, finalW, finalH, 0, 0, finalW, finalH);

            const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
            resolve(croppedDataUrl.split(',')[1]);
        };
        img.onerror = (e) => {
            console.error("Crop loading error", e);
            resolve(base64Image);
        };
    });
};
