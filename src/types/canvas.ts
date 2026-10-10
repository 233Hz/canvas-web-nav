export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export type GuideType = 'edge-x' | 'edge-y' | 'center-x' | 'center-y' | 'grid-x' | 'grid-y';

export interface AlignmentGuide {
  id: string;
  type: GuideType;
  orientation: 'horizontal' | 'vertical';
  position: number; // world coordinate
  start?: number;    // start position along the perpendicular axis
  end?: number;      // end position along the perpendicular axis
}

export interface SnapResult {
  x: number;
  y: number;
  guides: AlignmentGuide[];
}

export interface MarqueeBox {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export interface ContextMenuState {
  isOpen: boolean;
  screenX: number;
  screenY: number;
  worldX: number;
  worldY: number;
  folderId?: string;
}

export type SyncState = 'synced' | 'syncing' | 'offline' | 'error';
