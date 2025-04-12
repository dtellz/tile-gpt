import React, { useState } from 'react';
import { useWorkspace } from '../../hooks/useWorkspaceContext';
import { FileItem } from '../../types';
import './FileExplorer.css';

interface FileExplorerProps {
  onFileSelect: (file: FileItem) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ onFileSelect }) => {
  const { workspace, files, isLoading, selectWorkspace, refreshWorkspace, changeWorkspace } = useWorkspace();

  return (
    <div className="file-explorer">
      <div className="explorer-header">
        <h3>EXPLORER</h3>
        <div className="explorer-actions">
          {workspace ? (
            <>
              <button 
                className="action-button" 
                title="Refresh"
                onClick={refreshWorkspace}
              >
                🔄
              </button>
              <button 
                className="action-button" 
                title="Change Workspace"
                onClick={changeWorkspace}
              >
                📁
              </button>
              <span className="workspace-name" title={workspace.path}>
                {workspace.name}
              </span>
            </>
          ) : (
            <button 
              className="action-button open-folder" 
              onClick={selectWorkspace}
            >
              Open Folder
            </button>
          )}
        </div>
      </div>
      
      <div className="file-list">
        {isLoading ? (
          <div className="loading-indicator">Loading...</div>
        ) : workspace ? (
          files.length > 0 ? (
            files.map((item) => (
              <FileTreeItem 
                key={item.id} 
                item={item} 
                onFileSelect={onFileSelect}
              />
            ))
          ) : (
            <div className="empty-state">No files found</div>
          )
        ) : (
          <div className="empty-state">
            No workspace selected. Click "Open Folder" to select a workspace.
          </div>
        )}
      </div>
    </div>
  );
};

interface FileTreeItemProps {
  item: FileItem;
  onFileSelect: (file: FileItem) => void;
  level?: number;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({ 
  item, 
  onFileSelect, 
  level = 0 
}) => {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<FileItem[]>(item.children || []);
  const [isLoading, setIsLoading] = useState(false);
  const { loadDirectory } = useWorkspace();
  
  const toggleExpand = async () => {
    if (item.type === 'folder') {
      if (!expanded && children.length === 0) {
        // Load directory contents when expanding for the first time
        setIsLoading(true);
        try {
          const loadedChildren = await loadDirectory(item.path);
          setChildren(loadedChildren);
        } catch (error) {
          console.error(`Error loading directory ${item.path}:`, error);
        } finally {
          setIsLoading(false);
        }
      }
      setExpanded(!expanded);
    } else {
      // Handle file selection
      onFileSelect(item);
    }
  };
  
  const getFileIcon = () => {
    if (item.type === 'folder') {
      return expanded ? '📂' : '📁';
    }
    
    // Determine icon based on file extension
    const extension = item.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'tmx':
        return '🗺️'; // Map file
      case 'tsx':
        return '🧩'; // Tileset file
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return '🖼️'; // Image file
      case 'json':
        return '📋'; // JSON file
      case 'js':
      case 'ts':
      case 'jsx':
        return '📜'; // Script file
      default:
        return '📄'; // Default file icon
    }
  };
  
  return (
    <div className="file-tree-item" style={{ paddingLeft: `${level * 16}px` }}>
      <div 
        className={`file-item-header ${item.type}`} 
        onClick={toggleExpand}
      >
        {item.name !== '.DS_Store' &&   (
          <>
            <span className={`icon ${item.type}`}>
              {getFileIcon()}
            </span>
            <span className="file-name">{item.name}</span>
          </>
        )}
      </div>
      
      {item.type === 'folder' && expanded && (
        <div className="file-children">
          {isLoading ? (
            <div className="loading-indicator" style={{ paddingLeft: `${(level + 1) * 16}px` }}>
              Loading...
            </div>
          ) : children.length > 0 ? (
            children.map((child) => (
              <FileTreeItem 
                key={child.id} 
                item={child} 
                onFileSelect={onFileSelect}
                level={level + 1}
              />
            ))
          ) : (
            <div className="empty-folder" style={{ paddingLeft: `${(level + 1) * 16}px` }}>
              Empty folder
            </div>
          )}
        </div>
      )}
    </div>
  );
};
