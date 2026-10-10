import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { LinkItem } from '../../types/database';
import { LinkFavicon } from './LinkFavicon';
import { extractDomain } from '../../lib/urlHelper';

interface LinkItemCardProps {
  link: LinkItem;
  onEdit: (link: LinkItem) => void;
  onDelete: (id: string) => void;
}

export const LinkItemCard: React.FC<LinkItemCardProps> = ({ link, onEdit, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: link.id,
    data: {
      type: 'Link',
      link,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const domain = extractDomain(link.url);

  const handleClick = (e: React.MouseEvent) => {
    // If not dragging, open URL
    if (isDragging) {
      e.preventDefault();
      return;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative flex items-center justify-between gap-2.5 p-2 rounded-xl border transition-all duration-150 ${
        isDragging
          ? 'opacity-30 bg-slate-800/60 border-dashed border-sky-400 scale-[0.98]'
          : 'bg-slate-800/40 hover:bg-slate-800/90 border-slate-700/40 hover:border-slate-600/70 shadow-sm'
      }`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        title="拖动排序或移动到其它文件夹"
        className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-slate-500 hover:text-slate-300 transition-colors"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </div>

      {/* Main Link Body */}
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="flex items-center gap-2.5 flex-1 min-w-0"
      >
        <LinkFavicon iconUrl={link.icon_url} title={link.title} size="md" />

        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs font-medium text-slate-200 truncate group-hover:text-white transition-colors">
            {link.title}
          </span>
          <span className="text-[10px] text-slate-400 truncate flex items-center gap-1 font-mono">
            {domain}
            <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-60 transition-opacity" />
          </span>
        </div>
      </a>

      {/* Quick Action Buttons */}
      <div
        className={`flex items-center gap-1 transition-opacity ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(link);
          }}
          title="修改名称与图标"
          className="p-1 rounded-md text-slate-400 hover:text-sky-300 hover:bg-slate-700/60 transition-colors"
        >
          <Pencil className="w-3 h-3" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(link.id);
          }}
          title="删除此链接"
          className="p-1 rounded-md text-slate-400 hover:text-red-400 hover:bg-slate-700/60 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
