import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useCanvasStore } from '../store/canvasStore';
import { Folder, LinkItem, CanvasSettings } from '../types/database';

export function useRealtimeSync() {
  const { user, isGuest } = useAuthStore();
  const { loadCanvasData } = useCanvasStore();

  useEffect(() => {
    // Only subscribe to realtime if authenticated user exists
    if (!user || isGuest) return;

    const channel = supabase
      .channel(`canvas_realtime_${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'folders', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const { folders } = useCanvasStore.getState();
          if (payload.eventType === 'INSERT') {
            const newFolder = payload.new as Folder;
            if (!folders.some((f) => f.id === newFolder.id)) {
              useCanvasStore.setState({ folders: [...folders, newFolder] });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Folder;
            useCanvasStore.setState({
              folders: folders.map((f) => (f.id === updated.id ? updated : f)),
            });
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as { id: string };
            useCanvasStore.setState({
              folders: folders.filter((f) => f.id !== deleted.id),
              links: useCanvasStore.getState().links.filter((l) => l.folder_id !== deleted.id),
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'links', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const { links } = useCanvasStore.getState();
          if (payload.eventType === 'INSERT') {
            const newLink = payload.new as LinkItem;
            if (!links.some((l) => l.id === newLink.id)) {
              useCanvasStore.setState({ links: [...links, newLink] });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as LinkItem;
            useCanvasStore.setState({
              links: links.map((l) => (l.id === updated.id ? updated : l)),
            });
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as { id: string };
            useCanvasStore.setState({
              links: links.filter((l) => l.id !== deleted.id),
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'canvas_settings', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const settings = payload.new as CanvasSettings;
          if (settings) {
            useCanvasStore.setState({
              viewport: { x: settings.viewport_x, y: settings.viewport_y, zoom: settings.zoom },
              gridSnapping: settings.grid_snapping,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isGuest, loadCanvasData]);
}
