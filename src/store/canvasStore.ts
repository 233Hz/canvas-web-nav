import { create } from 'zustand';
import { Folder, LinkItem, CanvasSettings } from '../types/database';
import { Viewport, AlignmentGuide, ContextMenuState, SyncState } from '../types/canvas';
import { supabase } from '../lib/supabase';
import { syncQueue } from '../lib/syncQueue';
import { useAuthStore } from './authStore';

interface CanvasState {
  folders: Folder[];
  links: LinkItem[];
  viewport: Viewport;
  gridSnapping: boolean;
  selectedFolderIds: string[];
  activeGuides: AlignmentGuide[];
  syncStatus: SyncState;
  pendingSyncCount: number;
  activeDragLinkId: string | null;
  activeTargetFolderId: string | null;
  contextMenu: ContextMenuState;
  isLoading: boolean;

  // Viewport & Settings
  setViewport: (viewport: Viewport | ((prev: Viewport) => Viewport)) => void;
  setGridSnapping: (enabled: boolean) => void;
  saveViewportSettings: () => void;

  // Selection
  setSelectedFolderIds: (ids: string[]) => void;
  toggleFolderSelection: (id: string) => void;
  clearSelection: () => void;

  // Guides
  setActiveGuides: (guides: AlignmentGuide[]) => void;
  clearActiveGuides: () => void;

  // Context Menu
  setContextMenu: (state: ContextMenuState) => void;
  closeContextMenu: () => void;

  // Link DnD state
  setActiveDragLinkId: (id: string | null) => void;
  setActiveTargetFolderId: (id: string | null) => void;

  // Data Actions
  loadCanvasData: () => Promise<void>;
  createFolder: (position_x: number, position_y: number, title?: string, color?: string) => Promise<Folder>;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  updateFoldersPositions: (updates: { id: string; position_x: number; position_y: number }[]) => void;
  deleteFolder: (id: string) => void;

  createLink: (folderId: string, title: string, url: string, iconUrl?: string | null) => Promise<LinkItem>;
  updateLink: (id: string, updates: Partial<LinkItem>) => void;
  deleteLink: (id: string) => void;
  reorderLinksInFolder: (folderId: string, activeId: string, overId: string) => void;
  moveLinkCrossFolder: (linkId: string, targetFolderId: string, targetIndex?: number) => void;
}

const DEFAULT_VIEWPORT: Viewport = { x: 0, y: 0, zoom: 1 };

