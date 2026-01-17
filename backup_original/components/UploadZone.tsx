
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
            <svg className="w-12 h-12 mb-4 text-brand-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
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
