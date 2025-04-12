import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { FileItem, WorkspaceInfo } from '../types';
import { selectDirectory, readDirectory } from '../utils/preload';
import { WorkspaceContext, WorkspaceContextType } from './WorkspaceContext';

interface WorkspaceProviderProps {
  children: ReactNode;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({ children }) => {
  const [workspace, setWorkspace] = useState<WorkspaceInfo | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Function to load a directory and its contents
  const loadDirectory = useCallback(async (dirPath: string): Promise<FileItem[]> => {
    try {
      const items = await readDirectory(dirPath);
      
      return items.map(item => ({
        id: `${item.path}-${Date.now()}`,
        name: item.name,
        path: item.path,
        type: item.type,
        children: item.type === 'folder' ? [] : undefined,
        isLoading: false
      }));
    } catch (err) {
      console.error(`Error loading directory ${dirPath}:`, err);
      throw err;
    }
  }, []);

  // Function to load files from workspace
  const loadWorkspaceFiles = useCallback(async (dirPath: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const rootFiles = await loadDirectory(dirPath);
      setFiles(rootFiles);
    } catch (err) {
      console.error('Error loading workspace files:', err);
      setError('Failed to load workspace files');
    } finally {
      setIsLoading(false);
    }
  }, [loadDirectory]);

  // Function to refresh the current workspace
  const refreshWorkspace = useCallback(async () => {
    if (!workspace) return;
    await loadWorkspaceFiles(workspace.path);
  }, [workspace, loadWorkspaceFiles]);

  // Function to select a workspace directory
  const selectWorkspace = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const dirPath = await selectDirectory();
      
      if (!dirPath) {
        setIsLoading(false);
        return;
      }
      
      // Create workspace info
      const pathParts = dirPath.split('/');
      const workspaceName = pathParts[pathParts.length - 1];
      
      const newWorkspace = {
        path: dirPath,
        name: workspaceName
      };
      
      // Save to localStorage
      localStorage.setItem('workspace', JSON.stringify(newWorkspace));
      
      setWorkspace(newWorkspace);
      await loadWorkspaceFiles(dirPath);
    } catch (err) {
      console.error('Error selecting workspace:', err);
      setError('Failed to select workspace directory');
    } finally {
      setIsLoading(false);
    }
  }, [loadWorkspaceFiles]);

  // Load workspace from localStorage on initial render
  useEffect(() => {
    const savedWorkspace = localStorage.getItem('workspace');
    if (savedWorkspace) {
      try {
        const parsedWorkspace = JSON.parse(savedWorkspace);
        setWorkspace(parsedWorkspace);
        loadWorkspaceFiles(parsedWorkspace.path);
      } catch (err) {
        console.error('Failed to load saved workspace:', err);
        localStorage.removeItem('workspace');
      }
    }
  }, [loadWorkspaceFiles]);

  const contextValue: WorkspaceContextType = {
    workspace,
    files,
    isLoading,
    error,
    selectWorkspace,
    refreshWorkspace,
    loadDirectory
  };

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  );
};
