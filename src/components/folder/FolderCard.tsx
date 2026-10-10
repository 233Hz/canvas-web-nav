import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
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
  isInPanel?: boolean;
  onStartGroupDrag?: (folderId: string, screenX: number, screenY: number, isShift: boolean) => void;
}

export const FolderCard: React.FC<FolderCardProps> = ({
  folder,
  links,
  isSelected = false,
  isInPanel = false,
  onStartGroupDrag,
}) => {
  const {
    updateFolder,
    deleteFolder,
    createLink,
    updateLink,
    deleteLink,
    moveFolderToPanel,
    panels,
    activeTargetFolderId,
  } = useCanvasStore();

  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Folder context menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    if (isInPanel || !onStartGroupDrag) return;
    if (e.button !== 0) return;

    e.stopPropagation();
    onStartGroupDrag(folder.id, e.clientX, e.clientY, e.shiftKey);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(true);
  };

  // Figure 1 uses 5 columns layout
  const folderWidth = folder.width || 380;
  const gridColsClass = folderWidth >= 380 ? 'grid-cols-5' : folderWidth >= 310 ? 'grid-cols-4' : 'grid-cols-3';

  const handleTogglePanel = () => {
    if (folder.panel_id) {
      // Move out to free canvas
      moveFolderToPanel(folder.id, null);
    } else if (panels.length > 0) {
      // Move to first panel
      moveFolderToPanel(folder.id, panels[0].id);
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        onContextMenu={handleContextMenu}
        style={
          isInPanel
            ? undefined
            : {
                transform: `translate3d(${folder.position_x}px, ${folder.position_y}px, 0)`,
                width: `${folderWidth}px`,
              }
        }
        className={`rounded-2xl bg-slate-900/90 backdrop-blur-xl border transition-all duration-150 select-none ${
          isInPanel
            ? 'w-full mb-3.5 break-inside-avoid border-slate-700/80 shadow-lg shadow-black/20'
            : `absolute top-0 left-0 ${
                isSelected
                  ? 'ring-2 ring-sky-400 border-sky-400/90 shadow-2xl shadow-sky-500/25 z-10'
                  : isDropTargetActive
                  ? 'ring-2 ring-blue-500 border-blue-400 bg-slate-900/95 shadow-xl shadow-blue-500/25 z-10'
                  : 'border-slate-700/80 hover:border-slate-600/90 shadow-xl shadow-black/40 z-0'
              }`
        }`}
      >
        {/* Header - Left: Title, Right: Three dots ... as in Figure 1 */}
        <FolderHeader
          folder={folder}
          onUpdateTitle={(newTitle) => updateFolder(folder.id, { title: newTitle })}
          onOpenMenu={() => setIsMenuOpen(!isMenuOpen)}
          menuContent={
            isMenuOpen ? (
              <FolderContextMenu
                isOpen={isMenuOpen}
                folder={folder}
                onClose={() => setIsMenuOpen(false)}
                onAddLink={() => setIsAddLinkOpen(true)}
                onRename={() => {
                  const newTitle = prompt('重命名文件夹', folder.title);
                  if (newTitle && newTitle.trim()) {
                    updateFolder(folder.id, { title: newTitle.trim() });
                  }
                }}
                onDelete={() => setIsDeleteConfirmOpen(true)}
                onTogglePanel={panels.length > 0 || folder.panel_id ? handleTogglePanel : undefined}
              />
            ) : null
          }
          dragHandleProps={{
            onPointerDown: handleHeaderPointerDown,
          }}
        />

        {/* Clean App Icons Grid matching Figure 1 (No inline plus button) */}
        <div className="p-3">
          <SortableContext
            items={sortedLinks.map((l) => l.id)}
            strategy={rectSortingStrategy}
          >
            {sortedLinks.length === 0 ? (
              <div
                onClick={() => setIsAddLinkOpen(true)}
                className="py-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl cursor-pointer hover:border-sky-500/50 hover:text-sky-400 transition-colors"
              >
                暂无图标，点击此处或右上角 ··· 添加
              </div>
            ) : (
              <div className={`grid ${gridColsClass} gap-2.5 justify-items-center min-h-[70px]`}>
                {sortedLinks.map((link) => (
                  <LinkItemCard
                    key={link.id}
                    link={link}
                    onEdit={(item) => setEditingLink(item)}
                    onDelete={(id) => deleteLink(id)}
                  />
                ))}
              </div>
            )}
          </SortableContext>
        </div>
      </div>

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
