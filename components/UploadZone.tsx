
import React, { useCallback } from 'react';
import { compressImage } from '../utils/imageUtils';
import { logger } from '../utils/logger';

interface UploadZoneProps {
  onImageSelected: (base64: string) => void;
  isAnalyzing: boolean;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onImageSelected, isAnalyzing }) => {
  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      logger.info("Kép kiválasztva, tömörítés indítása...", { name: file.name, size: file.size });
      try {
        const base64Content = await compressImage(file);
        logger.success("Kép tömörítve", { originalSize: file.size, newLength: base64Content.length });
        onImageSelected(base64Content);
      } catch (err) {
        logger.error("Hiba a kép előkészítésekor", err);
        alert("Nem sikerült betölteni a képet.");
      }
    }
  }, [onImageSelected]);

  return (
    <div className="w-full max-w-2xl mx-auto mt-10">
      <label 
        className={`
          flex flex-col items-center justify-center w-full h-64 
          border-2 border-brand-300 border-dashed rounded-2xl 
          cursor-pointer bg-brand-50 hover:bg-brand-100 transition-colors
          ${isAnalyzing ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {isAnalyzing ? (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mb-4"></div>
          ) : (
            <svg className="w-12 h-12 mb-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
          )}
          <p className="mb-2 text-sm text-brand-700 font-semibold">
            {isAnalyzing ? "A feladat elemzése (Türelem)..." : "Kattints a feltöltéshez vagy húzd ide a képet"}
          </p>
          <p className="text-xs text-brand-500">A rendszer automatikusan optimalizálja a képet</p>
        </div>
        <input 
          type="file" 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange}
          disabled={isAnalyzing}
        />
      </label>
    </div>
  );
};

export default UploadZone;
