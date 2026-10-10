import React, { useState } from 'react';
import { getInitialChar, getAvatarGradient } from '../../lib/urlHelper';

interface LinkFaviconProps {
  iconUrl?: string | null;
  title: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LinkFavicon: React.FC<LinkFaviconProps> = ({ iconUrl, title, size = 'md' }) => {
  const [hasError, setHasError] = useState(false);

  const initial = getInitialChar(title);
  const gradient = getAvatarGradient(title);

  const sizeClasses = {
    sm: 'w-8 h-8 rounded-xl text-xs',
    md: 'w-12 h-12 rounded-2xl text-base',
    lg: 'w-14 h-14 rounded-2xl text-lg',
  }[size];

  if (!iconUrl || hasError) {
    return (
      <div
        className={`${sizeClasses} bg-gradient-to-tr ${gradient} flex items-center justify-center font-bold text-white shadow-md shadow-black/30 border border-white/15 shrink-0 select-none transition-transform duration-200 group-hover:scale-105`}
      >
        {initial}
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses} bg-slate-800/90 p-2 flex items-center justify-center shrink-0 border border-slate-600/40 shadow-md shadow-black/30 overflow-hidden backdrop-blur-sm transition-transform duration-200 group-hover:scale-105`}
    >
      <img
        src={iconUrl}
        alt={title}
        onError={() => setHasError(true)}
        className="w-full h-full object-contain rounded-lg"
        loading="lazy"
      />
    </div>
  );
};