export const useCanvasStore = create<CanvasState>((set, get) => {
  // Listen to syncQueue status changes
  syncQueue.subscribeStatus((status, pendingCount) => {
    set({ syncStatus: status, pendingSyncCount: pendingCount });
  });

  return {
    folders: [],
    links: [],
    viewport: DEFAULT_VIEWPORT,
    gridSnapping: true,
    selectedFolderIds: [],
    activeGuides: [],
    syncStatus: 'synced',
    pendingSyncCount: 0,
    activeDragLinkId: null,
    activeTargetFolderId: null,
    contextMenu: { isOpen: false, screenX: 0, screenY: 0, worldX: 0, worldY: 0 },
    isLoading: true,

    setViewport: (viewportOrFn) => {
      set((state) => {
        const nextViewport = typeof viewportOrFn === 'function' ? viewportOrFn(state.viewport) : viewportOrFn;
        return { viewport: nextViewport };
      });
      get().saveViewportSettings();
    },

    setGridSnapping: (enabled) => {
      set({ gridSnapping: enabled });
      get().saveViewportSettings();
    },

    saveViewportSettings: () => {
      const { viewport, gridSnapping } = get();
      const userId = useAuthStore.getState().getEffectiveUserId();

      // Debounce saving viewport to Supabase
      syncQueue.enqueue(
        `canvas_settings_${userId}`,
        async () => {
          const { error } = await supabase.from('canvas_settings').upsert({
            user_id: userId,
            viewport_x: viewport.x,
            viewport_y: viewport.y,
            zoom: viewport.zoom,
            grid_snapping: gridSnapping,
            updated_at: new Date().toISOString(),
          });
          if (error) throw error;
        },
        'Save canvas viewport settings'
      );
    },

    setSelectedFolderIds: (ids) => set({ selectedFolderIds: ids }),

    toggleFolderSelection: (id) => {
      set((state) => {
        const isSelected = state.selectedFolderIds.includes(id);
        return {
          selectedFolderIds: isSelected
            ? state.selectedFolderIds.filter((item) => item !== id)
            : [...state.selectedFolderIds, id],
        };
      });
    },

    clearSelection: () => set({ selectedFolderIds: [] }),

    setActiveGuides: (guides) => set({ activeGuides: guides }),
    clearActiveGuides: () => set({ activeGuides: [] }),

    setContextMenu: (contextMenu) => set({ contextMenu }),
    closeContextMenu: () =>
      set({ contextMenu: { isOpen: false, screenX: 0, screenY: 0, worldX: 0, worldY: 0 } }),

    setActiveDragLinkId: (id) => set({ activeDragLinkId: id }),
    setActiveTargetFolderId: (id) => set({ activeTargetFolderId: id }),

    loadCanvasData: async () => {
      set({ isLoading: true });
      const userId = useAuthStore.getState().getEffectiveUserId();

      try {
        // 1. Fetch folders
        const { data: foldersData, error: foldersError } = await supabase
          .from('folders')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

        // 2. Fetch links
        const { data: linksData, error: linksError } = await supabase
          .from('links')
          .select('*')
          .eq('user_id', userId)
          .order('order_index', { ascending: true });

        // 3. Fetch canvas settings
        const { data: settingsData } = await supabase
          .from('canvas_settings')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (foldersError || linksError) {
          // If query failed (e.g. offline or unauthorized), try localStorage cache
          console.warn('Supabase fetch failed, attempting localStorage cache', { foldersError, linksError });
          const cached = localStorage.getItem(`canvas_cache_${userId}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            set({
              folders: parsed.folders || [],
              links: parsed.links || [],
              viewport: parsed.viewport || DEFAULT_VIEWPORT,
              gridSnapping: parsed.gridSnapping ?? true,
              isLoading: false,
            });
            return;
          }
        }

        // Apply fetched data
        const loadedFolders: Folder[] = (foldersData as Folder[]) || [];
        const loadedLinks: LinkItem[] = (linksData as LinkItem[]) || [];
        const loadedViewport: Viewport = settingsData
          ? { x: settingsData.viewport_x, y: settingsData.viewport_y, zoom: settingsData.zoom }
          : DEFAULT_VIEWPORT;
        const loadedSnapping: boolean = settingsData ? settingsData.grid_snapping : true;

        // If newly created guest with 0 folders, create default welcome folders
        if (loadedFolders.length === 0) {
          const defaultFolders: Folder[] = [
            {
              id: crypto.randomUUID(),
              user_id: userId,
              title: '常用工具 🛠️',
              position_x: 100,
              position_y: 120,
              width: 320,
              height: null,
              color: '#3b82f6',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: crypto.randomUUID(),
              user_id: userId,
              title: '灵感与设计 🎨',
              position_x: 480,
              position_y: 120,
              width: 320,
              height: null,
              color: '#8b5cf6',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ];

          const defaultLinks: LinkItem[] = [
            {
              id: crypto.randomUUID(),
              user_id: userId,
              folder_id: defaultFolders[0].id,
              title: 'GitHub',
              url: 'https://github.com',
              icon_url: 'https://www.google.com/s2/favicons?domain=github.com&sz=128',
              order_index: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: crypto.randomUUID(),
              user_id: userId,
              folder_id: defaultFolders[0].id,
              title: 'Google',
              url: 'https://google.com',
              icon_url: 'https://www.google.com/s2/favicons?domain=google.com&sz=128',
              order_index: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: crypto.randomUUID(),
              user_id: userId,
              folder_id: defaultFolders[1].id,
              title: 'Dribbble',
              url: 'https://dribbble.com',
              icon_url: 'https://www.google.com/s2/favicons?domain=dribbble.com&sz=128',
              order_index: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ];

          set({
            folders: defaultFolders,
            links: defaultLinks,
            viewport: loadedViewport,
            gridSnapping: loadedSnapping,
            isLoading: false,
          });

          // Sync default folders & links
          syncQueue.enqueue(`init_folders_${userId}`, async () => {
            await supabase.from('folders').insert(defaultFolders);
            await supabase.from('links').insert(defaultLinks);
          }, 'Initialize default welcome data');
        } else {
          set({
            folders: loadedFolders,
            links: loadedLinks,
            viewport: loadedViewport,
            gridSnapping: loadedSnapping,
            isLoading: false,
          });
        }

        // Cache snapshot
        localStorage.setItem(
          `canvas_cache_${userId}`,
          JSON.stringify({
            folders: get().folders,
            links: get().links,
            viewport: loadedViewport,
            gridSnapping: loadedSnapping,
          })
        );
      } catch (err) {
        console.error('Failed to load canvas data:', err);
        set({ isLoading: false });
      }
    },

    createFolder: async (position_x, position_y, title = '新建文件夹', color = '#3b82f6') => {
      const userId = useAuthStore.getState().getEffectiveUserId();
      const newFolder: Folder = {
        id: crypto.randomUUID(),
        user_id: userId,
        title,
        position_x,
        position_y,
        width: 340,
        height: null,
        color,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Optimistic update
      set((state) => ({
        folders: [...state.folders, newFolder],
        selectedFolderIds: [newFolder.id],
      }));

      // Persistent sync
      syncQueue.enqueue(
        `create_folder_${newFolder.id}`,
        async () => {
          const { error } = await supabase.from('folders').insert(newFolder);
          if (error) throw error;
        },
        `Create folder: ${newFolder.title}`
      );

      return newFolder;
    },

    updateFolder: (id, updates) => {
      set((state) => ({
        folders: state.folders.map((f) => (f.id === id ? { ...f, ...updates, updated_at: new Date().toISOString() } : f)),
      }));

      syncQueue.enqueue(
        `update_folder_${id}`,
        async () => {
          const { error } = await supabase
            .from('folders')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id);
          if (error) throw error;
        },
        `Update folder ${id}`
      );
    },

    updateFoldersPositions: (updates) => {
      // Optimistic update
      set((state) => {
        const updateMap = new Map(updates.map((u) => [u.id, u]));
        return {
          folders: state.folders.map((f) => {
            const u = updateMap.get(f.id);
            if (u) {
              return { ...f, position_x: u.position_x, position_y: u.position_y, updated_at: new Date().toISOString() };
            }
            return f;
          }),
        };
      });

      // Sync batch to Supabase
      updates.forEach((u) => {
        syncQueue.enqueue(
          `folder_pos_${u.id}`,
          async () => {
            const { error } = await supabase
              .from('folders')
              .update({ position_x: u.position_x, position_y: u.position_y, updated_at: new Date().toISOString() })
              .eq('id', u.id);
            if (error) throw error;
          },
          `Update folder position ${u.id}`
        );
      });
    },

    deleteFolder: (id) => {
      set((state) => ({
        folders: state.folders.filter((f) => f.id !== id),
        links: state.links.filter((l) => l.folder_id !== id),
        selectedFolderIds: state.selectedFolderIds.filter((selId) => selId !== id),
      }));

      syncQueue.enqueue(
        `delete_folder_${id}`,
        async () => {
          const { error } = await supabase.from('folders').delete().eq('id', id);
          if (error) throw error;
        },
        `Delete folder ${id}`
      );
    },

    createLink: async (folderId, title, url, iconUrl = null) => {
      const userId = useAuthStore.getState().getEffectiveUserId();
      const currentLinks = get().links.filter((l) => l.folder_id === folderId);
      const newLink: LinkItem = {
        id: crypto.randomUUID(),
        user_id: userId,
        folder_id: folderId,
        title,
        url,
        icon_url: iconUrl,
        order_index: currentLinks.length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      set((state) => ({
        links: [...state.links, newLink],
      }));

      syncQueue.enqueue(
        `create_link_${newLink.id}`,
        async () => {
          const { error } = await supabase.from('links').insert(newLink);
          if (error) throw error;
        },
        `Create link: ${title}`
      );

      return newLink;
    },

    updateLink: (id, updates) => {
      set((state) => ({
        links: state.links.map((l) => (l.id === id ? { ...l, ...updates, updated_at: new Date().toISOString() } : l)),
      }));

      syncQueue.enqueue(
        `update_link_${id}`,
        async () => {
          const { error } = await supabase
            .from('links')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id);
          if (error) throw error;
        },
        `Update link ${id}`
      );
    },

    deleteLink: (id) => {
      set((state) => ({
        links: state.links.filter((l) => l.id !== id),
      }));

      syncQueue.enqueue(
        `delete_link_${id}`,
        async () => {
          const { error } = await supabase.from('links').delete().eq('id', id);
          if (error) throw error;
        },
        `Delete link ${id}`
      );
    },

    reorderLinksInFolder: (folderId, activeId, overId) => {
      if (activeId === overId) return;

      const { links } = get();
      const folderLinks = links
        .filter((l) => l.folder_id === folderId)
        .sort((a, b) => a.order_index - b.order_index);

      const oldIndex = folderLinks.findIndex((l) => l.id === activeId);
      const newIndex = folderLinks.findIndex((l) => l.id === overId);
      if (oldIndex === -1 || newIndex === -1) return;

      // Reorder array
      const reordered = [...folderLinks];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      // Reassign order_index
      const updatedFolderLinks = reordered.map((link, idx) => ({
        ...link,
        order_index: idx,
        updated_at: new Date().toISOString(),
      }));

      const otherLinks = links.filter((l) => l.folder_id !== folderId);
      set({ links: [...otherLinks, ...updatedFolderLinks] });

      // Enqueue batch sync
      syncQueue.enqueue(
        `reorder_folder_${folderId}`,
        async () => {
          const { error } = await supabase
            .from('links')
            .upsert(updatedFolderLinks.map((l) => ({ id: l.id, folder_id: l.folder_id, order_index: l.order_index, updated_at: l.updated_at })));
          if (error) throw error;
        },
        `Reorder links in folder ${folderId}`
      );
    },

    moveLinkCrossFolder: (linkId, targetFolderId, targetIndex) => {
      const { links } = get();
      const targetLink = links.find((l) => l.id === linkId);
      if (!targetLink) return;

      const sourceFolderId = targetLink.folder_id;
      if (sourceFolderId === targetFolderId && targetIndex === undefined) return;

      // Other links not in source or target
      const neutralLinks = links.filter((l) => l.folder_id !== sourceFolderId && l.folder_id !== targetFolderId);

      // Source folder links without moved item
      const sourceLinks = links
        .filter((l) => l.folder_id === sourceFolderId && l.id !== linkId)
        .sort((a, b) => a.order_index - b.order_index)
        .map((l, idx) => ({ ...l, order_index: idx, updated_at: new Date().toISOString() }));

      // Target folder links
      const targetLinks = links
        .filter((l) => l.folder_id === targetFolderId && l.id !== linkId)
        .sort((a, b) => a.order_index - b.order_index);

      const insertIdx = targetIndex !== undefined ? Math.min(targetIndex, targetLinks.length) : targetLinks.length;
      const updatedMovedLink: LinkItem = {
        ...targetLink,
        folder_id: targetFolderId,
        updated_at: new Date().toISOString(),
      };

      targetLinks.splice(insertIdx, 0, updatedMovedLink);
      const reindexedTargetLinks = targetLinks.map((l, idx) => ({
        ...l,
        order_index: idx,
        updated_at: new Date().toISOString(),
      }));

      const finalLinks = [...neutralLinks, ...sourceLinks, ...reindexedTargetLinks];
      set({ links: finalLinks });

      // Persist to Supabase
      syncQueue.enqueue(
        `move_cross_folder_${linkId}`,
        async () => {
          const upsertPayload = [
            ...sourceLinks.map((l) => ({ id: l.id, folder_id: l.folder_id, order_index: l.order_index, updated_at: l.updated_at })),
            ...reindexedTargetLinks.map((l) => ({ id: l.id, folder_id: l.folder_id, order_index: l.order_index, updated_at: l.updated_at })),
          ];
          const { error } = await supabase.from('links').upsert(upsertPayload);
          if (error) throw error;
        },
        `Move link ${linkId} to folder ${targetFolderId}`
      );
    },
  };
});
