import { useState, useCallback, useRef } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { useSnapEngine } from './useSnapEngine';
import { screenToWorld } from '../lib/canvasMath';
import { Point } from '../types/canvas';

export function useGroupDrag() {
  const {
    folders,
    viewport,
    selectedFolderIds,
    setSelectedFolderIds,
    updateFoldersPositions,
    moveFolderToPanel,
  } = useCanvasStore();

  const { getSnappedPosition, clearActiveGuides } = useSnapEngine();

  const [isDragging, setIsDragging] = useState(false);
  const primaryFolderIdRef = useRef<string | null>(null);
  const dragStartWorldRef = useRef<Point>({ x: 0, y: 0 });
  const initialPositionsRef = useRef<Map<string, Point>>(new Map());

  const startGroupDrag = useCallback(
    (folderId: string, screenX: number, screenY: number, isShift = false) => {
      let activeSelection = [...selectedFolderIds];

      if (isShift) {
        if (activeSelection.includes(folderId)) {
          activeSelection = activeSelection.filter((id) => id !== folderId);
        } else {
          activeSelection = [...activeSelection, folderId];
        }
        setSelectedFolderIds(activeSelection);
      } else if (!activeSelection.includes(folderId)) {
        activeSelection = [folderId];
        setSelectedFolderIds(activeSelection);
      }

      if (activeSelection.length === 0) return;

      const worldPt = screenToWorld({ x: screenX, y: screenY }, viewport);
      dragStartWorldRef.current = worldPt;
      primaryFolderIdRef.current = folderId;

      const posMap = new Map<string, Point>();
      folders.forEach((f) => {
        if (activeSelection.includes(f.id)) {
          posMap.set(f.id, { x: f.position_x, y: f.position_y });
        }
      });
      initialPositionsRef.current = posMap;

      setIsDragging(true);
    },
    [selectedFolderIds, setSelectedFolderIds, viewport, folders]
  );

  const moveGroupDrag = useCallback(
    (screenX: number, screenY: number) => {
      if (!isDragging || !primaryFolderIdRef.current) return;

      const currentWorldPt = screenToWorld({ x: screenX, y: screenY }, viewport);
      const rawDeltaX = currentWorldPt.x - dragStartWorldRef.current.x;
      const rawDeltaY = currentWorldPt.y - dragStartWorldRef.current.y;

      const primaryId = primaryFolderIdRef.current;
      const primaryInitPos = initialPositionsRef.current.get(primaryId);
      if (!primaryInitPos) return;

      const primaryFolder = folders.find((f) => f.id === primaryId);
      const primaryWidth = primaryFolder?.width || 340;
      const primaryHeight = primaryFolder?.height || 260;

      const proposedPrimaryX = primaryInitPos.x + rawDeltaX;
      const proposedPrimaryY = primaryInitPos.y + rawDeltaY;

      const selectedIds = Array.from(initialPositionsRef.current.keys());
      const snapped = getSnappedPosition(
        primaryId,
        proposedPrimaryX,
        proposedPrimaryY,
        primaryWidth,
        primaryHeight,
        selectedIds
      );

      const effectiveDeltaX = snapped.x - primaryInitPos.x;
      const effectiveDeltaY = snapped.y - primaryInitPos.y;

      const updates = selectedIds.map((id) => {
        const init = initialPositionsRef.current.get(id)!;
        return {
          id,
          position_x: Math.round(init.x + effectiveDeltaX),
          position_y: Math.round(init.y + effectiveDeltaY),
        };
      });

      updateFoldersPositions(updates);
    },
    [isDragging, viewport, folders, getSnappedPosition, updateFoldersPositions]
  );

  const endGroupDrag = useCallback(
    (screenX?: number, screenY?: number) => {
      if (isDragging) {
        const { panels } = useCanvasStore.getState();
        const primaryId = primaryFolderIdRef.current;

        // Check if dropped into a Canvas Panel block
        if (primaryId && screenX !== undefined && screenY !== undefined) {
          const worldPt = screenToWorld({ x: screenX, y: screenY }, viewport);
          const targetPanel = panels.find((p) => {
            const minX = p.position_x;
            const maxX = p.position_x + p.width;
            const minY = p.position_y;
            // Estimated panel height range
            const maxY = p.position_y + (p.height || 600);
            return worldPt.x >= minX && worldPt.x <= maxX && worldPt.y >= minY && worldPt.y <= maxY;
          });

          const selectedIds = Array.from(initialPositionsRef.current.keys());

          if (targetPanel) {
            // Drop inside panel
            selectedIds.forEach((id) => moveFolderToPanel(id, targetPanel.id));
          }
        }

        setIsDragging(false);
        primaryFolderIdRef.current = null;
        initialPositionsRef.current.clear();
        clearActiveGuides();
      }
    },
    [isDragging, viewport, clearActiveGuides, moveFolderToPanel]
  );

  return {
    isDragging,
    startGroupDrag,
    moveGroupDrag,
    endGroupDrag,
  };
}
