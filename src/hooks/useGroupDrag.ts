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
        // Toggle in selection
        if (activeSelection.includes(folderId)) {
          activeSelection = activeSelection.filter((id) => id !== folderId);
        } else {
          activeSelection = [...activeSelection, folderId];
        }
        setSelectedFolderIds(activeSelection);
      } else if (!activeSelection.includes(folderId)) {
        // Not previously selected, replace selection with just this folder
        activeSelection = [folderId];
        setSelectedFolderIds(activeSelection);
      }

      if (activeSelection.length === 0) return;

      const worldPt = screenToWorld({ x: screenX, y: screenY }, viewport);
      dragStartWorldRef.current = worldPt;
      primaryFolderIdRef.current = folderId;

      // Cache initial positions of all selected folders
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

      // Snap primary folder against all non-selected folders
      const selectedIds = Array.from(initialPositionsRef.current.keys());
      const snapped = getSnappedPosition(
        primaryId,
        proposedPrimaryX,
        proposedPrimaryY,
        primaryWidth,
        primaryHeight,
        selectedIds
      );

      // The effective delta applied to all selected items
      const effectiveDeltaX = snapped.x - primaryInitPos.x;
      const effectiveDeltaY = snapped.y - primaryInitPos.y;

      // Update positions of all selected folders
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

  const endGroupDrag = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      primaryFolderIdRef.current = null;
      initialPositionsRef.current.clear();
      clearActiveGuides();
    }
  }, [isDragging, clearActiveGuides]);

  return {
    isDragging,
    startGroupDrag,
    moveGroupDrag,
    endGroupDrag,
  };
}
