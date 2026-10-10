import React, { useEffect, useRef } from 'react';
import { Plus, Trash2, Pencil, FolderInput, FolderOutput } from 'lucide-react';
import { Folder } from '../../types/database';

interface FolderContextMenuProps {
  isOpen: boolean;
  folder: Folder;
  position?: { x: number; y: number };
  onClose: () => void;
  onRename: () => void;
  onAddLink: () => void;
  onDelete: () => void;
  onTogglePanel?: () => void;
}

export const FolderContextMenu: React.FC<FolderContextMenuProps> = ({
  isOpen,
  folder,
  onClose,
  onRename,
  onAddLink,
  onDelete,
  onTogglePanel,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: PointerEvent | MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Small delay so opening click doesn't trigger outside click immediately
    const timer = setTimeout(() => {
      window.addEventListener('pointerdown', handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-1.5 z-50 min-w-[155px] bg-slate-900/95 backdrop-blur-xl border border-slate-700/90 rounded-xl shadow-2xl p-1 text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-100 select-none"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* 1. 添加图标 (Figure 1: 添加图标) */}
      <button
        type="button"
        onClick={() => {
          onClose();
          onAddLink();
        }}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-left font-medium text-slate-100 hover:text-sky-300 transition-colors"
      >
        <Plus className="w-4 h-4 text-sky-400" />
        <span>添加图标</span>
      </button>

      {/* 2. 移出面板 / 收纳到面板 (if applicable) */}
      {onTogglePanel && (
        <button
          type="button"
          onClick={() => {
            onClose();
            onTogglePanel();
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-left text-slate-300 hover:text-white transition-colors"
        >
          {folder.panel_id ? (
            <>
              <FolderOutput className="w-4 h-4 text-indigo-400" />
              <span>移出面板</span>
            </>
          ) : (
            <>
              <FolderInput className="w-4 h-4 text-indigo-400" />
              <span>收纳到面板</span>
            </>
          )}
        </button>
      )}

      {/* 3. 重命名 */}
      <button
        type="button"
        onClick={() => {
          onClose();
          onRename();
        }}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-left text-slate-400 hover:text-slate-200 transition-colors"
      >
        <Pencil className="w-3.5 h-3.5" />
        <span>重命名</span>
      </button>

      <div className="h-px bg-slate-800 my-1" />

      {/* 4. 删除 (Figure 1: 删除) */}
      <button
        type="button"
        onClick={() => {
          onClose();
          onDelete();
        }}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 text-left font-medium transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        <span>删除</span>
      </button>
    </div>
  );
};
