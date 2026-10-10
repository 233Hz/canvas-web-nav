import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
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
  isSelected: boolean;
  onStartGroupDrag: (folderId: string, screenX: number, screenY: number, isShift: boolean) => void;
}

export const FolderCard: React.FC<FolderCardProps> = ({
  folder,
  links,
  isSelected,
  onStartGroupDrag,
}) => {
  const {
    updateFolder,
    deleteFolder,
    createLink,
    updateLink,
    deleteLink,
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

  const handlePointerDown = (e: React.PointerEvent) => {
    // Left click only
    if (e.button !== 0) return;
    // Don't trigger group drag if interacting with buttons, inputs, links
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('a')) {
      return;
    }

    e.stopPropagation();
    onStartGroupDrag(folder.id, e.clientX, e.clientY, e.shiftKey);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <>
      <div
        ref={setNodeRef}
        onPointerDown={handlePointerDown}
        onContextMenu={handleContextMenu}
        style={{
          transform: `translate3d(${folder.position_x}px, ${folder.position_y}px, 0)`,
          width: `${folder.width || 340}px`,
        }}
        className={`absolute top-0 left-0 rounded-2xl bg-slate-900/90 backdrop-blur-md border transition-shadow duration-150 select-none ${
          isSelected
            ? 'ring-2 ring-sky-400 border-sky-400/80 shadow-2xl shadow-sky-500/20 z-10'
            : isDropTargetActive
            ? 'ring-2 ring-blue-500 border-blue-400 bg-slate-900/95 shadow-xl shadow-blue-500/20 z-10'
            : 'border-slate-700/80 hover:border-slate-600/90 shadow-xl shadow-black/40 z-0'
        }`}
      >
        {/* Header */}
        <FolderHeader
          folder={folder}
          linkCount={sortedLinks.length}
          onUpdateTitle={(newTitle) => updateFolder(folder.id, { title: newTitle })}
          onOpenMenu={(e) => {
            e.stopPropagation();
            setContextMenuPos({ x: e.clientX, y: e.clientY });
          }}
        />

        {/* Links Sortable Container */}
        <div className="p-2 space-y-1.5 min-h-[56px]">
          <SortableContext
            items={sortedLinks.map((l) => l.id)}
            strategy={verticalListSortingStrategy}
          >
            {sortedLinks.map((link) => (
              <LinkItemCard
                key={link.id}
                link={link}
                onEdit={(item) => setEditingLink(item)}
                onDelete={(id) => deleteLink(id)}
              />
            ))}
          </SortableContext>

          {sortedLinks.length === 0 && (
            <div className="py-5 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
              暂无链接，可拖入或点击下方添加
            </div>
          )}
        </div>

        {/* Quick Add Link Footer Button */}
        <div className="px-2 pb-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsAddLinkOpen(true);
            }}
            className="w-full py-1.5 px-3 rounded-xl border border-dashed border-slate-700/60 hover:border-sky-500/50 hover:bg-sky-500/10 text-slate-400 hover:text-sky-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-all duration-150"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>添加链接</span>
          </button>
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
