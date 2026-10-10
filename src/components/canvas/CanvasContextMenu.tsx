import React, { useEffect, useRef } from 'react';
import { FolderPlus, RotateCcw, Magnet, Inbox } from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';

export const CanvasContextMenu: React.FC = () => {
  const {
    contextMenu,
    closeContextMenu,
    createFolder,
    setViewport,
    gridSnapping,
    setGridSnapping,
    toggleDockPanel,
    isDockPanelOpen,
  } = useCanvasStore();

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    };
    if (contextMenu.isOpen) {
      window.addEventListener('pointerdown', handleClickOutside);
    }
    return () => window.removeEventListener('pointerdown', handleClickOutside);
  }, [contextMenu.isOpen, closeContextMenu]);

  if (!contextMenu.isOpen) return null;

  const handleCreateFolder = async () => {
    closeContextMenu();
    await createFolder(contextMenu.worldX, contextMenu.worldY);
  };

  const handleResetView = () => {
    closeContextMenu();
    setViewport({ x: 0, y: 0, zoom: 1.0 });
  };

  const handleToggleGrid = () => {
    closeContextMenu();
    setGridSnapping(!gridSnapping);
  };

  const handleToggleDock = () => {
    closeContextMenu();
    toggleDockPanel();
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[200px] bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-1.5 text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-100 select-none"
      style={{
        left: `${contextMenu.screenX}px`,
        top: `${contextMenu.screenY}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Primary Action: Create Folder */}
      <button
        onClick={handleCreateFolder}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 hover:text-white transition-colors text-left font-medium group"
      >
        <div className="flex items-center gap-2">
          <FolderPlus className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
          <span>新建文件夹</span>
        </div>
        <span className="text-[10px] text-sky-400/60 font-mono">在此处</span>
      </button>

      <div className="h-px bg-slate-800 my-1" />

      {/* Toggle Dock Panel */}
      <button
        onClick={handleToggleDock}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-800/80 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Inbox className="w-4 h-4 text-indigo-400" />
          <span>侧边收纳面板</span>
        </div>
        <span className="text-[10px] text-slate-500">
          {isDockPanelOpen ? '已展开' : '已收起'}
        </span>
      </button>

      {/* Toggle Grid Snap */}
      <button
        onClick={handleToggleGrid}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-800/80 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Magnet className="w-4 h-4 text-amber-400" />
          <span>网格自动吸附</span>
        </div>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
            gridSnapping ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
          }`}
        >
          {gridSnapping ? '已开启' : '已关闭'}
        </span>
      </button>

      {/* Reset View */}
      <button
        onClick={handleResetView}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-800/80 transition-colors text-left text-slate-400 hover:text-slate-200"
      >
        <RotateCcw className="w-4 h-4" />
        <span>重置画布视角 (100%)</span>
      </button>
    </div>
  );
};
