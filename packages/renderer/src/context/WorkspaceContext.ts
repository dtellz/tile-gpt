import { createContext } from 'react';
import { FileItem, WorkspaceInfo } from '../types';

export interface WorkspaceContextType {
  workspace: WorkspaceInfo | null;
  workspacePath: string;
  files: FileItem[];
  isLoading: boolean;
  error: string | null;
  selectWorkspace: () => Promise<void>;
  refreshWorkspace: () => Promise<void>;
  changeWorkspace: () => Promise<void>;
  loadDirectory: (path: string) => Promise<FileItem[]>;
}

export const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);
