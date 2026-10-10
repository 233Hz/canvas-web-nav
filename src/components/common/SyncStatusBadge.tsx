import React from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import { syncQueue } from '../../lib/syncQueue';

export const SyncStatusBadge: React.FC = () => {
  const { syncStatus, pendingSyncCount } = useCanvasStore();

  const handleRetry = () => {
    syncQueue.retryAll();
  };

  if (syncStatus === 'syncing') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-950/60 border border-sky-600/30 text-sky-300 text-xs shadow-sm">
        <RefreshCw className="w-3 h-3 animate-spin" />
        <span>同步中... {pendingSyncCount > 1 ? `(${pendingSyncCount})` : ''}</span>
      </div>
    );
  }

  if (syncStatus === 'offline') {
    return (
      <button
        onClick={handleRetry}
        title="网络离线，修改已在本地安全缓存，点击尝试重新同步"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-600/40 text-amber-300 hover:text-amber-200 text-xs shadow-sm transition-colors"
      >
        <CloudOff className="w-3 h-3" />
        <span>离线模式 (已本地缓存)</span>
      </button>
    );
  }

  if (syncStatus === 'error') {
    return (
      <button
        onClick={handleRetry}
        title="数据同步遇到网络波动，点击立即重试"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/60 border border-red-600/40 text-red-300 hover:text-red-200 text-xs shadow-sm transition-colors animate-pulse"
      >
        <RefreshCw className="w-3 h-3" />
        <span>同步异常 (点击重试)</span>
      </button>
    );
  }

  // Synced
  return (
    <div
      title="所有更改已实时持久化到 Supabase 云端"
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/60 border border-slate-700/50 text-slate-400 text-xs shadow-sm"
    >
      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
      <span>已同步</span>
    </div>
  );
};
