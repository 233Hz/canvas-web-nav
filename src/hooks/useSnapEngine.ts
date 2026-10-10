import { useCallback } from 'react';
import { Rect, SnapResult } from '../types/canvas';
import { calculateSnapping } from '../lib/canvasMath';
import { useCanvasStore } from '../store/canvasStore';

export function useSnapEngine() {
  const { folders, gridSnapping, viewport, setActiveGuides, clearActiveGuides } = useCanvasStore();

  const getSnappedPosition = useCallback(
    (
      activeFolderId: string,
      proposedX: number,
      proposedY: number,
      width: number,
      height: number,
      excludeIds: string[] = [activeFolderId]
    ): SnapResult => {
      const activeRect: Rect = {
        x: proposedX,
        y: proposedY,
        width,
        height,
      };

      // Exclude dragged folder and any co-dragged group members
      const otherRects: Rect[] = folders
        .filter((f) => !excludeIds.includes(f.id))
        .map((f) => ({
          x: f.position_x,
          y: f.position_y,
          width: f.width,
          height: f.height || 260, // fallback estimated height
        }));

      // Snapping threshold scaled by zoom so screen distance remains ~6px
      const thresholdInWorld = Math.max(6 / viewport.zoom, 4);

      const result = calculateSnapping(activeRect, otherRects, {
        gridSnapping,
        gridSize: 20,
        threshold: thresholdInWorld,
      });

      // Update active guides in store
      setActiveGuides(result.guides);

      return result;
    },
    [folders, gridSnapping, viewport.zoom, setActiveGuides]
  );

  return {
    getSnappedPosition,
    clearActiveGuides,
  };
}
