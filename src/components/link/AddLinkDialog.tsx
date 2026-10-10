import React, { useState } from 'react';
import { X, Globe, Sparkles, Loader2 } from 'lucide-react';
import { useLinkMetadata } from '../../hooks/useLinkMetadata';
import { LinkFavicon } from './LinkFavicon';
import { normalizeUrl } from '../../lib/urlHelper';

interface AddLinkDialogProps {
  isOpen: boolean;
  folderTitle: string;
  onClose: () => void;
  onSubmit: (title: string, url: string, iconUrl?: string | null) => Promise<void>;
}

export const AddLinkDialog: React.FC<AddLinkDialogProps> = ({
  isOpen,
  folderTitle,
  onClose,
  onSubmit,
}) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isLoading: isFetching, fetchMetadata } = useLinkMetadata();

  if (!isOpen) return null;

  const handleUrlBlur = async () => {
    if (!url.trim()) return;
    const cleanUrl = normalizeUrl(url);
    setUrl(cleanUrl);

    // If title is empty or matching previous domain, fetch metadata
    const result = await fetchMetadata(cleanUrl);
    if (!title.trim() || title === url) {
      setTitle(result.title);
    }
    if (!iconUrl.trim()) {
      setIconUrl(result.iconUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    const normalized = normalizeUrl(url);
    const finalTitle = title.trim() || normalized;
    setIsSubmitting(true);
    try {
      await onSubmit(finalTitle, normalized, iconUrl.trim() || null);
      setUrl('');
      setTitle('');
      setIconUrl('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="font-semibold text-base text-slate-100 flex items-center gap-2">
              <Globe className="w-4 h-4 text-sky-400" />
              添加网站链接
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">添加到「{folderTitle}」</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* URL Input with fetch button */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">网站网址 (URL) *</label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="例如 github.com 或 https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={handleUrlBlur}
                autoFocus
                className="w-full px-3 py-2 pr-10 text-sm bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-slate-100 placeholder-slate-500"
              />
              <button
                type="button"
                onClick={handleUrlBlur}
                disabled={isFetching || !url.trim()}
                title="自动抓取站点标题与 Favicon"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-sky-400 disabled:opacity-40 transition-colors"
              >
                {isFetching ? (
                  <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">网站名称 / 标题</label>
            <input
              type="text"
              placeholder="留空将自动根据网址或抓取结果填充"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-slate-100 placeholder-slate-500"
            />
          </div>

          {/* Icon URL Input */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">图标 URL (可选)</label>
            <input
              type="text"
              placeholder="可选自定义图标地址，留空将自动抓取或使用首字母占位"
              value={iconUrl}
              onChange={(e) => setIconUrl(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-slate-100 placeholder-slate-500"
            />
          </div>

          {/* Live Preview Card */}
          {(url.trim() || title.trim()) && (
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center gap-3">
              <LinkFavicon iconUrl={iconUrl || null} title={title || url} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-200 truncate">{title || '未命名站点'}</p>
                <p className="text-[10px] text-slate-500 truncate font-mono">{url || 'http://...'}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
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
              disabled={isSubmitting || !url.trim()}
              className="px-4 py-2 text-xs font-medium bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold rounded-xl disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-md"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>确认添加</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
