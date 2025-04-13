import React, { useState, useCallback, ReactNode } from 'react';
import { LogEntry, LogLevel } from '../types';
import { LogContext, LogContextType } from './LogContextDef';

interface LogProviderProps {
  children: ReactNode;
}

export const LogProvider: React.FC<LogProviderProps> = ({ children }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  // Make the log viewer visible by default
  const [isVisible, setIsVisible] = useState<boolean>(true);
  
  // Function to add a new log entry
  const addLog = useCallback((message: string, level: LogLevel) => {
    const newLog: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      level,
      timestamp: new Date()
    };
    
    setLogs(prevLogs => {
      // Keep only the most recent 100 logs to prevent memory issues
      const updatedLogs = [newLog, ...prevLogs];
      if (updatedLogs.length > 100) {
        return updatedLogs.slice(0, 100);
      }
      return updatedLogs;
    });
    
    // Also log to console for debugging
    switch (level) {
      case 'error':
        console.error(message);
        break;
      case 'warning':
        console.warn(message);
        break;
      case 'success':
        console.log(`%c${message}`, 'color: green');
        break;
      default:
        console.log(message);
    }
    
    // Auto-show log panel for errors and warnings
    if (level === 'error' || level === 'warning') {
      setIsVisible(true);
    }
  }, []);
  
  // Function to clear all logs
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);
  
  // Function to toggle log visibility
  const toggleVisibility = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);
  
  const contextValue: LogContextType = {
    logs,
    addLog,
    clearLogs,
    isVisible,
    toggleVisibility
  };
  
  return (
    <LogContext.Provider value={contextValue}>
      {children}
    </LogContext.Provider>
  );
};
