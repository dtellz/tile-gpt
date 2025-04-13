export interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileItem[];
  isLoading?: boolean;
}

export interface TabItem {
  id: string;
  name: string;
  path: string;
  active: boolean;
}

export interface WorkspaceInfo {
  path: string;
  name: string;
}

// Log types
export type LogLevel = 'info' | 'warning' | 'error' | 'success';

export interface LogEntry {
  id: string;
  message: string;
  level: LogLevel;
  timestamp: Date;
}
