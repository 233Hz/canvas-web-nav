import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Pencil, X } from 'lucide-react';
import { LinkItem } from '../../types/database';
import { LinkFavicon } from './LinkFavicon';

interface LinkItemCardProps {
  link: LinkItem;
  onEdit: (link: LinkItem) => void;
  onDelete: (id: string) => void;
}

export const LinkItemCard: React.FC<LinkItemCardProps> = ({ link, onEdit, onDelete }) => {
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

  const handleClick = (e: React.MouseEvent) => {
    // Prevent opening link if dragging or clicking buttons
    if (isDragging) return;
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      onPointerDown={(e) => {
        // Crucial: Stop propagation to prevent outer folder from starting group drag!
        e.stopPropagation();
      }}
      className={`group relative flex flex-col items-center justify-start p-1.5 rounded-2xl cursor-grab active:cursor-grabbing hover:bg-slate-800/40 transition-all select-none w-[68px] shrink-0 ${
        isDragging
          ? 'opacity-25 scale-90 border-2 border-dashed border-sky-400 rounded-2xl'
          : 'hover:-translate-y-0.5'
      }`}
    >
      {/* iOS App Icon container */}
      <div className="relative flex items-center justify-center">
        <LinkFavicon iconUrl={link.icon_url} title={link.title} size="md" />

        {/* Action badges (Edit & Delete) appearing on hover */}
        <div
          className="absolute -top-1.5 -right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-20"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onEdit(link);
            }}
            title="修改"
            className="p-1 rounded-full bg-slate-900 border border-slate-600 text-sky-400 hover:text-white shadow-lg hover:scale-110 transition-transform"
          >
            <Pencil className="w-2.5 h-2.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDelete(link.id);
            }}
            title="删除"
            className="p-1 rounded-full bg-rose-600 border border-rose-400 text-white shadow-lg hover:scale-110 transition-transform"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {/* iOS App Title underneath */}
      <span
        className="mt-1.5 text-[11px] font-medium text-slate-300 text-center truncate max-w-[64px] leading-tight group-hover:text-white transition-colors"
        title={link.title}
      >
        {link.title}
      </span>
    </div>
  );
};
