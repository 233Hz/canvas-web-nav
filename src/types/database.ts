export interface Folder {
  id: string;
  user_id: string;
  title: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number | null;
  color: string;
  is_docked?: boolean;
  docked_order?: number;
  created_at: string;
  updated_at: string;
}

export interface LinkItem {
  id: string;
  user_id: string;
  folder_id: string;
  title: string;
  url: string;
  icon_url: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface CanvasSettings {
  user_id: string;
  viewport_x: number;
  viewport_y: number;
  zoom: number;
  grid_snapping: boolean;
  updated_at: string;
}
