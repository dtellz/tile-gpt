import React from 'react';
import { TabItem } from '../../types';
import './PropertiesPanel.css';

interface PropertiesPanelProps {
  activeTab: TabItem | null;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ activeTab }) => {
  return (
    <div className="properties-panel">
      <div className="panel-header">
        <h3>PROPERTIES</h3>
      </div>
      <div className="panel-content">
        {activeTab ? (
          <>
            <div className="property-group">
              <h4>File Information</h4>
              <div className="property-item">
                <span className="property-label">Name:</span>
                <span className="property-value">{activeTab.name}</span>
              </div>
              <div className="property-item">
                <span className="property-label">Path:</span>
                <span className="property-value">{activeTab.path}</span>
              </div>
            </div>
            
            <div className="property-group">
              <h4>Tile Information</h4>
              <div className="property-item">
                <span className="property-label">Selected:</span>
                <span className="property-value">None</span>
              </div>
            </div>
            
            <div className="property-group">
              <h4>LLM Assistant</h4>
              <div className="llm-placeholder">
                <p>LLM dialog will be implemented here</p>
                <p>You will be able to interact with an AI assistant to help with map editing</p>
              </div>
            </div>
          </>
        ) : (
          <div className="no-selection">
            <p>No file selected</p>
            <p>Select a file to view its properties</p>
          </div>
        )}
      </div>
    </div>
  );
};
