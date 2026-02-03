import React, { useState, useRef, useCallback } from 'react';
import { imageEnhancementService, EnhancementResult, EnhancementOptions } from '../services/imageEnhancementService';

interface CustomEnhancementFormProps {
  onApply: (options: EnhancementOptions) => void;
  onCancel: () => void;
  isProcessing: boolean;
}

const CustomEnhancementForm: React.FC<CustomEnhancementFormProps> = ({ onApply, onCancel, isProcessing }) => {
  const [options, setOptions] = useState<EnhancementOptions>({
    autoStraighten: true,
    enhanceContrast: true,
    convertToGrayscale: false, // Default to false to preserve colors
    sharpenText: true,
    removeNoise: true,
    adjustBrightness: true,
    quality: 0.9
  });

  const handleOptionChange = (key: keyof EnhancementOptions, value: boolean | number) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApply(options);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={options.autoStraighten}
            onChange={(e) => handleOptionChange('autoStraighten', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">🔄 Automatikus kiegyenesítés</span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={options.convertToGrayscale}
            onChange={(e) => handleOptionChange('convertToGrayscale', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">⚫ Fekete-fehér konverzió</span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={options.enhanceContrast}
            onChange={(e) => handleOptionChange('enhanceContrast', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">🔆 Kontraszt fokozás</span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={options.adjustBrightness}
            onChange={(e) => handleOptionChange('adjustBrightness', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">💡 Fényerő optimalizálás</span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={options.sharpenText}
            onChange={(e) => handleOptionChange('sharpenText', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">📝 Szöveg élesítés</span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={options.removeNoise}
            onChange={(e) => handleOptionChange('removeNoise', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">🧹 Zaj eltávolítás</span>
        </label>

        <div className="space-y-2">
          <label className="text-sm font-medium">📊 Képminőség: {Math.round((options.quality || 0.9) * 100)}%</label>
          <input
            type="range"
            min="0.5"
            max="1"
            step="0.05"
            value={options.quality || 0.9}
            onChange={(e) => handleOptionChange('quality', parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <button
          onClick={handleApply}
          disabled={isProcessing}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Feldolgozás...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Javítás alkalmazása
            </>
          )}
        </button>
        <button
          onClick={onCancel}
          disabled={isProcessing}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg font-medium"
        >
          Mégse
        </button>
      </div>
    </div>
  );
};

interface Props {
  src: string;
  alt: string;
  onImageUpdate?: (newSrc: string) => void;
  studentMode?: boolean;
}

const ImageViewer: React.FC<Props> = ({ src, alt, onImageUpdate, studentMode = false }) => {
  // CRITICAL DEBUG: Log what ImageViewer receives
  console.log('🎯 ImageViewer received:', {
    hasSrc: !!src,
    srcLength: src?.length || 0,
    srcPreview: src ? src.substring(0, 50) + '...' : 'NONE',
    srcType: typeof src,
    alt: alt,
    studentMode: studentMode
  });

  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [enhancementResult, setEnhancementResult] = useState<EnhancementResult | null>(null);
  const [showEnhancementOptions, setShowEnhancementOptions] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingMode, setDrawingMode] = useState(false);
  const [brushColor, setBrushColor] = useState('#ff0000');
  const [brushSize, setBrushSize] = useState(3);
  const [drawingHistory, setDrawingHistory] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);

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
    setRotation(prev => (prev - 2) % 360);
  };

  const handleRotateRight = () => {
    setRotation(prev => (prev + 2) % 360);
  };

  const enhanceReadability = useCallback(async () => {
    if (!onImageUpdate) return;
    
    setIsProcessing(true);
    try {
      // Very conservative enhancement - only readability improvements
      const result = await imageEnhancementService.enhanceImage(src, {
        autoStraighten: false, // Disable auto-straighten to prevent rotation issues
        enhanceContrast: false, // Disable aggressive contrast to prevent inversion
        convertToGrayscale: false, // Keep colors
        sharpenText: true, // Only sharpen text
        removeNoise: true, // Remove noise
        adjustBrightness: false, // Disable brightness adjustment to prevent issues
        quality: 0.95
      });
      setEnhancementResult(result);
      onImageUpdate(result.enhancedImageUrl);
      
      console.log('✅ Olvashatóság javítás befejezve:', result.appliedEnhancements);
      
    } catch (error) {
      console.error('Olvashatóság javítás sikertelen:', error);
      alert('Olvashatóság javítás sikertelen: ' + (error instanceof Error ? error.message : 'Ismeretlen hiba'));
    } finally {
      setIsProcessing(false);
    }
  }, [src, onImageUpdate]);

  const enhanceColor = useCallback(async () => {
    if (!onImageUpdate) return;
    
    setIsProcessing(true);
    try {
      // Conservative color enhancement - minimal changes
      const result = await imageEnhancementService.enhanceImage(src, {
        autoStraighten: false, // Disable to prevent rotation
        enhanceContrast: false, // Disable aggressive contrast
        convertToGrayscale: false, // Keep colors
        sharpenText: true, // Only sharpen
        removeNoise: true, // Remove noise
        adjustBrightness: false, // Disable brightness to prevent inversion
        quality: 0.95
      });
      setEnhancementResult(result);
      onImageUpdate(result.enhancedImageUrl);
      
      console.log('✅ Színmegőrzéses javítás befejezve:', result.appliedEnhancements);
      
    } catch (error) {
      console.error('Színmegőrzéses javítás sikertelen:', error);
      alert('Színmegőrzéses javítás sikertelen: ' + (error instanceof Error ? error.message : 'Ismeretlen hiba'));
    } finally {
      setIsProcessing(false);
    }
  }, [src, onImageUpdate]);

  const customEnhancement = useCallback(async (options: any) => {
    if (!onImageUpdate) return;
    
    setIsProcessing(true);
    try {
      const result = await imageEnhancementService.enhanceImage(src, options);
      setEnhancementResult(result);
      onImageUpdate(result.enhancedImageUrl);
      setShowEnhancementOptions(false);
      
      console.log('✅ Egyedi javítás befejezve:', result.appliedEnhancements);
      
    } catch (error) {
      console.error('Egyedi javítás sikertelen:', error);
      alert('Képjavítás sikertelen: ' + (error instanceof Error ? error.message : 'Ismeretlen hiba'));
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
      
      // Convert to base64 with high quality and consistent format
      const rotatedSrc = canvas.toDataURL('image/png');
      console.log('🔄 Rotation applied, image size:', rotatedSrc.length, 'characters');
      onImageUpdate(rotatedSrc);
      setRotation(0); // Reset rotation after applying
      
    } catch (error) {
      console.error('Rotation failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [src, rotation, onImageUpdate]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (drawingMode && drawingCanvasRef.current) {
      setIsDrawing(true);
      const rect = drawingCanvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom - position.x / zoom;
      const y = (e.clientY - rect.top) / zoom - position.y / zoom;
      
      const ctx = drawingCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize / zoom;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    } else if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDrawing && drawingCanvasRef.current) {
      const rect = drawingCanvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom - position.x / zoom;
      const y = (e.clientY - rect.top) / zoom - position.y / zoom;
      
      const ctx = drawingCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    } else if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      // Save drawing state for undo functionality
      if (drawingCanvasRef.current) {
        const dataUrl = drawingCanvasRef.current.toDataURL();
        setDrawingHistory(prev => [...prev, dataUrl]);
      }
    }
    setIsDragging(false);
  };

  const clearDrawing = () => {
    if (drawingCanvasRef.current) {
      const ctx = drawingCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
        setDrawingHistory([]);
      }
    }
  };

  const undoDrawing = () => {
    if (drawingHistory.length > 0 && drawingCanvasRef.current) {
      const ctx = drawingCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
        const newHistory = [...drawingHistory];
        newHistory.pop();
        setDrawingHistory(newHistory);
        
        if (newHistory.length > 0) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
          };
          img.src = newHistory[newHistory.length - 1];
        }
      }
    }
  };

  const saveImageWithDrawing = () => {
    if (!onImageUpdate || !drawingCanvasRef.current) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.onload = () => {
      try {
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        // Draw annotations on top
        if (drawingCanvasRef.current) {
          ctx.drawImage(drawingCanvasRef.current, 0, 0);
        }
        
        // Convert to base64 with high quality and consistent format
        const combinedImageUrl = canvas.toDataURL('image/png');
        console.log('🎨 Drawing saved, image size:', combinedImageUrl.length, 'characters');
        onImageUpdate(combinedImageUrl);
        
        // Clear drawing after saving
        clearDrawing();
      } catch (error) {
        console.error('❌ Error saving drawing:', error);
        alert('Hiba a rajz mentésekor: ' + error.message);
      }
    };
    img.onerror = (error) => {
      console.error('❌ Error loading image for drawing:', error);
      alert('Hiba a kép betöltésekor a rajzoláshoz');
    };
    img.src = src;
  };

  // Initialize drawing canvas when image loads
  const initializeDrawingCanvas = (imgElement: HTMLImageElement) => {
    if (drawingCanvasRef.current) {
      drawingCanvasRef.current.width = imgElement.naturalWidth;
      drawingCanvasRef.current.height = imgElement.naturalHeight;
    }
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
      {/* Zoom Controls - Fixed to bottom of image container */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-2 bg-black/80 rounded-lg p-2 shadow-lg backdrop-blur-sm border border-white/10">
        <button
          onClick={handleZoomOut}
          disabled={zoom <= zoomLevels[0]}
          className="w-10 h-10 bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded flex items-center justify-center text-lg font-bold transition-all hover:scale-110"
          title="Kicsinyítés"
        >
          −
        </button>
        
        <div className="text-white text-xs text-center font-mono bg-black/50 px-3 py-1 rounded min-w-[50px] border border-white/10">
          {Math.round(zoom * 100)}%
        </div>
        
        <button
          onClick={handleZoomIn}
          disabled={zoom >= zoomLevels[zoomLevels.length - 1]}
          className="w-10 h-10 bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded flex items-center justify-center text-lg font-bold transition-all hover:scale-110"
          title="Nagyítás"
        >
          +
        </button>
        
        <div className="w-px h-6 bg-white/30 mx-1"></div>
        
        <button
          onClick={handleZoomReset}
          className="w-10 h-10 bg-white/20 hover:bg-white/30 text-white rounded flex items-center justify-center text-xs font-bold transition-all hover:scale-110"
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
              title="Forgatás balra (2°)"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1v6m0 0l4-4m-4 4L8 3m11 8a8 8 0 11-16 0 8 8 0 0116 0z" />
              </svg>
            </button>
            
            <button
              onClick={handleRotateRight}
              disabled={isProcessing}
              className="w-8 h-8 bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white rounded flex items-center justify-center"
              title="Forgatás jobbra (2°)"
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
            
            {/* AI Enhancement Controls */}
            <button
              onClick={enhanceReadability}
              disabled={isProcessing || !onImageUpdate}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded text-xs font-medium flex items-center gap-1"
              title="Csak olvashatóság javítás (szöveg élesítés, zaj eltávolítás)"
            >
              {isProcessing ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              ) : (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              Olvashatóság
            </button>
            
            <button
              onClick={enhanceColor}
              disabled={isProcessing || !onImageUpdate}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-xs font-medium flex items-center gap-1"
              title="Konzervatív javítás (minimális változtatás, színek megőrzése)"
            >
              {isProcessing ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              ) : (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
              )}
              Konzervatív
            </button>
            
            <button
              onClick={() => setShowEnhancementOptions(true)}
              disabled={isProcessing || !onImageUpdate}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded text-xs font-medium flex items-center gap-1"
              title="Egyedi AI javítási beállítások"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              Egyedi
            </button>
            
            <div className="w-px h-6 bg-white/30 mx-1"></div>
            
            {/* Drawing Tools */}
            <button
              onClick={() => setDrawingMode(!drawingMode)}
              className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1 transition-all ${
                drawingMode 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
              title="Rajzolás be/ki"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              {drawingMode ? 'Rajz ki' : 'Rajzolás'}
            </button>
            
            {drawingMode && (
              <>
                {/* Color Picker */}
                <div className="flex items-center gap-1">
                  <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                    className="w-6 h-6 rounded border-none cursor-pointer"
                    title="Szín választás"
                  />
                </div>
                
                {/* Brush Size */}
                <div className="flex items-center gap-1">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="w-12 h-2"
                    title="Ecset méret"
                  />
                  <span className="text-white text-xs w-4">{brushSize}</span>
                </div>
                
                {/* Drawing Actions */}
                <button
                  onClick={undoDrawing}
                  disabled={drawingHistory.length === 0}
                  className="w-6 h-6 bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white rounded flex items-center justify-center"
                  title="Visszavonás"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </button>
                
                <button
                  onClick={clearDrawing}
                  className="w-6 h-6 bg-white/20 hover:bg-white/30 text-white rounded flex items-center justify-center"
                  title="Rajz törlése"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                
                <button
                  onClick={saveImageWithDrawing}
                  className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium"
                  title="Rajz mentése a képre"
                >
                  Mentés
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Image Container */}
      <div 
        ref={containerRef}
        className={`w-full h-full overflow-hidden ${zoom > 1 && !drawingMode ? 'cursor-grab' : drawingMode ? 'cursor-crosshair' : 'cursor-default'} ${isDragging ? 'cursor-grabbing' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div className="relative w-full h-full">
          <img 
            src={src} 
            alt={alt} 
            className="w-full h-full object-contain select-none"
            style={{
              transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)${studentMode ? '' : ` rotate(${rotation}deg)`}`,
              transformOrigin: 'center center',
              transition: isDragging || isProcessing ? 'none' : (zoom === 1 && position.x === 0 && position.y === 0 && rotation === 0 ? 'none' : 'transform 0.2s ease-out')
            }}
            draggable={false}
            onLoad={(e) => {
              const imgElement = e.target as HTMLImageElement;
              initializeDrawingCanvas(imgElement);
              console.log('🎯 ImageViewer - Image loaded successfully:', {
                src: src.substring(0, 50) + '...',
                naturalWidth: imgElement.naturalWidth,
                naturalHeight: imgElement.naturalHeight
              });
            }}
            onError={(e) => {
              console.error('🎯 ImageViewer - Image load error:', {
                src: src.substring(0, 50) + '...',
                error: e,
                srcLength: src.length
              });
            }}
          />
          
          {/* Drawing Canvas Overlay */}
          {drawingMode && (
            <canvas
              ref={drawingCanvasRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-auto"
              style={{
                transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)${studentMode ? '' : ` rotate(${rotation}deg)`}`,
                transformOrigin: 'center center',
                transition: isDragging || isProcessing ? 'none' : (zoom === 1 && position.x === 0 && position.y === 0 && rotation === 0 ? 'none' : 'transform 0.2s ease-out')
              }}
            />
          )}
        </div>
      </div>

      {/* Instructions */}
      {zoom > 1 && !drawingMode && (
        <div className="absolute top-4 left-4 bg-black/70 text-white text-xs px-3 py-2 rounded-lg">
          🖱️ Húzd a képet • 🖱️ Görgő: zoom
        </div>
      )}
      
      {drawingMode && (
        <div className="absolute top-4 left-4 bg-black/70 text-white text-xs px-3 py-2 rounded-lg">
          🖊️ Rajzolj a képre • Szín: <span className="inline-block w-3 h-3 rounded-full ml-1" style={{backgroundColor: brushColor}}></span> • Méret: {brushSize}px
        </div>
      )}

      {/* Enhancement Result Info */}
      {enhancementResult && (
        <div className="absolute top-4 right-4 bg-black/70 text-white text-xs px-3 py-2 rounded-lg max-w-xs">
          <div className="font-bold text-green-400 mb-1">✅ AI Javítás alkalmazva</div>
          <div className="space-y-1">
            {enhancementResult.appliedEnhancements.map((enhancement, idx) => (
              <div key={idx}>• {enhancement}</div>
            ))}
            <div className="text-gray-300 mt-2">
              Idő: {Math.round(enhancementResult.processingTime)}ms
            </div>
          </div>
        </div>
      )}

      {/* Custom Enhancement Options Modal */}
      {showEnhancementOptions && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-30">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">AI Képjavítás beállítások</h3>
            
            <CustomEnhancementForm 
              onApply={customEnhancement}
              onCancel={() => setShowEnhancementOptions(false)}
              isProcessing={isProcessing}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageViewer;