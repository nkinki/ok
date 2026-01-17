import React, { useState, useRef } from 'react';

interface Props {
  src: string;
  alt: string;
}

const ImageViewer: React.FC<Props> = ({ src, alt }) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed || !containerRef.current) return;
    
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    
    setPosition({ x, y });
  };

  return (
    <div 
        ref={containerRef}
        className={`w-full h-full overflow-hidden cursor-zoom-in ${isZoomed ? 'cursor-zoom-out' : ''}`}
        onClick={() => setIsZoomed(!isZoomed)}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setIsZoomed(false)}
    >
        <div 
            className="w-full h-full bg-no-repeat transition-transform duration-100"
            style={{
                backgroundImage: `url(${src})`,
                // Increased zoom to 400% as requested
                backgroundSize: isZoomed ? '400%' : 'contain',
                backgroundPosition: isZoomed ? `${position.x}% ${position.y}%` : 'center center',
            }}
        >
            <img src={src} alt={alt} className="opacity-0 w-full h-full object-contain pointer-events-none" />
        </div>
    </div>
  );
};

export default ImageViewer;