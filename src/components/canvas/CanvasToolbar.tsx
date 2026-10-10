import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Magnet, X } from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';

interface CanvasToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  onZoomIn,
  onZoomOut,
  onResetView,
}) => {
  const { viewport, gridSnapping, setGridSnapping, selectedFolderIds, clearSelection } =
    useCanvasStore();

  const zoomPercent = Math.round(viewport.zoom * 100);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 select-none">
      {/* Multi-selection pill */}
      {selectedFolderIds.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-950/80 backdrop-blur-md border border-sky-600/40 rounded-full shadow-lg text-xs text-sky-200 animate-in fade-in slide-in-from-bottom-2">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
          <span>已选中 {selectedFolderIds.length} 个文件夹</span>
          <button
            onClick={clearSelection}
            title="取消选择 (Esc)"
            className="p-0.5 rounded-full hover:bg-sky-800/60 text-sky-300 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Canvas Controls */}
      <div className="flex items-center bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-xl shadow-xl p-1 text-slate-300">
        {/* Grid Snapping Toggle */}
        <button
          onClick={() => setGridSnapping(!gridSnapping)}
          title={`网格自动吸附: ${gridSnapping ? '已开启' : '已关闭'}`}
          className={`p-2 rounded-lg transition-colors ${
            gridSnapping
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
              : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Magnet className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-700 mx-1" />

        {/* Zoom Out */}
        <button
          onClick={onZoomOut}
          title="缩小 (滚轮下滑)"
          className="p-2 rounded-lg hover:bg-slate-800 hover:text-slate-100 transition-colors text-slate-400"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {/* Zoom Indicator */}
        <button
          onClick={onResetView}
          title="点击重置缩放 100%"
          className="px-2.5 py-1 text-xs font-mono font-medium hover:bg-slate-800 hover:text-slate-100 rounded-md transition-colors"
        >
          {zoomPercent}%
        </button>

        {/* Zoom In */}
        <button
          onClick={onZoomIn}
          title="放大 (滚轮上滑)"
          className="p-2 rounded-lg hover:bg-slate-800 hover:text-slate-100 transition-colors text-slate-400"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-700 mx-1" />

        {/* Reset View */}
        <button
          onClick={onResetView}
          title="重置视图坐标与缩放"
          className="p-2 rounded-lg hover:bg-slate-800 hover:text-slate-100 transition-colors text-slate-400"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
