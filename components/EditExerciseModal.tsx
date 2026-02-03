
import React, { useState, useEffect, useRef } from 'react';
import { ExerciseData, ExerciseType, MatchingContent, CategorizationContent, QuizContent } from '../types';
import { BulkResultItem } from './BulkProcessor';
import ImageViewer from './ImageViewer';

interface Props {
  item: BulkResultItem;
  onSave: (updatedItem: BulkResultItem) => void;
  onClose: () => void;
}

const EditExerciseModal: React.FC<Props> = ({ item, onSave, onClose }) => {
  const [activeTab, setActiveTab] = useState<'CONTENT' | 'IMAGE'>('CONTENT');
  const [formData, setFormData] = useState<ExerciseData>(item.data);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>(item.imageUrl);
  
  // Crop state - most 4 sarok koordinátákkal (százalékban)
  const [crop, setCrop] = useState({ 
    topLeft: { x: 0, y: 0 },
    topRight: { x: 100, y: 0 },
    bottomLeft: { x: 0, y: 100 },
    bottomRight: { x: 100, y: 100 }
  });
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [showCropMode, setShowCropMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setFormData(item.data);
    setCurrentImageUrl(item.imageUrl);
  }, [item]);

  // ESC key handler for closing modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);

  // Load image for cropping
  useEffect(() => {
      if (currentImageUrl && showCropMode) {
          const img = new Image();
          img.src = currentImageUrl;
          img.onload = () => {
              setOriginalImage(img);
              // Reset crop - szabályos téglalap a teljes képpel
              setCrop({ 
                topLeft: { x: 0, y: 0 },
                topRight: { x: 100, y: 0 },
                bottomLeft: { x: 0, y: 100 },
                bottomRight: { x: 100, y: 100 }
              });
          };
      }
  }, [currentImageUrl, showCropMode]);

  // Render crop preview
  useEffect(() => {
      if (showCropMode && originalImage && canvasRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          // Fit canvas to container width, maintain aspect ratio
          const containerWidth = Math.min(600, window.innerWidth - 64);
          const scale = containerWidth / originalImage.width;
          canvas.width = containerWidth;
          canvas.height = originalImage.height * scale;

          // Draw image
          ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

          // Convert crop percentages to canvas coordinates
          const corners = {
            topLeft: { 
              x: (crop.topLeft.x / 100) * canvas.width, 
              y: (crop.topLeft.y / 100) * canvas.height 
            },
            topRight: { 
              x: (crop.topRight.x / 100) * canvas.width, 
              y: (crop.topRight.y / 100) * canvas.height 
            },
            bottomLeft: { 
              x: (crop.bottomLeft.x / 100) * canvas.width, 
              y: (crop.bottomLeft.y / 100) * canvas.height 
            },
            bottomRight: { 
              x: (crop.bottomRight.x / 100) * canvas.width, 
              y: (crop.bottomRight.y / 100) * canvas.height 
            }
          };

          // Draw dark overlay everywhere except the crop area
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Clear the crop area (create a "hole" in the overlay)
          ctx.globalCompositeOperation = 'destination-out';
          ctx.beginPath();
          ctx.moveTo(corners.topLeft.x, corners.topLeft.y);
          ctx.lineTo(corners.topRight.x, corners.topRight.y);
          ctx.lineTo(corners.bottomRight.x, corners.bottomRight.y);
          ctx.lineTo(corners.bottomLeft.x, corners.bottomLeft.y);
          ctx.closePath();
          ctx.fill();

          // Reset composite operation
          ctx.globalCompositeOperation = 'source-over';

          // Draw boundary lines
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(corners.topLeft.x, corners.topLeft.y);
          ctx.lineTo(corners.topRight.x, corners.topRight.y);
          ctx.lineTo(corners.bottomRight.x, corners.bottomRight.y);
          ctx.lineTo(corners.bottomLeft.x, corners.bottomLeft.y);
          ctx.closePath();
          ctx.stroke();
          
          // Draw resize handles - minden sarok
          const handleSize = 18;
          ctx.setLineDash([]);
          
          // Corner handles (piros)
          ctx.fillStyle = '#ef4444';
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 2;
          
          // Top-left corner
          ctx.fillRect(corners.topLeft.x - handleSize/2, corners.topLeft.y - handleSize/2, handleSize, handleSize);
          ctx.strokeRect(corners.topLeft.x - handleSize/2, corners.topLeft.y - handleSize/2, handleSize, handleSize);
          
          // Top-right corner
          ctx.fillRect(corners.topRight.x - handleSize/2, corners.topRight.y - handleSize/2, handleSize, handleSize);
          ctx.strokeRect(corners.topRight.x - handleSize/2, corners.topRight.y - handleSize/2, handleSize, handleSize);
          
          // Bottom-left corner
          ctx.fillRect(corners.bottomLeft.x - handleSize/2, corners.bottomLeft.y - handleSize/2, handleSize, handleSize);
          ctx.strokeRect(corners.bottomLeft.x - handleSize/2, corners.bottomLeft.y - handleSize/2, handleSize, handleSize);
          
          // Bottom-right corner
          ctx.fillRect(corners.bottomRight.x - handleSize/2, corners.bottomRight.y - handleSize/2, handleSize, handleSize);
          ctx.strokeRect(corners.bottomRight.x - handleSize/2, corners.bottomRight.y - handleSize/2, handleSize, handleSize);
          
          // Edge handles (kék) - oldalak közepén
          ctx.fillStyle = '#3b82f6';
          ctx.strokeStyle = '#1d4ed8';
          
          // Top edge (felső oldal közepe)
          const topMidX = (corners.topLeft.x + corners.topRight.x) / 2;
          const topMidY = (corners.topLeft.y + corners.topRight.y) / 2;
          ctx.fillRect(topMidX - handleSize/2, topMidY - handleSize/2, handleSize, handleSize);
          ctx.strokeRect(topMidX - handleSize/2, topMidY - handleSize/2, handleSize, handleSize);
          
          // Bottom edge (alsó oldal közepe)
          const bottomMidX = (corners.bottomLeft.x + corners.bottomRight.x) / 2;
          const bottomMidY = (corners.bottomLeft.y + corners.bottomRight.y) / 2;
          ctx.fillRect(bottomMidX - handleSize/2, bottomMidY - handleSize/2, handleSize, handleSize);
          ctx.strokeRect(bottomMidX - handleSize/2, bottomMidY - handleSize/2, handleSize, handleSize);
          
          // Left edge (bal oldal közepe)
          const leftMidX = (corners.topLeft.x + corners.bottomLeft.x) / 2;
          const leftMidY = (corners.topLeft.y + corners.bottomLeft.y) / 2;
          ctx.fillRect(leftMidX - handleSize/2, leftMidY - handleSize/2, handleSize, handleSize);
          ctx.strokeRect(leftMidX - handleSize/2, leftMidY - handleSize/2, handleSize, handleSize);
          
          // Right edge (jobb oldal közepe)
          const rightMidX = (corners.topRight.x + corners.bottomRight.x) / 2;
          const rightMidY = (corners.topRight.y + corners.bottomRight.y) / 2;
          ctx.fillRect(rightMidX - handleSize/2, rightMidY - handleSize/2, handleSize, handleSize);
          ctx.strokeRect(rightMidX - handleSize/2, rightMidY - handleSize/2, handleSize, handleSize);
      }
  }, [showCropMode, crop, originalImage]);

  // Interactive crop handlers
  const getHandleAtPosition = (clientX: number, clientY: number): string | null => {
    if (!canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;
    
    // Scale coordinates to canvas internal dimensions
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const scaledX = canvasX * scaleX;
    const scaledY = canvasY * scaleY;
    
    // Convert crop percentages to canvas coordinates
    const corners = {
      topLeft: { 
        x: (crop.topLeft.x / 100) * canvas.width, 
        y: (crop.topLeft.y / 100) * canvas.height 
      },
      topRight: { 
        x: (crop.topRight.x / 100) * canvas.width, 
        y: (crop.topRight.y / 100) * canvas.height 
      },
      bottomLeft: { 
        x: (crop.bottomLeft.x / 100) * canvas.width, 
        y: (crop.bottomLeft.y / 100) * canvas.height 
      },
      bottomRight: { 
        x: (crop.bottomRight.x / 100) * canvas.width, 
        y: (crop.bottomRight.y / 100) * canvas.height 
      }
    };
    
    const tolerance = 15;
    
    // Check corner handles first (higher priority)
    if (Math.abs(scaledX - corners.topLeft.x) < tolerance && Math.abs(scaledY - corners.topLeft.y) < tolerance) return 'top-left';
    if (Math.abs(scaledX - corners.topRight.x) < tolerance && Math.abs(scaledY - corners.topRight.y) < tolerance) return 'top-right';
    if (Math.abs(scaledX - corners.bottomLeft.x) < tolerance && Math.abs(scaledY - corners.bottomLeft.y) < tolerance) return 'bottom-left';
    if (Math.abs(scaledX - corners.bottomRight.x) < tolerance && Math.abs(scaledY - corners.bottomRight.y) < tolerance) return 'bottom-right';
    
    // Check edge handles (oldalak közepén)
    const topMidX = (corners.topLeft.x + corners.topRight.x) / 2;
    const topMidY = (corners.topLeft.y + corners.topRight.y) / 2;
    if (Math.abs(scaledX - topMidX) < tolerance && Math.abs(scaledY - topMidY) < tolerance) return 'top';
    
    const bottomMidX = (corners.bottomLeft.x + corners.bottomRight.x) / 2;
    const bottomMidY = (corners.bottomLeft.y + corners.bottomRight.y) / 2;
    if (Math.abs(scaledX - bottomMidX) < tolerance && Math.abs(scaledY - bottomMidY) < tolerance) return 'bottom';
    
    const leftMidX = (corners.topLeft.x + corners.bottomLeft.x) / 2;
    const leftMidY = (corners.topLeft.y + corners.bottomLeft.y) / 2;
    if (Math.abs(scaledX - leftMidX) < tolerance && Math.abs(scaledY - leftMidY) < tolerance) return 'left';
    
    const rightMidX = (corners.topRight.x + corners.bottomRight.x) / 2;
    const rightMidY = (corners.topRight.y + corners.bottomRight.y) / 2;
    if (Math.abs(scaledX - rightMidX) < tolerance && Math.abs(scaledY - rightMidY) < tolerance) return 'right';
    
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!showCropMode || !canvasRef.current) return;
    
    const handle = getHandleAtPosition(e.clientX, e.clientY);
    console.log('Mouse down - Handle detected:', handle);
    
    if (handle) {
      setIsDragging(true);
      setDragHandle(handle);
      setDragStart({ x: e.clientX, y: e.clientY });
      console.log('Started dragging:', handle);
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!showCropMode || !canvasRef.current) return;
    
    if (isDragging && dragHandle) {
      // Handle dragging - this will be handled by global mouse move
      return;
    } else {
      // Update cursor based on handle position
      const handle = getHandleAtPosition(e.clientX, e.clientY);
      if (handle) {
        const cursors: { [key: string]: string } = {
          'top': 'n-resize',
          'bottom': 'n-resize',
          'left': 'w-resize',
          'right': 'w-resize',
          'top-left': 'nw-resize',
          'top-right': 'ne-resize',
          'bottom-left': 'sw-resize',
          'bottom-right': 'se-resize'
        };
        canvasRef.current.style.cursor = cursors[handle] || 'default';
      } else {
        canvasRef.current.style.cursor = 'default';
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragHandle(null);
  };

  // Add global mouse event listeners for better drag handling
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging && dragHandle && canvasRef.current) {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        
        // Calculate movement delta
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        
        // Convert to percentage based on canvas display size
        const deltaXPercent = (deltaX / rect.width) * 100;
        const deltaYPercent = (deltaY / rect.height) * 100;
        
        let newCrop = { ...crop };
        
        switch (dragHandle) {
          case 'top-left':
            // Bal felső sarok mozgatása
            newCrop.topLeft = {
              x: Math.max(0, Math.min(100, crop.topLeft.x + deltaXPercent)),
              y: Math.max(0, Math.min(100, crop.topLeft.y + deltaYPercent))
            };
            break;
          case 'top-right':
            // Jobb felső sarok mozgatása
            newCrop.topRight = {
              x: Math.max(0, Math.min(100, crop.topRight.x + deltaXPercent)),
              y: Math.max(0, Math.min(100, crop.topRight.y + deltaYPercent))
            };
            break;
          case 'bottom-left':
            // Bal alsó sarok mozgatása
            newCrop.bottomLeft = {
              x: Math.max(0, Math.min(100, crop.bottomLeft.x + deltaXPercent)),
              y: Math.max(0, Math.min(100, crop.bottomLeft.y + deltaYPercent))
            };
            break;
          case 'bottom-right':
            // Jobb alsó sarok mozgatása
            newCrop.bottomRight = {
              x: Math.max(0, Math.min(100, crop.bottomRight.x + deltaXPercent)),
              y: Math.max(0, Math.min(100, crop.bottomRight.y + deltaYPercent))
            };
            break;
          case 'top':
            // Felső oldal mozgatása - mindkét felső sarok együtt
            newCrop.topLeft = {
              ...crop.topLeft,
              y: Math.max(0, Math.min(100, crop.topLeft.y + deltaYPercent))
            };
            newCrop.topRight = {
              ...crop.topRight,
              y: Math.max(0, Math.min(100, crop.topRight.y + deltaYPercent))
            };
            break;
          case 'bottom':
            // Alsó oldal mozgatása - mindkét alsó sarok együtt
            newCrop.bottomLeft = {
              ...crop.bottomLeft,
              y: Math.max(0, Math.min(100, crop.bottomLeft.y + deltaYPercent))
            };
            newCrop.bottomRight = {
              ...crop.bottomRight,
              y: Math.max(0, Math.min(100, crop.bottomRight.y + deltaYPercent))
            };
            break;
          case 'left':
            // Bal oldal mozgatása - mindkét bal sarok együtt
            newCrop.topLeft = {
              ...crop.topLeft,
              x: Math.max(0, Math.min(100, crop.topLeft.x + deltaXPercent))
            };
            newCrop.bottomLeft = {
              ...crop.bottomLeft,
              x: Math.max(0, Math.min(100, crop.bottomLeft.x + deltaXPercent))
            };
            break;
          case 'right':
            // Jobb oldal mozgatása - mindkét jobb sarok együtt
            newCrop.topRight = {
              ...crop.topRight,
              x: Math.max(0, Math.min(100, crop.topRight.x + deltaXPercent))
            };
            newCrop.bottomRight = {
              ...crop.bottomRight,
              x: Math.max(0, Math.min(100, crop.bottomRight.x + deltaXPercent))
            };
            break;
        }
        
        setCrop(newCrop);
        setDragStart({ x: e.clientX, y: e.clientY });
        
        // Prevent default to avoid text selection and other issues
        e.preventDefault();
      }
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        setIsDragging(false);
        setDragHandle(null);
        e.preventDefault();
      }
    };

    if (isDragging) {
      // Use non-passive listeners to allow preventDefault
      document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
      document.addEventListener('mouseup', handleGlobalMouseUp, { passive: false });
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragHandle, dragStart, crop]);

  // Debug logging
  useEffect(() => {
    console.log('Crop state:', crop);
    console.log('Dragging:', isDragging, 'Handle:', dragHandle);
  }, [crop, isDragging, dragHandle]);

  if (!formData) return null;

  const handleSave = () => {
    if (formData) {
        if (showCropMode && originalImage) {
            // Apply crop and save
             const canvas = document.createElement('canvas');
             const ctx = canvas.getContext('2d');
             if (ctx) {
                 // Convert percentages to actual pixel coordinates
                 const corners = {
                   topLeft: { 
                     x: (crop.topLeft.x / 100) * originalImage.width, 
                     y: (crop.topLeft.y / 100) * originalImage.height 
                   },
                   topRight: { 
                     x: (crop.topRight.x / 100) * originalImage.width, 
                     y: (crop.topRight.y / 100) * originalImage.height 
                   },
                   bottomLeft: { 
                     x: (crop.bottomLeft.x / 100) * originalImage.width, 
                     y: (crop.bottomLeft.y / 100) * originalImage.height 
                   },
                   bottomRight: { 
                     x: (crop.bottomRight.x / 100) * originalImage.width, 
                     y: (crop.bottomRight.y / 100) * originalImage.height 
                   }
                 };

                 // Calculate bounding box
                 const minX = Math.min(corners.topLeft.x, corners.topRight.x, corners.bottomLeft.x, corners.bottomRight.x);
                 const maxX = Math.max(corners.topLeft.x, corners.topRight.x, corners.bottomLeft.x, corners.bottomRight.x);
                 const minY = Math.min(corners.topLeft.y, corners.topRight.y, corners.bottomLeft.y, corners.bottomRight.y);
                 const maxY = Math.max(corners.topLeft.y, corners.topRight.y, corners.bottomLeft.y, corners.bottomRight.y);

                 canvas.width = maxX - minX;
                 canvas.height = maxY - minY;
                 
                 // Adjust coordinates and create clipping path
                 const adjustedCorners = {
                   topLeft: { x: corners.topLeft.x - minX, y: corners.topLeft.y - minY },
                   topRight: { x: corners.topRight.x - minX, y: corners.topRight.y - minY },
                   bottomLeft: { x: corners.bottomLeft.x - minX, y: corners.bottomLeft.y - minY },
                   bottomRight: { x: corners.bottomRight.x - minX, y: corners.bottomRight.y - minY }
                 };

                 ctx.beginPath();
                 ctx.moveTo(adjustedCorners.topLeft.x, adjustedCorners.topLeft.y);
                 ctx.lineTo(adjustedCorners.topRight.x, adjustedCorners.topRight.y);
                 ctx.lineTo(adjustedCorners.bottomRight.x, adjustedCorners.bottomRight.y);
                 ctx.lineTo(adjustedCorners.bottomLeft.x, adjustedCorners.bottomLeft.y);
                 ctx.closePath();
                 ctx.clip();

                 ctx.drawImage(originalImage, -minX, -minY);
                 const newImageUrl = canvas.toDataURL('image/jpeg', 0.9);
                 
                 // Create updated item with new image
                 const updatedItem: BulkResultItem = {
                   ...item,
                   data: formData,
                   imageUrl: newImageUrl
                 };
                 onSave(updatedItem);
             } else {
                 // Create updated item without image change
                 const updatedItem: BulkResultItem = {
                   ...item,
                   data: formData,
                   imageUrl: currentImageUrl
                 };
                 onSave(updatedItem);
             }
        } else {
            // Create updated item with current image (may have been enhanced)
            const updatedItem: BulkResultItem = {
              ...item,
              data: formData,
              imageUrl: currentImageUrl
            };
            onSave(updatedItem);
        }
        onClose();
    }
  };

  const handleImageUpdate = (newImageUrl: string) => {
    setCurrentImageUrl(newImageUrl);
  };

  const applyCrop = () => {
    if (originalImage) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Convert percentages to actual pixel coordinates
        const corners = {
          topLeft: { 
            x: (crop.topLeft.x / 100) * originalImage.width, 
            y: (crop.topLeft.y / 100) * originalImage.height 
          },
          topRight: { 
            x: (crop.topRight.x / 100) * originalImage.width, 
            y: (crop.topRight.y / 100) * originalImage.height 
          },
          bottomLeft: { 
            x: (crop.bottomLeft.x / 100) * originalImage.width, 
            y: (crop.bottomLeft.y / 100) * originalImage.height 
          },
          bottomRight: { 
            x: (crop.bottomRight.x / 100) * originalImage.width, 
            y: (crop.bottomRight.y / 100) * originalImage.height 
          }
        };

        // Calculate bounding box for the canvas size
        const minX = Math.min(corners.topLeft.x, corners.topRight.x, corners.bottomLeft.x, corners.bottomRight.x);
        const maxX = Math.max(corners.topLeft.x, corners.topRight.x, corners.bottomLeft.x, corners.bottomRight.x);
        const minY = Math.min(corners.topLeft.y, corners.topRight.y, corners.bottomLeft.y, corners.bottomRight.y);
        const maxY = Math.max(corners.topLeft.y, corners.topRight.y, corners.bottomLeft.y, corners.bottomRight.y);

        canvas.width = maxX - minX;
        canvas.height = maxY - minY;
        
        // Adjust corner coordinates relative to the bounding box
        const adjustedCorners = {
          topLeft: { x: corners.topLeft.x - minX, y: corners.topLeft.y - minY },
          topRight: { x: corners.topRight.x - minX, y: corners.topRight.y - minY },
          bottomLeft: { x: corners.bottomLeft.x - minX, y: corners.bottomLeft.y - minY },
          bottomRight: { x: corners.bottomRight.x - minX, y: corners.bottomRight.y - minY }
        };

        // Create clipping path for the irregular shape
        ctx.beginPath();
        ctx.moveTo(adjustedCorners.topLeft.x, adjustedCorners.topLeft.y);
        ctx.lineTo(adjustedCorners.topRight.x, adjustedCorners.topRight.y);
        ctx.lineTo(adjustedCorners.bottomRight.x, adjustedCorners.bottomRight.y);
        ctx.lineTo(adjustedCorners.bottomLeft.x, adjustedCorners.bottomLeft.y);
        ctx.closePath();
        ctx.clip();

        // Draw the original image, offset by the bounding box
        ctx.drawImage(originalImage, -minX, -minY);
        
        const newImageUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        setCurrentImageUrl(newImageUrl);
        setShowCropMode(false);
        setCrop({ 
          topLeft: { x: 0, y: 0 },
          topRight: { x: 100, y: 0 },
          bottomLeft: { x: 0, y: 100 },
          bottomRight: { x: 100, y: 100 }
        });
      }
    }
  };

  // --- TYPE CHANGE HANDLER ---
  const handleTypeChange = (newType: ExerciseType) => {
      if (!formData) return;
      
      if (confirm("A típus váltása törli a jelenlegi tartalom szerkezetét. Biztosan váltasz?")) {
          let newContent: any = {};
          
          // Initialize empty content for the new type
          if (newType === ExerciseType.MATCHING) {
              newContent = { pairs: [{ id: 'p1', left: '', right: '' }] };
          } else if (newType === ExerciseType.CATEGORIZATION) {
              newContent = { 
                  categories: [{ id: 'c1', name: 'Kategória 1' }, { id: 'c2', name: 'Kategória 2' }], 
                  items: [{ id: 'i1', text: 'Elem 1', categoryId: 'c1' }] 
              };
          } else if (newType === ExerciseType.QUIZ) {
              newContent = { 
                  questions: [{ 
                      id: 'q1', 
                      question: 'Írd ide a kérdést...', 
                      options: ['Válasz A', 'Válasz B'], 
                      correctIndex: 0,
                      multiSelect: false,
                      correctIndices: [0]
                  }] 
              };
          }

          setFormData({
              ...formData,
              type: newType,
              content: newContent
          });
      }
  };

  // --- MATCHING EDITORS ---
  const updateMatchingPair = (index: number, field: 'left' | 'right', value: string) => {
      const content = formData.content as MatchingContent;
      const newPairs = [...content.pairs];
      newPairs[index] = { ...newPairs[index], [field]: value };
      setFormData({ ...formData, content: { ...content, pairs: newPairs } });
  };

  const addMatchingPair = () => {
      const content = formData.content as MatchingContent;
      const newId = `pair-${Date.now()}`;
      setFormData({
          ...formData,
          content: { ...content, pairs: [...content.pairs, { id: newId, left: '', right: '' }] }
      });
  };

  const removeMatchingPair = (index: number) => {
      const content = formData.content as MatchingContent;
      const newPairs = content.pairs.filter((_, i) => i !== index);
      setFormData({ ...formData, content: { ...content, pairs: newPairs } });
  };

  // --- CATEGORIZATION EDITORS ---
  const updateCategory = (index: number, name: string) => {
      const content = formData.content as CategorizationContent;
      const newCats = [...content.categories];
      newCats[index] = { ...newCats[index], name };
      setFormData({ ...formData, content: { ...content, categories: newCats } });
  };

  const addCategory = () => {
      const content = formData.content as CategorizationContent;
      const newId = `cat-${Date.now()}`;
      setFormData({
          ...formData,
          content: { ...content, categories: [...content.categories, { id: newId, name: 'Új kategória' }] }
      });
  };

  const removeCategory = (index: number) => {
      const content = formData.content as CategorizationContent;
      const catId = content.categories[index].id;
      const newCats = content.categories.filter((_, i) => i !== index);
      const newItems = content.items.filter(i => i.categoryId !== catId);
      setFormData({ ...formData, content: { ...content, categories: newCats, items: newItems } });
  };

  const updateCatItem = (index: number, field: 'text' | 'categoryId', value: string) => {
      const content = formData.content as CategorizationContent;
      const newItems = [...content.items];
      newItems[index] = { ...newItems[index], [field]: value };
      setFormData({ ...formData, content: { ...content, items: newItems } });
  };

  const addCatItem = () => {
      const content = formData.content as CategorizationContent;
      if (content.categories.length === 0) return alert("Előbb hozz létre kategóriát!");
      const newId = `item-${Date.now()}`;
      setFormData({
          ...formData,
          content: { ...content, items: [...content.items, { id: newId, text: '', categoryId: content.categories[0].id }] }
      });
  };

  const removeCatItem = (index: number) => {
      const content = formData.content as CategorizationContent;
      const newItems = content.items.filter((_, i) => i !== index);
      setFormData({ ...formData, content: { ...content, items: newItems } });
  };

  // --- QUIZ EDITORS ---
  const updateQuestion = (qIndex: number, field: 'question' | 'multiSelect', value: any) => {
      const content = formData.content as QuizContent;
      const newQs = [...content.questions];
      
      if (field === 'multiSelect') {
          newQs[qIndex] = { 
              ...newQs[qIndex], 
              multiSelect: value,
              correctIndices: value ? [newQs[qIndex].correctIndex] : undefined 
          };
      } else {
          newQs[qIndex] = { ...newQs[qIndex], [field]: value };
      }
      
      setFormData({ ...formData, content: { ...content, questions: newQs } });
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
      const content = formData.content as QuizContent;
      const newQs = [...content.questions];
      const newOpts = [...newQs[qIndex].options];
      newOpts[oIndex] = value;
      newQs[qIndex] = { ...newQs[qIndex], options: newOpts };
      setFormData({ ...formData, content: { ...content, questions: newQs } });
  };

  const toggleCorrectOption = (qIndex: number, oIndex: number) => {
      const content = formData.content as QuizContent;
      const newQs = [...content.questions];
      const question = newQs[qIndex];

      if (question.multiSelect) {
          let newIndices = question.correctIndices ? [...question.correctIndices] : [];
          if (newIndices.includes(oIndex)) {
              newIndices = newIndices.filter(i => i !== oIndex);
          } else {
              newIndices.push(oIndex);
          }
          newQs[qIndex] = { ...question, correctIndices: newIndices };
      } else {
          newQs[qIndex] = { ...question, correctIndex: oIndex };
      }
      
      setFormData({ ...formData, content: { ...content, questions: newQs } });
  };

  const addQuestion = () => {
      const content = formData.content as QuizContent;
      const newId = `q-${Date.now()}`;
      setFormData({
          ...formData,
          content: { ...content, questions: [...content.questions, { id: newId, question: 'Új kérdés', options: ['Válasz 1', 'Válasz 2'], correctIndex: 0, multiSelect: false, correctIndices: [0] }] }
      });
  };

  const removeQuestion = (index: number) => {
      const content = formData.content as QuizContent;
      const newQs = content.questions.filter((_, i) => i !== index);
      setFormData({ ...formData, content: { ...content, questions: newQs } });
  };

  const addOption = (qIndex: number) => {
      const content = formData.content as QuizContent;
      const newQs = [...content.questions];
      const newOpts = [...newQs[qIndex].options, 'Új válasz'];
      newQs[qIndex] = { ...newQs[qIndex], options: newOpts };
      setFormData({ ...formData, content: { ...content, questions: newQs } });
  };

  const removeOption = (qIndex: number, oIndex: number) => {
      const content = formData.content as QuizContent;
      const newQs = [...content.questions];
      const question = newQs[qIndex];
      
      // Don't allow removing if only 2 options left
      if (question.options.length <= 2) {
          alert('Legalább 2 válaszlehetőség szükséges!');
          return;
      }
      
      const newOpts = question.options.filter((_, i) => i !== oIndex);
      
      // Update correct indices if needed
      let newCorrectIndex = question.correctIndex;
      let newCorrectIndices = question.correctIndices ? [...question.correctIndices] : [];
      
      if (question.multiSelect) {
          // Remove the deleted option index and adjust higher indices
          newCorrectIndices = newCorrectIndices
              .filter(idx => idx !== oIndex)
              .map(idx => idx > oIndex ? idx - 1 : idx);
      } else {
          // Adjust single correct index
          if (newCorrectIndex === oIndex) {
              newCorrectIndex = 0; // Default to first option
          } else if (newCorrectIndex > oIndex) {
              newCorrectIndex = newCorrectIndex - 1;
          }
      }
      
      newQs[qIndex] = { 
          ...question, 
          options: newOpts,
          correctIndex: newCorrectIndex,
          correctIndices: newCorrectIndices
      };
      
      setFormData({ ...formData, content: { ...content, questions: newQs } });
  };

  return (
    // UPDATED: Reduced top padding from pt-24 to pt-16 for better header visibility
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        // Close modal if clicking on backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* UPDATED: Changed max-h to 80vh to prevent bottom overflow */}
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col relative"
        onClick={(e) => e.stopPropagation()} // Prevent backdrop click when clicking inside modal
      >
        <div className="bg-brand-100 px-4 py-3 text-brand-900 border-b border-brand-200 flex justify-between items-center shrink-0 rounded-t-xl relative">
          <div className="flex gap-2">
              <button 
                onClick={() => setActiveTab('CONTENT')}
                className={`px-4 py-2 font-bold text-xs rounded-t-lg transition-colors ${activeTab === 'CONTENT' ? 'bg-white text-brand-900 border-t-2 border-brand-600 shadow-sm' : 'text-brand-700 hover:bg-brand-200'}`}
              >
                  Tartalom
              </button>
              {currentImageUrl && (
                <button 
                    onClick={() => setActiveTab('IMAGE')}
                    className={`px-4 py-2 font-bold text-xs rounded-t-lg transition-colors ${activeTab === 'IMAGE' ? 'bg-white text-brand-900 border-t-2 border-brand-600 shadow-sm' : 'text-brand-700 hover:bg-brand-200'}`}
                >
                    Kép szerkesztés
                </button>
              )}
          </div>
          {/* FIXED: Larger, more visible close button with better positioning */}
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }} 
            className="p-2 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors bg-white shadow-sm border border-gray-200 z-10"
            title="Bezárás (ESC)"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
            {activeTab === 'IMAGE' ? (
                <div className="space-y-4">
                    {/* AI Enhancement and Image Viewer */}
                    <div className="bg-white rounded-xl p-4 border border-slate-200">
                        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Kép szerkesztés és AI javítás
                        </h3>
                        <div className="h-96 bg-slate-900 rounded-lg overflow-hidden">
                            <ImageViewer 
                                src={currentImageUrl}
                                alt="Szerkesztendő kép"
                                onImageUpdate={handleImageUpdate}
                                studentMode={false}
                            />
                        </div>
                        <p className="text-xs text-slate-600 mt-2 bg-blue-50 p-2 rounded border border-blue-200">
                            💡 Használd az AI funkciókat a kép minőségének javítására, majd a vágás funkcióval távolítsd el a felesleges részeket.
                        </p>
                    </div>

                    {/* Crop Controls */}
                    <div className="bg-white rounded-xl p-4 border border-slate-200">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                                </svg>
                                Képvágás
                            </h3>
                            <button
                                onClick={() => setShowCropMode(!showCropMode)}
                                className={`px-3 py-1 rounded text-xs font-medium ${
                                    showCropMode 
                                        ? 'bg-red-100 text-red-700 border border-red-200' 
                                        : 'bg-green-100 text-green-700 border border-green-200'
                                }`}
                            >
                                {showCropMode ? 'Vágás bezárása' : 'Vágás megnyitása'}
                            </button>
                        </div>

                        {showCropMode && (
                            <div className="flex gap-4">
                                {/* Left side - Image */}
                                <div className="flex-1">
                                    <p className="text-xs text-slate-600 mb-4 bg-yellow-50 p-2 rounded border border-yellow-200">
                                        ⚠️ Sötétített rész eltávolításra kerül. <strong>Piros sarkok</strong>: szabadon mozgathatók (szabálytalan alakzat), <strong>Kék oldalak</strong>: egyenes vonalak.
                                    </p>
                                    <canvas 
                                        ref={canvasRef} 
                                        className="border border-slate-300 shadow-md max-w-full rounded cursor-default select-none" 
                                        onMouseDown={handleMouseDown}
                                        onMouseMove={handleMouseMove}
                                        onMouseUp={handleMouseUp}
                                        onMouseLeave={handleMouseUp}
                                        style={{ touchAction: 'none', userSelect: 'none' }}
                                    />
                                </div>
                                
                                {/* Right side - Controls */}
                                <div className="w-80 space-y-4">
                                    {/* Interactive Instructions */}
                                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                        <h4 className="text-sm font-bold text-blue-800 mb-2">🖱️ Szabálytalan vágás</h4>
                                        <ul className="text-xs text-blue-700 space-y-1">
                                            <li>• <span className="font-medium text-red-600">Piros sarkok</span>: szabadon mozgathatók (szabálytalan alakzat)</li>
                                            <li>• <span className="font-medium text-blue-600">Kék oldalak</span>: egyenes vonalak (párhuzamos mozgatás)</li>
                                            <li>• Lehetséges ferde, trapéz, vagy más alakzat kialakítása</li>
                                        </ul>
                                    </div>

                                    <div className="space-y-2">
                                        <button
                                            onClick={applyCrop}
                                            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded text-sm font-medium flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Vágás alkalmazása
                                        </button>
                                        <button
                                            onClick={() => setCrop({ 
                                              topLeft: { x: 0, y: 0 },
                                              topRight: { x: 100, y: 0 },
                                              bottomLeft: { x: 0, y: 100 },
                                              bottomRight: { x: 100, y: 100 }
                                            })}
                                            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-medium"
                                        >
                                            Visszaállítás
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
            <>
            {/* Type Selector - Compact */}
            <div className="mb-4 flex items-center gap-2 bg-orange-50 p-2 rounded-lg border border-orange-100">
                 <label className="text-xs font-bold text-orange-800 uppercase shrink-0">Típus:</label>
                 <select 
                    value={formData.type}
                    onChange={(e) => handleTypeChange(e.target.value as ExerciseType)}
                    className="flex-1 px-2 py-1 rounded border border-orange-300 text-xs font-bold text-orange-900 bg-white"
                 >
                     <option value={ExerciseType.MATCHING}>Párosító</option>
                     <option value={ExerciseType.CATEGORIZATION}>Csoportosító</option>
                     <option value={ExerciseType.QUIZ}>Kvíz / Teszt</option>
                 </select>
            </div>

            {/* Header Info - Large Text Blocks */}
            <div className="space-y-4 mb-4 bg-white p-4 rounded-lg border border-slate-200">
                <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Feladat címe
                    </label>
                    <textarea 
                        value={formData.title} 
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 resize-y focus:ring-2 focus:ring-brand-400 focus:border-brand-400 bg-slate-50"
                        rows={3}
                        placeholder="Írd ide a feladat címét..."
                    />
                </div>
                <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Feladat utasítása
                    </label>
                    <textarea 
                        value={formData.instruction} 
                        onChange={(e) => setFormData({...formData, instruction: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 resize-y focus:ring-2 focus:ring-brand-400 focus:border-brand-400 bg-slate-50"
                        rows={4}
                        placeholder="Írd ide a feladat részletes utasítását..."
                    />
                </div>
            </div>

            {/* Dynamic Content Editor */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                
                {formData.type === ExerciseType.MATCHING && (
                    <div className="space-y-2">
                        {(formData.content as MatchingContent).pairs.map((pair, idx) => (
                            <div key={pair.id} className="flex gap-2 items-center">
                                <span className="text-slate-400 font-mono text-[10px] w-4">{idx+1}</span>
                                <input 
                                    className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs"
                                    value={pair.left}
                                    onChange={(e) => updateMatchingPair(idx, 'left', e.target.value)}
                                    placeholder="Bal"
                                />
                                <span className="text-slate-300 text-xs">↔</span>
                                <input 
                                    className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs"
                                    value={pair.right}
                                    onChange={(e) => updateMatchingPair(idx, 'right', e.target.value)}
                                    placeholder="Jobb"
                                />
                                <button onClick={() => removeMatchingPair(idx)} className="text-slate-300 hover:text-red-500">×</button>
                            </div>
                        ))}
                        <button onClick={addMatchingPair} className="mt-1 text-brand-600 text-xs font-bold hover:underline">+ Pár</button>
                    </div>
                )}

                {formData.type === ExerciseType.CATEGORIZATION && (
                    <div className="space-y-4">
                        <div className="space-y-1">
                            {(formData.content as CategorizationContent).categories.map((cat, idx) => (
                                <div key={cat.id} className="flex gap-2 items-center">
                                    <span className="text-[10px] text-slate-400">Kat.</span>
                                    <input 
                                        className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs font-bold"
                                        value={cat.name}
                                        onChange={(e) => updateCategory(idx, e.target.value)}
                                    />
                                    <button onClick={() => removeCategory(idx)} className="text-slate-300 hover:text-red-500">×</button>
                                </div>
                            ))}
                            <button onClick={addCategory} className="text-brand-600 text-xs font-bold">+ Kategória</button>
                        </div>
                        <div className="space-y-1">
                            {(formData.content as CategorizationContent).items.map((item, idx) => (
                                <div key={item.id} className="flex gap-2 items-center">
                                    <input 
                                        className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs"
                                        value={item.text}
                                        onChange={(e) => updateCatItem(idx, 'text', e.target.value)}
                                        placeholder="Elem"
                                    />
                                    <select 
                                        className="px-2 py-1 border border-slate-300 rounded text-xs w-24"
                                        value={item.categoryId}
                                        onChange={(e) => updateCatItem(idx, 'categoryId', e.target.value)}
                                    >
                                        {(formData.content as CategorizationContent).categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <button onClick={() => removeCatItem(idx)} className="text-slate-300 hover:text-red-500">×</button>
                                </div>
                            ))}
                            <button onClick={addCatItem} className="text-brand-600 text-xs font-bold">+ Elem</button>
                        </div>
                    </div>
                )}

                {formData.type === ExerciseType.QUIZ && (
                    <div className="space-y-2">
                         {(formData.content as QuizContent).questions.map((q, qIdx) => (
                             <div key={q.id} className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                                 <div className="flex justify-between items-center mb-1">
                                     <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">#{qIdx+1}</span>
                                        <label className="flex items-center gap-1 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={q.multiSelect || false}
                                                onChange={(e) => updateQuestion(qIdx, 'multiSelect', e.target.checked)}
                                                className="w-3 h-3 text-brand-600 rounded"
                                            />
                                            <span className="text-[10px] text-slate-600">Multi</span>
                                        </label>
                                     </div>
                                     <button onClick={() => removeQuestion(qIdx)} className="text-slate-300 hover:text-red-500 text-[10px]">Törlés</button>
                                 </div>
                                 <input 
                                     className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-bold mb-1"
                                     value={q.question}
                                     onChange={(e) => updateQuestion(qIdx, 'question', e.target.value)}
                                     placeholder="Kérdés..."
                                 />
                                 
                                 <div className="space-y-1 pl-2 border-l-2 border-slate-200">
                                     {q.options.map((opt, oIdx) => {
                                         const isSelected = q.multiSelect 
                                            ? q.correctIndices?.includes(oIdx) 
                                            : q.correctIndex === oIdx;
                                         
                                         return (
                                             <div key={oIdx} className="flex items-center gap-1">
                                                 <input 
                                                    type={q.multiSelect ? "checkbox" : "radio"} 
                                                    name={`q-${q.id}-correct`}
                                                    checked={isSelected || false}
                                                    onChange={() => toggleCorrectOption(qIdx, oIdx)}
                                                    className="cursor-pointer w-3 h-3 text-brand-600 shrink-0"
                                                 />
                                                 <input 
                                                     className="flex-1 px-1.5 py-0.5 border border-slate-300 rounded text-xs"
                                                     value={opt}
                                                     onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                                                 />
                                                 <button 
                                                     onClick={() => removeOption(qIdx, oIdx)}
                                                     className="text-slate-300 hover:text-red-500 text-xs w-4 h-4 flex items-center justify-center"
                                                     title="Válasz törlése"
                                                 >
                                                     ×
                                                 </button>
                                             </div>
                                         );
                                     })}
                                     <button 
                                         onClick={() => addOption(qIdx)}
                                         className="text-brand-600 text-xs font-bold hover:underline flex items-center gap-1 mt-1"
                                         title="Új válasz hozzáadása"
                                     >
                                         <span className="text-sm">+</span> Válasz
                                     </button>
                                 </div>
                             </div>
                         ))}
                         <button onClick={addQuestion} className="text-brand-600 text-xs font-bold">+ Kérdés</button>
                    </div>
                )}
            </div>
            </>
            )}
        </div>

        <div className="p-3 border-t border-slate-100 bg-white flex justify-between items-center gap-2 shrink-0 rounded-b-xl">
            <div className="text-xs text-slate-500">
                ESC billentyűvel is bezárható
            </div>
            <div className="flex gap-2">
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClose();
                  }} 
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-50 text-xs font-medium transition-colors"
                >
                  Bezárás
                </button>
                <button onClick={handleSave} className="bg-green-100 text-green-900 border border-green-200 px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-200 shadow-sm">
                    Mentés {activeTab === 'IMAGE' ? '& Alkalmazás' : ''}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default EditExerciseModal;
