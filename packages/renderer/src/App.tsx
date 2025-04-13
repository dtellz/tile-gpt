import { useState } from 'react';
import './App.css';

// Import components
import { FileExplorer } from './components/FileExplorer';
import { TabsManager } from './components/Tabs';
import { MapEditor } from './components/MapEditor';
import { PropertiesPanel } from './components/PropertiesPanel';
import { StatusBar } from './components/StatusBar';
import { LogViewer } from './components/LogViewer';

// Import context and hooks
import { WorkspaceProvider } from './context/WorkspaceProvider';
import { LogProvider } from './context/LogContext';
import { useWorkspace } from './hooks/useWorkspaceContext';

// Import types
import { FileItem, TabItem } from './types';

// Main App Component
function AppContent() {
  // State for tabs
  const [tabs, setTabs] = useState<TabItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabItem | null>(null);
  
  // We're using the WorkspaceProvider but not directly using any values here
  // The FileExplorer component will use the context internally
  useWorkspace();
  
  // Handle file selection
  const handleFileSelect = (file: FileItem) => {
    // Only open files, not folders
    if (file.type !== 'file') return;
    
    // Check if the file is already open in a tab
    const existingTab = tabs.find(tab => tab.path === file.path);
    
    if (existingTab) {
      // If the file is already open, just activate its tab
      handleTabClick(existingTab.id);
    } else {
      // Otherwise, create a new tab for the file
      const newTab: TabItem = {
        id: `tab-${Date.now()}`,
        name: file.name,
        path: file.path,
        active: true
      };
      
      // Deactivate all other tabs and add the new one
      const updatedTabs = tabs.map(tab => ({
        ...tab,
        active: false
      }));
      
      setTabs([...updatedTabs, newTab]);
      setActiveTab(newTab);
    }
  };
  
  // Handle tab click
  const handleTabClick = (tabId: string) => {
    const updatedTabs = tabs.map(tab => ({
      ...tab,
      active: tab.id === tabId
    }));
    
    setTabs(updatedTabs);
    setActiveTab(updatedTabs.find(tab => tab.active) || null);
  };
  
  // Handle tab close
  const handleTabClose = (tabId: string) => {
    const tabToClose = tabs.find(tab => tab.id === tabId);
    const tabIndex = tabs.findIndex(tab => tab.id === tabId);
    
    // Remove the tab
    const updatedTabs = tabs.filter(tab => tab.id !== tabId);
    
    // If we're closing the active tab, activate another tab if available
    if (tabToClose?.active && updatedTabs.length > 0) {
      // Try to activate the tab to the left, or the first tab if there's no tab to the left
      const newActiveIndex = Math.max(0, tabIndex - 1);
      updatedTabs[newActiveIndex].active = true;
      setActiveTab(updatedTabs[newActiveIndex]);
    } else if (updatedTabs.length === 0) {
      // If there are no tabs left, clear the active tab
      setActiveTab(null);
    }
    
    setTabs(updatedTabs);
  };
  
  return (
    <div className="app-container">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="app-title">TileGPT</div>
        <div className="menu-bar">
          <div className="menu-item">File</div>
          <div className="menu-item">Edit</div>
          <div className="menu-item">View</div>
          <div className="menu-item">Help</div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="main-content">
        {/* Left Sidebar */}
        <div className="sidebar left-sidebar">
          <FileExplorer onFileSelect={handleFileSelect} />
        </div>
        
        {/* Center Area */}
        <div className="center-area">
          {/* Tabs */}
          {tabs.length > 0 && (
            <TabsManager 
              tabs={tabs} 
              onTabClick={handleTabClick} 
              onTabClose={handleTabClose} 
            />
          )}
          
          {/* Editor */}
          <div className="editor-container">
            <MapEditor activeTab={activeTab} />
          </div>
        </div>
        
        {/* Right Sidebar */}
        <div className="sidebar right-sidebar">
          <PropertiesPanel activeTab={activeTab} />
        </div>
      </div>
      
      {/* Status Bar */}
      <StatusBar />
    </div>
  );
}

// Wrap the app with the WorkspaceProvider and LogProvider
function App() {
  return (
    <WorkspaceProvider>
      <LogProvider>
        <AppContent />
        <LogViewer />
      </LogProvider>
    </WorkspaceProvider>
  );
}

export default App;
