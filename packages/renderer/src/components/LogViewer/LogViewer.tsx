import React, { useRef, useEffect } from 'react';
import { useLog } from '../../hooks/useLogContext';
import { LogEntry } from '../../types';
import './LogViewer.css';

export const LogViewer: React.FC = () => {
  const { logs, clearLogs, isVisible, toggleVisibility } = useLog();
  const logContainerRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to the bottom when new logs are added
  useEffect(() => {
    if (logContainerRef.current && isVisible) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [logs, isVisible]);
  
  if (!isVisible) {
    return (
      <div className="log-viewer-toggle-container">
        <button 
          className="log-viewer-toggle-button"
          onClick={toggleVisibility}
          title="Show Logs"
        >
          📋
        </button>
      </div>
    );
  }
  
  return (
    <div className="log-viewer">
      <div className="log-viewer-header">
        <h3>Application Logs</h3>
        <div className="log-viewer-actions">
          <button 
            className="log-action-button"
            onClick={clearLogs}
            title="Clear Logs"
          >
            🗑️
          </button>
          <button 
            className="log-action-button"
            onClick={toggleVisibility}
            title="Hide Logs"
          >
            ✖️
          </button>
        </div>
      </div>
      
      <div className="log-viewer-content" ref={logContainerRef}>
        {logs.length === 0 ? (
          <div className="log-empty-state">No logs to display</div>
        ) : (
          logs.map((log) => (
            <LogEntryItem key={log.id} log={log} />
          ))
        )}
      </div>
    </div>
  );
};

interface LogEntryItemProps {
  log: LogEntry;
}

const LogEntryItem: React.FC<LogEntryItemProps> = ({ log }) => {
  // Format timestamp
  const formattedTime = log.timestamp.toLocaleTimeString();
  
  // Get icon and class based on log level
  let icon = '📝';
  switch (log.level) {
    case 'error':
      icon = '❌';
      break;
    case 'warning':
      icon = '⚠️';
      break;
    case 'success':
      icon = '✅';
      break;
    default:
      icon = 'ℹ️';
  }
  
  return (
    <div className={`log-entry ${log.level}`}>
      <div className="log-entry-icon">{icon}</div>
      <div className="log-entry-content">
        <div className="log-entry-message">{log.message}</div>
        <div className="log-entry-time">{formattedTime}</div>
      </div>
    </div>
  );
};
