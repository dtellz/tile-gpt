import { useContext } from 'react';
import { WorkspaceContext } from '../context/WorkspaceContext';

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
