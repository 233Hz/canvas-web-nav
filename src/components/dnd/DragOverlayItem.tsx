import React from 'react';
import { DragOverlay } from '@dnd-kit/core';
import { GripVertical, ExternalLink } from 'lucide-react';
import { LinkItem } from '../../types/database';
import { LinkFavicon } from '../link/LinkFavicon';
import { extractDomain } from '../../lib/urlHelper';

interface DragOverlayItemProps {
  activeLink: LinkItem | null;
}

export const DragOverlayItem: React.FC<DragOverlayItemProps> = ({ activeLink }) => {
  if (!activeLink) return null;

  const domain = extractDomain(activeLink.url);

  return (
    <DragOverlay dropAnimation={null}>
      <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-800/95 border-2 border-sky-400 shadow-2xl shadow-sky-500/30 text-slate-100 select-none scale-105 rotate-1 min-w-[240px] pointer-events-none">
        <div className="p-1 -ml-1 text-sky-400">
          <GripVertical className="w-3.5 h-3.5" />
        </div>

        <LinkFavicon iconUrl={activeLink.icon_url} title={activeLink.title} size="md" />

        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs font-semibold text-white truncate">{activeLink.title}</span>
          <span className="text-[10px] text-slate-400 truncate flex items-center gap-1 font-mono">
            {domain}
            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
          </span>
        </div>
      </div>
    </DragOverlay>
  );
};
