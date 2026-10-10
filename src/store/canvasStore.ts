import { create } from 'zustand';
import { Folder, LinkItem, CanvasSettings, PanelBlock } from '../types/database';
import { Viewport, AlignmentGuide, ContextMenuState, SyncState } from '../types/canvas';
import { db } from '../lib/supabase';
import { useAuthStore } from './authStore';

interface CanvasState {
  panels: PanelBlock[];
  folders: Folder[];
  links: LinkItem[];
  viewport: Viewport;
  gridSnapping: boolean;
  selectedFolderIds: string[];
  activeGuides: AlignmentGuide[];
  syncStatus: SyncState;
  hasUnsavedChanges: boolean;
  isUploading: boolean;
  lastSavedTime: string | null;
  activeDragLinkId: string | null;
  activeTargetFolderId: string | null;
  contextMenu: ContextMenuState;
  isLoading: boolean;

  // Viewport & Settings
  setViewport: (viewport: Viewport | ((prev: Viewport) => Viewport)) => void;
  setGridSnapping: (enabled: boolean) => void;

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

  // Data Loading & Uploading (Manual Upload to Supabase)
  loadCanvasData: () => Promise<void>;
  uploadToSupabase: () => Promise<boolean>;

  // Panel Actions (Canvas Container Blocks)
  createPanel: (position_x: number, position_y: number, title?: string, width?: number) => PanelBlock;
  updatePanel: (id: string, updates: Partial<PanelBlock>) => void;
  deletePanel: (id: string) => void;
  moveFolderToPanel: (folderId: string, panelId: string | null) => void;

  // Folder Actions
  createFolder: (position_x: number, position_y: number, title?: string, color?: string, panel_id?: string | null) => Promise<Folder>;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  updateFoldersPositions: (updates: { id: string; position_x: number; position_y: number }[]) => void;
  deleteFolder: (id: string) => void;

  // Link Actions
  createLink: (folderId: string, title: string, url: string, iconUrl?: string | null) => Promise<LinkItem>;
  updateLink: (id: string, updates: Partial<LinkItem>) => void;
  deleteLink: (id: string) => void;
  reorderLinksInFolder: (folderId: string, activeId: string, overId: string) => void;
  moveLinkCrossFolder: (linkId: string, targetFolderId: string, targetIndex?: number) => void;
}

const DEFAULT_VIEWPORT: Viewport = { x: 0, y: 0, zoom: 1 };

