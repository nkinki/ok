import React, { useState, useRef, useCallback } from 'react';

interface Props {
  src: string;
  alt: string;
  onImageUpdate?: (newSrc: string) => void;
  studentMode?: boolean;
}

const ImageViewer: React.FC<Props> = ({ src, alt, onImageUpdate, studentMode = false }) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const zoomLevels = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5];

  const handleZoomIn = () => {
    const currentIndex = zoomLevels.findIndex(level => level >= zoom);
    const nextIndex = Math.min(currentIndex + 1, zoomLevels.length - 1);
    setZoom(zoomLevels[nextIndex]);
  };

  const handleZoomOut = () => {
    const currentIndex = zoomLevels.findIndex(level => level >= zoom);
    const prevIndex = Math.max(currentIndex - 1, 0);
    setZoom(zoomLevels[prevIndex]);
  };

  const handleZoomReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleRotateLeft = () => {
    setRotation(prev => (prev - 90) % 360);
  };

  const handleRotateRight = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const enhanceDocument = useCallback(async () => {
    if (!onImageUpdate) return;
    
    setIsProcessing(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = src;
      });

      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw original image
      ctx.drawImage(img, 0, 0);
      
      // Get image data for processing
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Document enhancement algorithm
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Convert to grayscale
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        
        // Increase contrast and brightness for document scanning effect
        const enhanced = Math.min(255, Math.max(0, (gray - 128) * 1.5 + 128 + 20));
        
        // Apply threshold for black/white effect
        const threshold = enhanced > 180 ? 255 : enhanced < 80 ? 0 : enhanced;
        
        data[i] = threshold;     // R
        data[i + 1] = threshold; // G  
        data[i + 2] = threshold; // B
        // Alpha stays the same
      }
      
      // Put enhanced image data back
      ctx.putImageData(imageData, 0, 0);
      
      // Convert to base64 and update
      const enhancedSrc = canvas.toDataURL('image/jpeg', 0.9);
      onImageUpdate(enhancedSrc);
      
    } catch (error) {
      console.error('Document enhancement failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [src, onImageUpdate]);

  const applyRotation = useCallback(async () => {
    if (!onImageUpdate || rotation === 0) return;
    
    setIsProcessing(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = src;
      });

      // Set canvas size based on rotation
      if (rotation % 180 === 0) {
        canvas.width = img.width;
        canvas.height = img.height;
      } else {
        canvas.width = img.height;
        canvas.height = img.width;
      }
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Move to center and rotate
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      
      // Draw rotated image
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      
      // Reset transform
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      
      // Convert to base64 and update
      const rotatedSrc = canvas.toDataURL('image/jpeg', 0.9);
      onImageUpdate(rotatedSrc);
      setRotation(0); // Reset rotation after applying
      
    } catch (error) {
      console.error('Rotation failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [src, rotation, onImageUpdate]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-900">
      {/* Zoom Controls - Horizontal at bottom center */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex items-center gap-2 bg-black/70 rounded-lg p-2">
        <button
          onClick={handleZoomOut}
          disabled={zoom <= zoomLevels[0]}
          className="w-8 h-8 bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded flex items-center justify-center text-lg font-bold"
          title="Kicsinyítés"
        >
          −
        </button>
        
        <div className="text-white text-xs text-center font-mono bg-black/50 px-3 py-1 rounded min-w-[50px]">
          {Math.round(zoom * 100)}%
        </div>
        
        <button
          onClick={handleZoomIn}
          disabled={zoom >= zoomLevels[zoomLevels.length - 1]}
          className="w-8 h-8 bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded flex items-center justify-center text-lg font-bold"
          title="Nagyítás"
        >
          +
        </button>
        
        <div className="w-px h-6 bg-white/30 mx-1"></div>
        
        <button
          onClick={handleZoomReset}
          className="w-8 h-8 bg-white/20 hover:bg-white/30 text-white rounded flex items-center justify-center text-xs font-bold"
          title="Eredeti méret"
        >
          1:1
        </button>
        
        {/* Teacher-only controls */}
        {!studentMode && (
          <>
            <div className="w-px h-6 bg-white/30 mx-1"></div>
            
            {/* Rotation Controls */}
            <button
              onClick={handleRotateLeft}
              disabled={isProcessing}
              className="w-8 h-8 bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white rounded flex items-center justify-center"
              title="Forgatás balra"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1v6m0 0l4-4m-4 4L8 3m11 8a8 8 0 11-16 0 8 8 0 0116 0z" />
              </svg>
            </button>
            
            <button
              onClick={handleRotateRight}
              disabled={isProcessing}
              className="w-8 h-8 bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white rounded flex items-center justify-center"
              title="Forgatás jobbra"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1v6m0 0l-4-4m4 4l4-4m5 8a8 8 0 01-16 0 8 8 0 0116 0z" />
              </svg>
            </button>
            
            {rotation !== 0 && (
              <button
                onClick={applyRotation}
                disabled={isProcessing}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-xs font-medium"
                title="Forgatás alkalmazása"
              >
                Alkalmaz
              </button>
            )}
            
            <div className="w-px h-6 bg-white/30 mx-1"></div>
            
            {/* Document Enhancement */}
            <button
              onClick={enhanceDocument}
              disabled={isProcessing || !onImageUpdate}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded text-xs font-medium flex items-center gap-1"
              title="Dokumentum olvashatóság javítása"
            >
              {isProcessing ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              ) : (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              Scanner
            </button>
          </>
        )}
      </div>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Image Container */}
      <div 
        ref={containerRef}
        className={`w-full h-full overflow-hidden ${zoom > 1 ? 'cursor-grab' : 'cursor-default'} ${isDragging ? 'cursor-grabbing' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <img 
          src={src} 
          alt={alt} 
          className="w-full h-full object-contain transition-transform duration-200 select-none"
          style={{
            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)${studentMode ? '' : ` rotate(${rotation}deg)`}`,
            transformOrigin: 'center center'
          }}
          draggable={false}
        />
      </div>

      {/* Instructions */}
      {zoom > 1 && (
        <div className="absolute top-4 left-4 bg-black/70 text-white text-xs px-3 py-2 rounded-lg">
          🖱️ Húzd a képet • 🖱️ Görgő: zoom
        </div>
      )}
    </div>
  );
};

export default ImageViewer;