import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Folder, LinkItem } from '../../types/database';
import { FolderHeader } from './FolderHeader';
import { FolderContextMenu } from './FolderContextMenu';
import { LinkItemCard } from '../link/LinkItemCard';
import { AddLinkDialog } from '../link/AddLinkDialog';
import { EditLinkDialog } from '../link/EditLinkDialog';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useCanvasStore } from '../../store/canvasStore';

interface FolderCardProps {
  folder: Folder;
  links: LinkItem[];
  isSelected?: boolean;
  inDock?: boolean;
  onStartGroupDrag?: (folderId: string, screenX: number, screenY: number, isShift: boolean) => void;
}

export const FolderCard: React.FC<FolderCardProps> = ({
  folder,
  links,
  isSelected = false,
  inDock = false,
  onStartGroupDrag,
}) => {
  const {
    updateFolder,
    deleteFolder,
    createLink,
    updateLink,
    deleteLink,
    dockFolder,
    activeTargetFolderId,
  } = useCanvasStore();

  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Folder context menu state
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);

  // DND Droppable registration for this folder container
  const { setNodeRef, isOver } = useDroppable({
    id: `folder-${folder.id}`,
    data: {
      type: 'Folder',
      folder,
    },
  });

  const isDropTargetActive = isOver || activeTargetFolderId === folder.id;
  const sortedLinks = [...links].sort((a, b) => a.order_index - b.order_index);

  // Only the Header drag handle triggers folder group dragging!
  const handleHeaderPointerDown = (e: React.PointerEvent) => {
    if (inDock || !onStartGroupDrag) return;
    if (e.button !== 0) return;

    e.stopPropagation();
    onStartGroupDrag(folder.id, e.clientX, e.clientY, e.shiftKey);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  const folderWidth = folder.width || 340;
  // If width is >= 340, 4 columns; otherwise 3 columns
  const gridColsClass = folderWidth >= 330 ? 'grid-cols-4' : 'grid-cols-3';

  return (
    <>
      <div
        ref={setNodeRef}
        onContextMenu={handleContextMenu}
        style={
          inDock
            ? undefined
            : {
                transform: `translate3d(${folder.position_x}px, ${folder.position_y}px, 0)`,
                width: `${folderWidth}px`,
              }
        }
        className={`rounded-3xl bg-slate-900/80 backdrop-blur-2xl border transition-all duration-150 select-none ${
          inDock
            ? 'w-full mb-3.5 break-inside-avoid border-slate-700/60 hover:border-slate-600/80 shadow-lg shadow-black/20'
            : `absolute top-0 left-0 ${
                isSelected
                  ? 'ring-2 ring-sky-400 border-sky-400/90 shadow-2xl shadow-sky-500/25 z-10'
                  : isDropTargetActive
                  ? 'ring-2 ring-blue-500 border-blue-400 bg-slate-900/95 shadow-xl shadow-blue-500/25 z-10'
                  : 'border-slate-700/60 hover:border-slate-600/80 shadow-2xl shadow-black/40 z-0'
              }`
        }`}
      >
        {/* Header - only this bar can initiate folder dragging */}
        <FolderHeader
          folder={folder}
          linkCount={sortedLinks.length}
          isDocked={inDock}
          onUpdateTitle={(newTitle) => updateFolder(folder.id, { title: newTitle })}
          onOpenMenu={(e) => {
            e.stopPropagation();
            setContextMenuPos({ x: e.clientX, y: e.clientY });
          }}
          onToggleDock={() => dockFolder(folder.id, !folder.is_docked)}
          dragHandleProps={{
            onPointerDown: handleHeaderPointerDown,
          }}
        />

        {/* iOS-Style App Icons Grid Container */}
        <div className="p-3">
          <SortableContext
            items={sortedLinks.map((l) => l.id)}
            strategy={rectSortingStrategy}
          >
            <div className={`grid ${gridColsClass} gap-2.5 justify-items-center min-h-[74px]`}>
              {sortedLinks.map((link) => (
                <LinkItemCard
                  key={link.id}
                  link={link}
                  onEdit={(item) => setEditingLink(item)}
                  onDelete={(id) => deleteLink(id)}
                />
              ))}

              {/* Quick Add Link Icon within Grid */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAddLinkOpen(true);
                }}
                title="添加新网址"
                className="flex flex-col items-center justify-start p-1.5 rounded-2xl group hover:bg-slate-800/40 transition-colors w-[68px] cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl border border-dashed border-slate-700 hover:border-sky-400/70 hover:bg-sky-500/10 flex items-center justify-center text-slate-500 hover:text-sky-300 transition-all shadow-sm">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="mt-1.5 text-[11px] text-slate-500 group-hover:text-sky-300 font-medium transition-colors">
                  添加
                </span>
              </button>
            </div>
          </SortableContext>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenuPos && (
        <FolderContextMenu
          isOpen={!!contextMenuPos}
          folder={folder}
          position={contextMenuPos}
          onClose={() => setContextMenuPos(null)}
          onRename={() => {
            const newTitle = prompt('重命名文件夹', folder.title);
            if (newTitle && newTitle.trim()) {
              updateFolder(folder.id, { title: newTitle.trim() });
            }
          }}
          onAddLink={() => setIsAddLinkOpen(true)}
          onChangeColor={(color) => updateFolder(folder.id, { color })}
          onDelete={() => setIsDeleteConfirmOpen(true)}
          onToggleDock={() => dockFolder(folder.id, !folder.is_docked)}
        />
      )}

      {/* Add Link Dialog */}
      <AddLinkDialog
        isOpen={isAddLinkOpen}
        folderTitle={folder.title}
        onClose={() => setIsAddLinkOpen(false)}
        onSubmit={async (title, url, iconUrl) => {
          await createLink(folder.id, title, url, iconUrl);
        }}
      />

      {/* Edit Link Dialog */}
      <EditLinkDialog
        isOpen={!!editingLink}
        link={editingLink}
        onClose={() => setEditingLink(null)}
        onSubmit={(id, updates) => updateLink(id, updates)}
      />

      {/* Delete Folder Confirm */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title={`删除文件夹「${folder.title}」？`}
        description={`确定要删除该文件夹吗？文件夹内的 ${sortedLinks.length} 个链接项也将一并删除。`}
        confirmText="确认删除"
        onConfirm={() => {
          deleteFolder(folder.id);
          setIsDeleteConfirmOpen(false);
        }}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />
    </>
  );
};
