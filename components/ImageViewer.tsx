import React, { useState, useRef } from 'react';

interface Props {
  src: string;
  alt: string;
}

const ImageViewer: React.FC<Props> = ({ src, alt }) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const zoomLevels = [0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];

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
      </div>

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
            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
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