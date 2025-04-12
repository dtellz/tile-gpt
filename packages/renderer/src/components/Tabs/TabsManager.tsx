import React from 'react';
import { TabItem } from '../../types';
import './TabsManager.css';

interface TabsManagerProps {
  tabs: TabItem[];
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
}

export const TabsManager: React.FC<TabsManagerProps> = ({ 
  tabs, 
  onTabClick, 
  onTabClose 
}) => {
  const handleTabClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    onTabClose(tabId);
  };

  return (
    <div className="tabs-container">
      {tabs.map(tab => (
        <div 
          key={tab.id} 
          className={`tab ${tab.active ? 'active' : ''}`}
          onClick={() => onTabClick(tab.id)}
        >
          <span className="tab-name" title={tab.path}>{tab.name}</span>
          <button 
            className="tab-close"
            onClick={(e) => handleTabClose(e, tab.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};
