import React from 'react';
import { Cloud, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';

export const SyncStatusBadge: React.FC = () => {
  const { hasUnsavedChanges, isUploading, lastSavedTime, uploadToSupabase } = useCanvasStore();

  if (isUploading) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-950/60 border border-sky-600/30 text-sky-300 text-xs shadow-sm">
        <RefreshCw className="w-3 h-3 animate-spin" />
        <span>上传保存中...</span>
      </div>
    );
  }

  if (hasUnsavedChanges) {
    return (
      <button
        onClick={() => uploadToSupabase()}
        title="有未上传的修改，点击上传至 Supabase (web_nav)"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-600/40 text-amber-300 hover:text-amber-200 text-xs shadow-sm transition-colors"
      >
        <Cloud className="w-3 h-3 text-amber-400" />
        <span>未上传更改 (点击上传)</span>
      </button>
    );
  }

  return (
    <div
      title="所有更改已上传保存到 Supabase (web_nav)"
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/60 border border-slate-700/50 text-slate-400 text-xs shadow-sm"
    >
      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
      <span>已上传 {lastSavedTime ? `(${lastSavedTime})` : ''}</span>
    </div>
  );
};
