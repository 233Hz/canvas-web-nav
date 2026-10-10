import { useState, useCallback, useEffect, useRef } from 'react';
import { MarqueeBox, Rect } from '../types/canvas';
import { screenToWorld, getMarqueeRect, rectsIntersect } from '../lib/canvasMath';
import { useCanvasStore } from '../store/canvasStore';

export function useMarqueeSelect() {
  const { viewport, folders, selectedFolderIds, setSelectedFolderIds, clearSelection } = useCanvasStore();
  const [marqueeBox, setMarqueeBox] = useState<MarqueeBox | null>(null);
  const isMarqueeActiveRef = useRef(false);
  const initialSelectedRef = useRef<string[]>([]);
  const isShiftRef = useRef(false);

  // Esc key clears selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearSelection();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearSelection]);

  const startMarquee = useCallback(
    (screenX: number, screenY: number, isShift = false) => {
      const worldPt = screenToWorld({ x: screenX, y: screenY }, viewport);
      isMarqueeActiveRef.current = true;
      isShiftRef.current = isShift;
      initialSelectedRef.current = isShift ? [...selectedFolderIds] : [];

      setMarqueeBox({
        startX: worldPt.x,
        startY: worldPt.y,
        currentX: worldPt.x,
        currentY: worldPt.y,
      });

      if (!isShift) {
        clearSelection();
      }
    },
    [viewport, selectedFolderIds, clearSelection]
  );

  const updateMarquee = useCallback(
    (screenX: number, screenY: number) => {
      if (!isMarqueeActiveRef.current || !marqueeBox) return;

      const worldPt = screenToWorld({ x: screenX, y: screenY }, viewport);
      const updatedBox: MarqueeBox = {
        ...marqueeBox,
        currentX: worldPt.x,
        currentY: worldPt.y,
      };
      setMarqueeBox(updatedBox);

      const selectionRect = getMarqueeRect(updatedBox);

      // Only perform collision if drag distance is greater than 4px
      if (selectionRect.width > 4 || selectionRect.height > 4) {
        const intersectingIds = folders
          .filter((folder) => {
            const folderRect: Rect = {
              x: folder.position_x,
              y: folder.position_y,
              width: folder.width,
              height: folder.height || 260,
            };
            return rectsIntersect(selectionRect, folderRect);
          })
          .map((f) => f.id);

        if (isShiftRef.current) {
          // Union of initial selection and current intersecting
          const merged = Array.from(new Set([...initialSelectedRef.current, ...intersectingIds]));
          setSelectedFolderIds(merged);
        } else {
          setSelectedFolderIds(intersectingIds);
        }
      }
    },
    [marqueeBox, viewport, folders, setSelectedFolderIds]
  );

  const endMarquee = useCallback(() => {
    isMarqueeActiveRef.current = false;
    setMarqueeBox(null);
  }, []);

  return {
    marqueeBox,
    isMarqueeSelecting: isMarqueeActiveRef.current,
    startMarquee,
    updateMarquee,
    endMarquee,
  };
}
