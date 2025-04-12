import React from 'react';
import './StatusBar.css';

interface StatusBarProps {
  status?: string;
  position?: { x: number; y: number };
  zoom?: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({ 
  status = 'Ready', 
  position = { x: 0, y: 0 }, 
  zoom = 100 
}) => {
  return (
    <div className="status-bar">
      <div className="status-item">{status}</div>
      <div className="status-item">Position: {position.x},{position.y}</div>
      <div className="status-item">Zoom: {zoom}%</div>
    </div>
  );
};
