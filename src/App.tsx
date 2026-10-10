import React, { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { useCanvasStore } from './store/canvasStore';
import { useRealtimeSync } from './hooks/useRealtimeSync';
import { Canvas } from './components/canvas/Canvas';
import { Header } from './components/common/Header';
import { AuthModal } from './components/auth/AuthModal';
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const { initializeAuth, isLoading: isAuthLoading } = useAuthStore();
  const { loadCanvasData, isLoading: isCanvasLoading } = useCanvasStore();

  useRealtimeSync();

  useEffect(() => {
    initializeAuth().then(() => {
      loadCanvasData();
    });
  }, [initializeAuth, loadCanvasData]);

  if (isAuthLoading || isCanvasLoading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 select-none">
        <div className="relative flex items-center justify-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-400/40 animate-pulse flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
          </div>
        </div>
        <h2 className="text-sm font-semibold tracking-wide text-slate-200">
          正在载入画布工作区...
        </h2>
        <p className="text-xs text-slate-500 mt-1">从 Supabase 云端还原数据与视口状态</p>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      <Header />
      <main className="w-full h-full">
        <Canvas />
      </main>
      <AuthModal />
    </div>
  );
};

export default App;
