import React, { useEffect, useRef } from 'react';
import { Pencil, Palette, Plus, Trash2 } from 'lucide-react';
import { Folder } from '../../types/database';

interface FolderContextMenuProps {
  isOpen: boolean;
  folder: Folder;
  position: { x: number; y: number };
  onClose: () => void;
  onRename: () => void;
  onAddLink: () => void;
  onChangeColor: (color: string) => void;
  onDelete: () => void;
}

const COLOR_OPTIONS = [
  { label: '经典蓝', value: '#3b82f6' },
  { label: '典雅紫', value: '#8b5cf6' },
  { label: '薄荷绿', value: '#10b981' },
  { label: '琥珀黄', value: '#f59e0b' },
  { label: '玫瑰红', value: '#f43f5e' },
  { label: '青空蓝', value: '#06b6d4' },
  { label: '深空灰', value: '#64748b' },
];

export const FolderContextMenu: React.FC<FolderContextMenuProps> = ({
  isOpen,
  folder,
  position,
  onClose,
  onRename,
  onAddLink,
  onChangeColor,
  onDelete,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('pointerdown', handleClickOutside);
    }
    return () => window.removeEventListener('pointerdown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[200px] bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl p-1.5 text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-100"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => {
          onClose();
          onAddLink();
        }}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-left font-medium"
      >
        <Plus className="w-4 h-4 text-sky-400" />
        <span>添加网址链接</span>
      </button>

      <button
        onClick={() => {
          onClose();
          onRename();
        }}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-left"
      >
        <Pencil className="w-4 h-4 text-slate-400" />
        <span>重命名文件夹</span>
      </button>

      {/* Color Presets */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-1.5 text-slate-400 mb-1.5">
          <Palette className="w-3.5 h-3.5" />
          <span className="text-[11px]">选择标识配色</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c.value}
              onClick={() => {
                onChangeColor(c.value);
                onClose();
              }}
              title={c.label}
              className={`w-4 h-4 rounded-full transition-transform hover:scale-125 ${
                folder.color === c.value ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900' : ''
              }`}
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>
      </div>

      <div className="h-px bg-slate-800 my-1" />

      <button
        onClick={() => {
          onClose();
          onDelete();
        }}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 text-left"
      >
        <Trash2 className="w-4 h-4" />
        <span>删除文件夹块</span>
      </button>
    </div>
  );
};