function saveLocalCache(userId: string, data: any) {
  try {
    localStorage.setItem(`canvas_cache_${userId}`, JSON.stringify(data));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  panels: [],
  folders: [],
  links: [],
  viewport: DEFAULT_VIEWPORT,
  gridSnapping: true,
  selectedFolderIds: [],
  activeGuides: [],
  syncStatus: 'synced',
  hasUnsavedChanges: false,
  isUploading: false,
  lastSavedTime: null,
  activeDragLinkId: null,
  activeTargetFolderId: null,
  contextMenu: { isOpen: false, screenX: 0, screenY: 0, worldX: 0, worldY: 0 },
  isLoading: true,

  setViewport: (viewportOrFn) => {
    set((state) => {
      const nextViewport = typeof viewportOrFn === 'function' ? viewportOrFn(state.viewport) : viewportOrFn;
      return { viewport: nextViewport, hasUnsavedChanges: true };
    });
  },

  setGridSnapping: (enabled) => {
    set({ gridSnapping: enabled, hasUnsavedChanges: true });
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

  // 1. Load Data from Supabase web_nav schema or Local Cache
  loadCanvasData: async () => {
    set({ isLoading: true });
    const userId = useAuthStore.getState().getEffectiveUserId();

    try {
      // Fetch panels from web_nav
      const { data: panelsData } = await db
        .from('panels')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      // Fetch folders from web_nav
      const { data: foldersData } = await db
        .from('folders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      // Fetch links from web_nav
      const { data: linksData } = await db
        .from('links')
        .select('*')
        .eq('user_id', userId)
        .order('order_index', { ascending: true });

      // Fetch canvas settings from web_nav
      const { data: settingsData } = await db
        .from('canvas_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const loadedPanels: PanelBlock[] = (panelsData as PanelBlock[]) || [];
      const loadedFolders: Folder[] = (foldersData as Folder[]) || [];
      const loadedLinks: LinkItem[] = (linksData as LinkItem[]) || [];

      // If empty in Supabase, check local cache first
      if (loadedFolders.length === 0 && loadedPanels.length === 0) {
        const cached = localStorage.getItem(`canvas_cache_${userId}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            set({
              panels: parsed.panels || [],
              folders: parsed.folders || [],
              links: parsed.links || [],
              viewport: parsed.viewport || DEFAULT_VIEWPORT,
              gridSnapping: parsed.gridSnapping ?? true,
              hasUnsavedChanges: false,
              isLoading: false,
            });
            return;
          } catch {
            // parse failed, proceed to defaults
          }
        }

        // Initialize default welcome canvas with 1 panel and 2 folders
        const defaultPanel: PanelBlock = {
          id: crypto.randomUUID(),
          user_id: userId,
          title: '常用面板',
          position_x: 60,
          position_y: 80,
          width: 740,
          height: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const defaultFolders: Folder[] = [
          {
            id: crypto.randomUUID(),
            user_id: userId,
            panel_id: defaultPanel.id,
            title: '开发与工具 🛠️',
            position_x: 0,
            position_y: 0,
            width: 340,
            height: null,
            color: '#3b82f6',
            order_index: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: crypto.randomUUID(),
            user_id: userId,
            panel_id: defaultPanel.id,
            title: '设计与灵感 🎨',
            position_x: 0,
            position_y: 0,
            width: 340,
            height: null,
            color: '#8b5cf6',
            order_index: 1,
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
          panels: [defaultPanel],
          folders: defaultFolders,
          links: defaultLinks,
          viewport: DEFAULT_VIEWPORT,
          gridSnapping: true,
          hasUnsavedChanges: true,
          isLoading: false,
        });

        saveLocalCache(userId, {
          panels: [defaultPanel],
          folders: defaultFolders,
          links: defaultLinks,
          viewport: DEFAULT_VIEWPORT,
          gridSnapping: true,
        });
        return;
      }

      const loadedViewport: Viewport = settingsData
        ? { x: settingsData.viewport_x, y: settingsData.viewport_y, zoom: settingsData.zoom }
        : DEFAULT_VIEWPORT;
      const loadedSnapping: boolean = settingsData ? settingsData.grid_snapping : true;

      set({
        panels: loadedPanels,
        folders: loadedFolders,
        links: loadedLinks,
        viewport: loadedViewport,
        gridSnapping: loadedSnapping,
        hasUnsavedChanges: false,
        isLoading: false,
      });

      saveLocalCache(userId, {
        panels: loadedPanels,
        folders: loadedFolders,
        links: loadedLinks,
        viewport: loadedViewport,
        gridSnapping: loadedSnapping,
      });
    } catch (err) {
      console.error('Failed to load canvas data:', err);
      set({ isLoading: false });
    }
  },

  // 2. Manual Upload to Supabase (web_nav schema)
  uploadToSupabase: async () => {
    const { panels, folders, links, viewport, gridSnapping } = get();
    const userId = useAuthStore.getState().getEffectiveUserId();

    set({ isUploading: true });

    try {
      // 1. Upsert all current records
      if (panels.length > 0) {
        await db.from('panels').upsert(panels);
      }
      if (folders.length > 0) {
        await db.from('folders').upsert(folders);
      }
      if (links.length > 0) {
        await db.from('links').upsert(links);
      }

      // 2. Clean up removed records in reverse dependency order (links -> folders -> panels)
      const linkIds = links.map((l) => l.id);
      if (linkIds.length > 0) {
        await db.from('links').delete().eq('user_id', userId).not('id', 'in', `(${linkIds.join(',')})`);
      } else {
        await db.from('links').delete().eq('user_id', userId);
      }

      const folderIds = folders.map((f) => f.id);
      if (folderIds.length > 0) {
        await db.from('folders').delete().eq('user_id', userId).not('id', 'in', `(${folderIds.join(',')})`);
      } else {
        await db.from('folders').delete().eq('user_id', userId);
      }

      const panelIds = panels.map((p) => p.id);
      if (panelIds.length > 0) {
        await db.from('panels').delete().eq('user_id', userId).not('id', 'in', `(${panelIds.join(',')})`);
      } else {
        await db.from('panels').delete().eq('user_id', userId);
      }

      // 4. Upsert canvas settings
      await db.from('canvas_settings').upsert({
        user_id: userId,
        viewport_x: viewport.x,
        viewport_y: viewport.y,
        zoom: viewport.zoom,
        grid_snapping: gridSnapping,
        updated_at: new Date().toISOString(),
      });

      const now = new Date().toLocaleTimeString();
      set({
        isUploading: false,
        hasUnsavedChanges: false,
        lastSavedTime: now,
        syncStatus: 'synced',
      });

      saveLocalCache(userId, { panels, folders, links, viewport, gridSnapping });
      return true;
    } catch (err) {
      console.error('Upload to Supabase failed:', err);
      set({ isUploading: false, syncStatus: 'error' });
      return false;
    }
  },

  // Panel Block Operations
  createPanel: (position_x, position_y, title = '面板', width = 740) => {
    const userId = useAuthStore.getState().getEffectiveUserId();
    const newPanel: PanelBlock = {
      id: crypto.randomUUID(),
      user_id: userId,
      title,
      position_x,
      position_y,
      width,
      height: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    set((state) => ({
      panels: [...state.panels, newPanel],
      hasUnsavedChanges: true,
    }));
    return newPanel;
  },

  updatePanel: (id, updates) => {
    set((state) => ({
      panels: state.panels.map((p) =>
        p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
      ),
      hasUnsavedChanges: true,
    }));
  },

  deletePanel: (id) => {
    set((state) => ({
      panels: state.panels.filter((p) => p.id !== id),
      // Move contained folders back to canvas (remove panel_id)
      folders: state.folders.map((f) =>
        f.panel_id === id ? { ...f, panel_id: null, updated_at: new Date().toISOString() } : f
      ),
      hasUnsavedChanges: true,
    }));
  },

  moveFolderToPanel: (folderId, panelId) => {
    set((state) => ({
      folders: state.folders.map((f) =>
        f.id === folderId ? { ...f, panel_id: panelId, updated_at: new Date().toISOString() } : f
      ),
      hasUnsavedChanges: true,
    }));
  },

  // Folder Operations
  createFolder: async (position_x, position_y, title = '新建文件夹', color = '#3b82f6', panel_id = null) => {
    const userId = useAuthStore.getState().getEffectiveUserId();
    const newFolder: Folder = {
      id: crypto.randomUUID(),
      user_id: userId,
      panel_id,
      title,
      position_x,
      position_y,
      width: 340,
      height: null,
      color,
      order_index: get().folders.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    set((state) => ({
      folders: [...state.folders, newFolder],
      selectedFolderIds: [newFolder.id],
      hasUnsavedChanges: true,
    }));

    return newFolder;
  },

  updateFolder: (id, updates) => {
    set((state) => ({
      folders: state.folders.map((f) =>
        f.id === id ? { ...f, ...updates, updated_at: new Date().toISOString() } : f
      ),
      hasUnsavedChanges: true,
    }));
  },

  updateFoldersPositions: (updates) => {
    set((state) => {
      const updateMap = new Map(updates.map((u) => [u.id, u]));
      return {
        folders: state.folders.map((f) => {
          const u = updateMap.get(f.id);
          if (u) {
            return {
              ...f,
              position_x: u.position_x,
              position_y: u.position_y,
              updated_at: new Date().toISOString(),
            };
          }
          return f;
        }),
        hasUnsavedChanges: true,
      };
    });
  },

  deleteFolder: (id) => {
    set((state) => ({
      folders: state.folders.filter((f) => f.id !== id),
      links: state.links.filter((l) => l.folder_id !== id),
      selectedFolderIds: state.selectedFolderIds.filter((selId) => selId !== id),
      hasUnsavedChanges: true,
    }));
  },

  // Link Operations
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
      hasUnsavedChanges: true,
    }));

    return newLink;
  },

  updateLink: (id, updates) => {
    set((state) => ({
      links: state.links.map((l) =>
        l.id === id ? { ...l, ...updates, updated_at: new Date().toISOString() } : l
      ),
      hasUnsavedChanges: true,
    }));
  },

  deleteLink: (id) => {
    set((state) => ({
      links: state.links.filter((l) => l.id !== id),
      hasUnsavedChanges: true,
    }));
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

    const reordered = [...folderLinks];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    const updatedFolderLinks = reordered.map((link, idx) => ({
      ...link,
      order_index: idx,
      updated_at: new Date().toISOString(),
    }));

    const otherLinks = links.filter((l) => l.folder_id !== folderId);
    set({ links: [...otherLinks, ...updatedFolderLinks], hasUnsavedChanges: true });
  },

  moveLinkCrossFolder: (linkId, targetFolderId, targetIndex) => {
    const { links } = get();
    const targetLink = links.find((l) => l.id === linkId);
    if (!targetLink) return;

    const sourceFolderId = targetLink.folder_id;
    if (sourceFolderId === targetFolderId && targetIndex === undefined) return;

    const neutralLinks = links.filter(
      (l) => l.folder_id !== sourceFolderId && l.folder_id !== targetFolderId
    );

    const sourceLinks = links
      .filter((l) => l.folder_id === sourceFolderId && l.id !== linkId)
      .sort((a, b) => a.order_index - b.order_index)
      .map((l, idx) => ({ ...l, order_index: idx, updated_at: new Date().toISOString() }));

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

    set({
      links: [...neutralLinks, ...sourceLinks, ...reindexedTargetLinks],
      hasUnsavedChanges: true,
    });
  },
}));
