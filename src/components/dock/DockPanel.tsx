import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { PanelRightClose, PanelRightOpen, Inbox, Plus, GripVertical } from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import { FolderCard } from '../folder/FolderCard';

export const DockPanel: React.FC = () => {
  const {
    folders,
    links,
    isDockPanelOpen,
    dockPanelWidth,
    setDockPanelOpen,
    toggleDockPanel,
    setDockPanelWidth,
    createFolder,
  } = useCanvasStore();

  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(dockPanelWidth);

  // Droppable zone for docking folders
  const { setNodeRef, isOver } = useDroppable({
    id: 'dock-panel-dropzone',
    data: {
      type: 'DockPanel',
    },
  });

  const dockedFolders = folders.filter((f) => f.is_docked);

  // Resizing logic
  const handleResizeStart = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      startXRef.current = e.clientX;
      startWidthRef.current = dockPanelWidth;
    },
    [dockPanelWidth]
  );

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isResizing) return;
      // Dragging left increases width, dragging right decreases width
      const delta = startXRef.current - e.clientX;
      const nextWidth = Math.max(280, Math.min(startWidthRef.current + delta, 780));
      setDockPanelWidth(nextWidth);
    };

    const handlePointerUp = () => {
      if (isResizing) {
        setIsResizing(false);
      }
    };

    if (isResizing) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isResizing, setDockPanelWidth]);

  // Waterfall columns based on panel width
  const getColumnsClass = () => {
    if (dockPanelWidth >= 620) return 'columns-3';
    if (dockPanelWidth >= 360) return 'columns-2';
    return 'columns-1';
  };

  const handleCreateDockedFolder = async () => {
    const newFolder = await createFolder(100, 100, '收纳分类');
    useCanvasStore.getState().dockFolder(newFolder.id, true);
  };

  return (
    <>
      {/* Floating Toggle Button when closed */}
      {!isDockPanelOpen && (
        <button
          onClick={toggleDockPanel}
          title="展开抽屉收纳面板"
          className="fixed top-18 right-0 z-40 flex items-center gap-1.5 pl-3 pr-2 py-2 rounded-l-2xl bg-slate-900/90 backdrop-blur-md border-y border-l border-slate-700/80 shadow-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all select-none hover:pl-4"
        >
          <Inbox className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-medium">收纳箱</span>
          {dockedFolders.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-sky-500 text-slate-950 font-bold text-[10px] flex items-center justify-center font-mono">
              {dockedFolders.length}
            </span>
          )}
          <PanelRightOpen className="w-3.5 h-3.5 text-slate-400" />
        </button>
      )}

      {/* Dock Panel Container */}
      {isDockPanelOpen && (
        <aside
          ref={setNodeRef}
          style={{ width: `${dockPanelWidth}px` }}
          className={`fixed top-14 bottom-0 right-0 z-30 bg-slate-950/90 backdrop-blur-2xl border-l border-slate-800/90 shadow-2xl flex flex-col transition-all duration-75 select-none ${
            isOver ? 'ring-2 ring-inset ring-sky-500 bg-slate-900/95' : ''
          }`}
        >
          {/* Left Border Drag Resize Handle */}
          <div
            onPointerDown={handleResizeStart}
            title="拖拽改变面板宽度"
            className="absolute top-0 bottom-0 -left-1.5 w-3 cursor-ew-resize group flex items-center justify-center z-40 select-none hover:bg-sky-500/20 transition-colors"
          >
            <div className="w-1 h-12 rounded-full bg-slate-700 group-hover:bg-sky-400 transition-colors" />
          </div>

          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-slate-900/60 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-400">
                <Inbox className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                  <span>收纳面板</span>
                  <span className="text-[10px] text-slate-400 font-mono px-1.5 py-0.2 rounded-full bg-slate-800/80">
                    {dockedFolders.length}
                  </span>
                </h3>
                <p className="text-[10px] text-slate-500">自适应瀑布流布局 · 自由调节宽度</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleCreateDockedFolder}
                title="新建收纳分类"
                className="p-1.5 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-slate-800/80 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDockPanelOpen(false)}
                title="收起面板"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
              >
                <PanelRightClose className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Waterfall Masonry Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
            {dockedFolders.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-3xl p-6 text-center text-slate-500">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-3">
                  <Inbox className="w-6 h-6 opacity-60" />
                </div>
                <p className="text-xs font-medium text-slate-300">暂无收纳文件夹</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-[200px] leading-relaxed">
                  在画布上的文件夹菜单中点击「收纳到侧边面板」，即可放入此组件
                </p>
                <button
                  onClick={handleCreateDockedFolder}
                  className="mt-4 px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>在此新建文件夹</span>
                </button>
              </div>
            ) : (
              <div className={`${getColumnsClass()} gap-3`}>
                {dockedFolders.map((folder) => {
                  const folderLinks = links.filter((l) => l.folder_id === folder.id);
                  return (
                    <FolderCard
                      key={folder.id}
                      folder={folder}
                      links={folderLinks}
                      inDock={true}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      )}
    </>
  );
};
