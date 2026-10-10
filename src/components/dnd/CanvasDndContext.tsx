import React from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { useCanvasStore } from '../../store/canvasStore';
import { DragOverlayItem } from './DragOverlayItem';

interface CanvasDndContextProps {
  children: React.ReactNode;
}

export const CanvasDndContext: React.FC<CanvasDndContextProps> = ({ children }) => {
  const {
    links,
    activeDragLinkId,
    setActiveDragLinkId,
    setActiveTargetFolderId,
    reorderLinksInFolder,
    moveLinkCrossFolder,
  } = useCanvasStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Avoid intercepting simple clicks
      },
    })
  );

  const activeLink = links.find((l) => l.id === activeDragLinkId) || null;

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const linkId = String(active.id);
    setActiveDragLinkId(linkId);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setActiveTargetFolderId(null);
      return;
    }

    const overId = String(over.id);
    if (overId.startsWith('folder-')) {
      setActiveTargetFolderId(overId.replace('folder-', ''));
    } else {
      const overLink = links.find((l) => l.id === overId);
      if (overLink) {
        setActiveTargetFolderId(overLink.folder_id);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragLinkId(null);
    setActiveTargetFolderId(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeLinkItem = links.find((l) => l.id === activeId);
    if (!activeLinkItem) return;

    const sourceFolderId = activeLinkItem.folder_id;

    // 1. Dropped directly over a folder container
    if (overId.startsWith('folder-')) {
      const targetFolderId = overId.replace('folder-', '');
      if (sourceFolderId !== targetFolderId) {
        moveLinkCrossFolder(activeId, targetFolderId);
      }
      return;
    }

    // 2. Dropped over another link
    const overLinkItem = links.find((l) => l.id === overId);
    if (!overLinkItem) return;

    const targetFolderId = overLinkItem.folder_id;

    if (sourceFolderId === targetFolderId) {
      // Reorder within the same folder
      reorderLinksInFolder(sourceFolderId, activeId, overId);
    } else {
      // Move to target folder at the position of overLinkItem
      const targetFolderLinks = links
        .filter((l) => l.folder_id === targetFolderId)
        .sort((a, b) => a.order_index - b.order_index);

      const targetIndex = targetFolderLinks.findIndex((l) => l.id === overId);
      moveLinkCrossFolder(activeId, targetFolderId, targetIndex >= 0 ? targetIndex : undefined);
    }
  };

  const handleDragCancel = () => {
    setActiveDragLinkId(null);
    setActiveTargetFolderId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}
      <DragOverlayItem activeLink={activeLink} />
    </DndContext>
  );
};
