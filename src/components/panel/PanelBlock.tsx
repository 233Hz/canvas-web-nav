import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { MoreHorizontal, Trash2, GripHorizontal, FolderPlus } from 'lucide-react';
import { PanelBlock as PanelType, Folder, LinkItem } from '../../types/database';
import { FolderCard } from '../folder/FolderCard';
import { useCanvasStore } from '../../store/canvasStore';

interface PanelBlockProps {
  panel: PanelType;
  folders: Folder[];
  links: LinkItem[];
  onStartGroupDrag?: (folderId: string, screenX: number, screenY: number, isShift: boolean) => void;
}

export const PanelBlock: React.FC<PanelBlockProps> = ({
  panel,
  folders,
  links,
  onStartGroupDrag,
}) => {
  const { updatePanel, deletePanel, createFolder } = useCanvasStore();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(panel.title);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Resize state
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(panel.width);

  // DND Droppable zone for dropping folders into this panel
  const { setNodeRef, isOver } = useDroppable({
    id: `panel-${panel.id}`,
    data: {
      type: 'Panel',
      panel,
    },
  });

  const childFolders = folders.filter((f) => f.panel_id === panel.id);

  // Outside click for menu
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      window.addEventListener('pointerdown', handleOutside);
    }
    return () => window.removeEventListener('pointerdown', handleOutside);
  }, [isMenuOpen]);

  // Width Resize Handler (Dragging right edge)
  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = panel.width;
  };

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (!isResizing) return;
      const deltaX = e.clientX - startXRef.current;
      const zoom = useCanvasStore.getState().viewport.zoom;
      // Account for canvas zoom scale
      const worldDeltaX = deltaX / zoom;
      const nextWidth = Math.max(380, Math.min(Math.round(startWidthRef.current + worldDeltaX), 1400));
      updatePanel(panel.id, { width: nextWidth });
    };

    const handleUp = () => {
      if (isResizing) {
        setIsResizing(false);
      }
    };

    if (isResizing) {
      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
    }
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [isResizing, panel.id, updatePanel]);

  // Panel drag on canvas
  const handlePanelHeaderPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input')) return;

    // Start moving the panel block on canvas
    e.stopPropagation();
    const { viewport } = useCanvasStore.getState();
    const startX = e.clientX;
    const startY = e.clientY;
    const initX = panel.position_x;
    const initY = panel.position_y;

    const onPointerMove = (moveEvt: PointerEvent) => {
      const dx = (moveEvt.clientX - startX) / viewport.zoom;
      const dy = (moveEvt.clientY - startY) / viewport.zoom;
      updatePanel(panel.id, {
        position_x: Math.round(initX + dx),
        position_y: Math.round(initY + dy),
      });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Dynamic columns for waterfall layout based on width
  const getColumnsClass = () => {
    if (panel.width >= 860) return 'columns-3';
    if (panel.width >= 560) return 'columns-2';
    return 'columns-1';
  };

  const handleFinishTitle = () => {
    setIsEditingTitle(false);
    const trimmed = titleInput.trim();
    if (trimmed && trimmed !== panel.title) {
      updatePanel(panel.id, { title: trimmed });
    } else {
      setTitleInput(panel.title);
    }
  };

  const handleCreateChildFolder = async () => {
    await createFolder(0, 0, '新分类', '#3b82f6', panel.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: `translate3d(${panel.position_x}px, ${panel.position_y}px, 0)`,
        width: `${panel.width}px`,
      }}
      className={`absolute top-0 left-0 rounded-3xl border-2 transition-colors duration-150 select-none ${
        isOver
          ? 'border-sky-400 bg-slate-900/90 shadow-2xl shadow-sky-500/20 ring-4 ring-sky-500/20'
          : 'border-slate-700/80 bg-slate-900/60 backdrop-blur-xl shadow-2xl shadow-black/50 hover:border-slate-600/90'
      }`}
    >
      {/* Top Header of Panel Block */}
      <div
        onPointerDown={handlePanelHeaderPointerDown}
        className="flex items-center justify-between px-4 py-3 cursor-grab active:cursor-grabbing border-b border-slate-800/80 bg-slate-900/70 rounded-t-3xl"
      >
        {/* Title matching Figure 2 "面板" label */}
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-4 h-4 text-slate-500 hover:text-slate-300 transition-colors" />

          {isEditingTitle ? (
            <input
              type="text"
              autoFocus
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleFinishTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleFinishTitle();
                if (e.key === 'Escape') setIsEditingTitle(false);
              }}
              className="text-sm font-bold bg-slate-950 text-white px-2 py-0.5 rounded border border-sky-400 focus:outline-none"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditingTitle(true);
              }}
              title="双击修改面板名称"
              className="text-sm font-bold text-slate-200 hover:text-white cursor-text tracking-wide"
            >
              {panel.title}
            </span>
          )}

          <span className="text-[10px] text-slate-400 font-mono px-2 py-0.5 rounded-full bg-slate-800/80">
            {childFolders.length} 个文件夹
          </span>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-1.5" onPointerDown={(e) => e.stopPropagation()}>
          <button
            onClick={handleCreateChildFolder}
            title="在此面板内添加新文件夹"
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-medium transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>新建分类</span>
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-1 w-36 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-1 text-xs text-slate-200 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    const newTitle = prompt('重命名面板', panel.title);
                    if (newTitle && newTitle.trim()) {
                      updatePanel(panel.id, { title: newTitle.trim() });
                    }
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 rounded-lg text-slate-300"
                >
                  重命名面板
                </button>
                <div className="h-px bg-slate-800 my-1" />
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (confirm(`删除「${panel.title}」？面板内的文件夹将移出到自由画布。`)) {
                      deletePanel(panel.id);
                    }
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-red-500/20 rounded-lg text-red-400 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>删除面板</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Waterfall / Masonry Multi-Column Layout holding folders inside Figure 2 */}
      <div className="p-4 min-h-[160px]">
        {childFolders.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 text-center">
            <p className="text-xs font-medium text-slate-400">面板当前为空</p>
            <p className="text-[11px] text-slate-500 mt-1">
              可直接将画布上的文件夹拖入此处归纳，或点击右上角「新建分类」
            </p>
          </div>
        ) : (
          <div className={`${getColumnsClass()} gap-4`}>
            {childFolders.map((folder) => {
              const folderLinks = links.filter((l) => l.folder_id === folder.id);
              return (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  links={folderLinks}
                  isInPanel={true}
                  onStartGroupDrag={onStartGroupDrag}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Right Edge Draggable Resize Handle */}
      <div
        onPointerDown={handleResizePointerDown}
        title="拖动调整面板宽度"
        className="absolute top-0 bottom-0 -right-2 w-4 cursor-ew-resize group flex items-center justify-center z-30 select-none hover:bg-sky-500/20 rounded-r-3xl transition-colors"
      >
        <div className="w-1.5 h-14 rounded-full bg-slate-600 group-hover:bg-sky-400 transition-colors shadow-sm" />
      </div>
    </div>
  );
};
