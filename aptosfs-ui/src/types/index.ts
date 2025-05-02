export type Theme = 'light' | 'dark';

export interface FileItem {
  id: string;
  name: string;
  type: FileType;
  size: number;
  created: Date;
  modified: Date;
  owner?: string;
  path: string;
  starred?: boolean;
  shared?: boolean;
  thumbnail?: string;
}

export type FileType = 
  | 'folder'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'pdf'
  | 'archive'
  | 'code'
  | 'unknown';

export type ViewMode = 'list' | 'grid';

export type SortField = 'name' | 'size' | 'type' | 'created' | 'modified' | 'owner';

export type SortDirection = 'asc' | 'desc';

export interface FileSort {
  field: SortField;
  direction: SortDirection;
}

export interface WindowState {
  id: string;
  title: string;
  path: string;
  isActive: boolean;
  isMaximized: boolean;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  viewMode: ViewMode;
  sort: FileSort;
}

export type ContextMenuAction = 
  | 'open'
  | 'preview'
  | 'download'
  | 'share'
  | 'rename'
  | 'move'
  | 'copy'
  | 'delete'
  | 'properties';

export type FileOperation = 
  | 'copy'
  | 'move'
  | 'delete'
  | 'rename'
  | 'create-folder';

export interface SidebarItem {
  id: string;
  name: string;
  icon: string;
  path: string;
  type: 'favorites' | 'device' | 'tag' | 'shared';
}