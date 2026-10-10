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
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  }[size];

  if (!iconUrl || hasError) {
    return (
      <div
        className={`${sizeClasses} rounded-lg bg-gradient-to-tr ${gradient} flex items-center justify-center font-bold text-white shadow-sm shrink-0 select-none`}
      >
        {initial}
      </div>
    );
  }

  return (
    <div className={`${sizeClasses} rounded-lg bg-slate-800/80 p-1 flex items-center justify-center shrink-0 border border-slate-700/50 shadow-sm overflow-hidden`}>
      <img
        src={iconUrl}
        alt={title}
        onError={() => setHasError(true)}
        className="w-full h-full object-contain rounded"
        loading="lazy"
      />
    </div>
  );
};
