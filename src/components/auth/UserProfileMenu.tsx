import React, { useState, useRef, useEffect } from 'react';
import { User, LogIn, LogOut, Shield } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCanvasStore } from '../../store/canvasStore';

export const UserProfileMenu: React.FC = () => {
  const { user, isGuest, setAuthModalOpen, signOut } = useAuthStore();
  const { loadCanvasData } = useCanvasStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('pointerdown', handleClickOutside);
    }
    return () => window.removeEventListener('pointerdown', handleClickOutside);
  }, [isOpen]);

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
    await loadCanvasData();
  };

  const displayName = user?.email ? user.email.split('@')[0] : '访客';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 pr-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 text-slate-200 text-xs transition-colors shadow-sm"
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white text-[11px] shadow-sm">
          {displayName[0]?.toUpperCase() || 'U'}
        </div>
        <span className="max-w-[100px] truncate text-slate-300 font-medium">
          {isGuest ? '访客' : displayName}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-2 text-xs text-slate-200 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-2 border-b border-slate-800">
            <p className="font-semibold text-slate-100 truncate">{user?.email || '当前为访客体验模式'}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span>{isGuest ? '数据已保存在当前浏览器' : '已连接 Supabase 云端同步'}</span>
            </p>
          </div>

          <div className="p-1">
            {isGuest ? (
              <button
                onClick={() => {
                  setIsOpen(false);
                  setAuthModalOpen(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-sky-500/20 text-sky-400 font-medium transition-colors text-left"
              >
                <LogIn className="w-4 h-4" />
                <span>登录 / 注册云端账号</span>
              </button>
            ) : (
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-500/20 text-red-400 transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>退出登录</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
