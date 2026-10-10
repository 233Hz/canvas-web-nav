import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Folder } from '../../types/database';

interface FolderHeaderProps {
  folder: Folder;
  onUpdateTitle: (newTitle: string) => void;
  onOpenMenu: (e: React.MouseEvent) => void;
  menuContent?: React.ReactNode;
  dragHandleProps?: Record<string, any>;
}

export const FolderHeader: React.FC<FolderHeaderProps> = ({
  folder,
  onUpdateTitle,
  onOpenMenu,
  menuContent,
  dragHandleProps,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [titleInput, setTitleInput] = useState(folder.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitleInput(folder.title);
  }, [folder.title]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleFinishEdit = () => {
    setIsEditing(false);
    const trimmed = titleInput.trim();
    if (trimmed && trimmed !== folder.title) {
      onUpdateTitle(trimmed);
    } else {
      setTitleInput(folder.title);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFinishEdit();
    } else if (e.key === 'Escape') {
      setTitleInput(folder.title);
      setIsEditing(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/90 select-none rounded-t-2xl">
        {/* Title (Header bar acts as drag handle for folder) */}
        <div
          className="flex items-center gap-2 flex-1 min-w-0 cursor-grab active:cursor-grabbing"
          {...dragHandleProps}
        >
          <span
            className="w-2 h-2 rounded-full shrink-0 shadow-sm"
            style={{ backgroundColor: folder.color || '#3b82f6' }}
          />

          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleFinishEdit}
              onKeyDown={handleKeyDown}
              className="w-full text-xs font-semibold bg-slate-950 text-slate-100 border border-sky-500 rounded px-1.5 py-0.5 focus:outline-none"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              title="双击重命名标题"
              className="text-xs font-semibold text-slate-100 truncate hover:text-white cursor-text"
            >
              {folder.title}
            </span>
          )}
        </div>

        {/* Three dots menu button matching Figure 1 */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenMenu(e);
            }}
            title="更多操作"
            className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuContent}
        </div>
      </div>

      {/* Horizontal divider line under header matching Figure 1 */}
      <div className="h-px bg-slate-800 w-full" />
    </>
  );
};
