import React from 'react';
import { DragOverlay } from '@dnd-kit/core';
import { LinkItem } from '../../types/database';
import { LinkFavicon } from '../link/LinkFavicon';

interface DragOverlayItemProps {
  activeLink: LinkItem | null;
}

export const DragOverlayItem: React.FC<DragOverlayItemProps> = ({ activeLink }) => {
  if (!activeLink) return null;

  return (
    <DragOverlay dropAnimation={null}>
      <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-slate-900/90 border border-sky-400 shadow-2xl shadow-sky-500/40 text-slate-100 select-none scale-110 rotate-2 pointer-events-none w-[76px] backdrop-blur-md">
        <LinkFavicon iconUrl={activeLink.icon_url} title={activeLink.title} size="md" />
        <span className="mt-1.5 text-[11px] font-semibold text-white text-center truncate max-w-[68px]">
          {activeLink.title}
        </span>
      </div>
    </DragOverlay>
  );
};
