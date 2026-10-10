import React from 'react';
import { Compass, Plus, HelpCircle } from 'lucide-react';
import { SyncStatusBadge } from './SyncStatusBadge';
import { UserProfileMenu } from '../auth/UserProfileMenu';
import { useCanvasStore } from '../../store/canvasStore';
import { screenToWorld } from '../../lib/canvasMath';

export const Header: React.FC = () => {
  const { viewport, createFolder } = useCanvasStore();

  const handleQuickAddFolder = async () => {
    // Create folder near the center of the current screen
    const screenCenter = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };
    const worldCenter = screenToWorld(screenCenter, viewport);
    await createFolder(worldCenter.x - 170, worldCenter.y - 120);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 px-4 flex items-center justify-between pointer-events-none select-none">
      {/* Left: Brand */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-700/70 shadow-lg">
          <div className="w-6 h-6 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
            <Compass className="w-4 h-4 animate-spin-slow" />
          </div>
          <span className="font-bold text-sm bg-gradient-to-r from-sky-400 to-indigo-300 bg-clip-text text-transparent">
            Canvas Nav
          </span>
          <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-800/80 hidden sm:inline font-mono">
            无限画布导航
          </span>
        </div>

        {/* Quick Add Folder Button */}
        <button
          onClick={handleQuickAddFolder}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs shadow-md shadow-sky-500/20 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>新建文件夹</span>
        </button>
      </div>

      {/* Right: Actions, Sync Badge, Auth & Github */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Help tip */}
        <div
          title="操作指南:&#10;• 按住空格键或鼠标中键: 自由平移画布&#10;• 鼠标滚轮: 以光标为原点缩放&#10;• 空白处拖拽: 框选多个文件夹成组移动&#10;• 拖动文件夹: 自动吸附并显示高亮对齐线&#10;• 拖动链接: 支持块内排序与跨块移动"
          className="p-2 rounded-full bg-slate-900/85 backdrop-blur-md border border-slate-700/60 text-slate-400 hover:text-slate-200 cursor-help transition-colors shadow-sm hidden md:flex items-center"
        >
          <HelpCircle className="w-4 h-4" />
        </div>

        {/* Sync Status Badge */}
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-full shadow-sm p-0.5">
          <SyncStatusBadge />
        </div>

        {/* User Auth Profile Menu */}
        <UserProfileMenu />

        {/* GitHub link */}
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          title="查看 GitHub 仓库"
          className="p-2 rounded-full bg-slate-900/85 backdrop-blur-md border border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
        </a>
      </div>
    </header>
  );
};
