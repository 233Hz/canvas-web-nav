import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, GripHorizontal, ArrowUpRight, PanelRight } from 'lucide-react';
import { Folder } from '../../types/database';

interface FolderHeaderProps {
  folder: Folder;
  linkCount: number;
  isDocked?: boolean;
  onUpdateTitle: (newTitle: string) => void;
  onOpenMenu: (e: React.MouseEvent) => void;
  onToggleDock?: () => void;
  dragHandleProps?: Record<string, any>;
}

export const FolderHeader: React.FC<FolderHeaderProps> = ({
  folder,
  linkCount,
  isDocked = false,
  onUpdateTitle,
  onOpenMenu,
  onToggleDock,
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
    <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 border-b border-white/5 bg-slate-900/70 select-none rounded-t-3xl">
      {/* Drag handle & Title */}
      <div
        className="flex items-center gap-2 flex-1 min-w-0 cursor-grab active:cursor-grabbing"
        {...dragHandleProps}
      >
        {/* Color Dot indicator */}
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm ring-1 ring-white/20"
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
          <div
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            title="双击重命名标题"
            className="flex items-center gap-1.5 min-w-0 cursor-text"
          >
            <span className="text-xs font-semibold text-slate-200 truncate hover:text-white">
              {folder.title}
            </span>
            <span className="text-[10px] text-slate-400 font-mono px-1.5 py-0.2 rounded-full bg-slate-800/80">
              {linkCount}
            </span>
          </div>
        )}
      </div>

      {/* Right controls: Dock toggle + Menu */}
      <div className="flex items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>
        {onToggleDock && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleDock();
            }}
            title={isDocked ? '移回无限画布' : '收纳到侧边面板'}
            className="p-1 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-slate-800/80 transition-colors"
          >
            {isDocked ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : (
              <PanelRight className="w-3.5 h-3.5" />
            )}
          </button>
        )}

        {!isDocked && (
          <div
            {...dragHandleProps}
            title="拖动块位置"
            className="cursor-grab active:cursor-grabbing p-1 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <GripHorizontal className="w-3.5 h-3.5" />
          </div>
        )}

        <button
          onClick={onOpenMenu}
          title="文件夹操作菜单"
          className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
