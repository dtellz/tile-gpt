import React from 'react';
import './StatusBar.css';

interface StatusBarProps {
  status?: string;
  workspacePath?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({ 
  status = 'Ready',
  workspacePath = ''
}) => {
  return (
    <div className="status-bar">
      <div className="status-item">
        <span className="status-item-icon">●</span>
        {status}
      </div>
      {workspacePath && (
        <div className="status-item">
          <span className="status-item-icon">📁</span>
          {workspacePath.split('/').pop()}
        </div>
      )}
      <div className="status-actions">
        <div className="status-item">Version: 1.0.0</div>
      </div>
    </div>
  );
};
