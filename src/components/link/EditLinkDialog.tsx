import React, { useState, useEffect } from 'react';
import { X, Globe, Save } from 'lucide-react';
import { LinkItem } from '../../types/database';
import { LinkFavicon } from './LinkFavicon';
import { normalizeUrl } from '../../lib/urlHelper';

interface EditLinkDialogProps {
  isOpen: boolean;
  link: LinkItem | null;
  onClose: () => void;
  onSubmit: (id: string, updates: Partial<LinkItem>) => void;
}

export const EditLinkDialog: React.FC<EditLinkDialogProps> = ({
  isOpen,
  link,
  onClose,
  onSubmit,
}) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [iconUrl, setIconUrl] = useState('');

  useEffect(() => {
    if (link) {
      setUrl(link.url);
      setTitle(link.title);
      setIconUrl(link.icon_url || '');
    }
  }, [link]);

  if (!isOpen || !link) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    onSubmit(link.id, {
      title: title.trim() || link.title,
      url: normalizeUrl(url),
      icon_url: iconUrl.trim() || null,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="font-semibold text-base text-slate-100 flex items-center gap-2">
            <Globe className="w-4 h-4 text-sky-400" />
            修改链接信息
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">网站名称</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">网站网址 (URL)</label>
            <input
              type="text"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">图标 URL (可选，留空将显示首字母图标)</label>
            <input
              type="text"
              value={iconUrl}
              placeholder="https://..."
              onChange={(e) => setIconUrl(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-slate-100"
            />
          </div>

          {/* Preview */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center gap-3">
            <LinkFavicon iconUrl={iconUrl || null} title={title || url} size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-200 truncate">{title || '未命名'}</p>
              <p className="text-[10px] text-slate-500 truncate font-mono">{url}</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl transition-colors flex items-center gap-1.5 shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>保存修改</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
