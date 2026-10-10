import React, { useRef, useCallback } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useCanvasTransform } from '../../hooks/useCanvasTransform';
import { useMarqueeSelect } from '../../hooks/useMarqueeSelect';
import { useGroupDrag } from '../../hooks/useGroupDrag';
import { CanvasBackground } from './CanvasBackground';
import { AlignmentGuides } from './AlignmentGuides';
import { MarqueeSelection } from './MarqueeSelection';
import { CanvasContextMenu } from './CanvasContextMenu';
import { CanvasToolbar } from './CanvasToolbar';
import { FolderCard } from '../folder/FolderCard';
import { CanvasDndContext } from '../dnd/CanvasDndContext';
import { screenToWorld } from '../../lib/canvasMath';

export const Canvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    folders,
    links,
    viewport,
    selectedFolderIds,
    setContextMenu,
    closeContextMenu,
    clearSelection,
  } = useCanvasStore();

  const {
    isSpacePressed,
    isPanning,
    startPan,
    movePan,
    endPan,
    zoomIn,
    zoomOut,
    resetView,
  } = useCanvasTransform({ containerRef });

  const {
    marqueeBox,
    isMarqueeSelecting,
    startMarquee,
    updateMarquee,
    endMarquee,
  } = useMarqueeSelect();

  const {
    isDragging: isGroupDragging,
    startGroupDrag,
    moveGroupDrag,
    endGroupDrag,
  } = useGroupDrag();

  // Pointer Down on canvas
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      closeContextMenu();

      // Right Click (button = 2) -> Open context menu
      if (e.button === 2) {
        e.preventDefault();
        const worldPt = screenToWorld({ x: e.clientX, y: e.clientY }, viewport);
        setContextMenu({
          isOpen: true,
          screenX: e.clientX,
          screenY: e.clientY,
          worldX: Math.round(worldPt.x),
          worldY: Math.round(worldPt.y),
        });
        return;
      }

      // Middle click (button = 1) OR Spacebar held -> Start panning
      if (e.button === 1 || isSpacePressed) {
        e.preventDefault();
        startPan(e.clientX, e.clientY);
        return;
      }

      // Left click (button = 0) on canvas background -> Marquee selection
      if (e.button === 0) {
        // If clicked on an empty area of the canvas (not on a folder card)
        const target = e.target as HTMLElement;
        const isCanvasBackground = target === containerRef.current || target.closest('.canvas-world-layer');
        const isCard = target.closest('[data-folder-card="true"]');

        if (!isCard) {
          startMarquee(e.clientX, e.clientY, e.shiftKey);
        }
      }
    },
    [closeContextMenu, isSpacePressed, startPan, startMarquee, viewport, setContextMenu]
  );

  // Pointer Move on canvas
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isPanning) {
        movePan(e.clientX, e.clientY);
      } else if (isGroupDragging) {
        moveGroupDrag(e.clientX, e.clientY);
      } else if (isMarqueeSelecting) {
        updateMarquee(e.clientX, e.clientY);
      }
    },
    [isPanning, isGroupDragging, isMarqueeSelecting, movePan, moveGroupDrag, updateMarquee]
  );

  // Pointer Up / Cancel
  const handlePointerUp = useCallback(() => {
    if (isPanning) endPan();
    if (isGroupDragging) endGroupDrag();
    if (isMarqueeSelecting) endMarquee();
  }, [isPanning, isGroupDragging, isMarqueeSelecting, endPan, endGroupDrag, endMarquee]);

  // Prevent default context menu so our custom context menu takes effect
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const cursorClass = isPanning
    ? 'cursor-grabbing'
    : isSpacePressed
    ? 'cursor-grab'
    : isGroupDragging
    ? 'cursor-move'
    : 'cursor-default';

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onContextMenu={handleContextMenu}
      className={`relative w-full h-full overflow-hidden bg-slate-950 ${cursorClass}`}
    >
      {/* Background Dot Grid */}
      <CanvasBackground viewport={viewport} />

      {/* DND Context Wrapping World Layer */}
      <CanvasDndContext>
        {/* World Layer (Transformed with zoom & pan) */}
        <div
          className="canvas-world-layer absolute inset-0 origin-top-left pointer-events-auto"
          style={{
            transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.zoom})`,
          }}
        >
          {folders.map((folder) => {
            const folderLinks = links.filter((l) => l.folder_id === folder.id);
            const isSelected = selectedFolderIds.includes(folder.id);

            return (
              <div key={folder.id} data-folder-card="true">
                <FolderCard
                  folder={folder}
                  links={folderLinks}
                  isSelected={isSelected}
                  onStartGroupDrag={startGroupDrag}
                />
              </div>
            );
          })}
        </div>
      </CanvasDndContext>

      {/* Overlays in Screen Coordinate Space */}
      <AlignmentGuides />
      <MarqueeSelection marqueeBox={marqueeBox} />
      <CanvasContextMenu />

      {/* Floating Toolbar */}
      <CanvasToolbar
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetView={resetView}
      />
    </div>
  );
};
