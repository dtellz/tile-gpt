import { createContext } from 'react';
import { LogEntry, LogLevel } from '../types';

// Define the LogContext type
export interface LogContextType {
  logs: LogEntry[];
  addLog: (message: string, level: LogLevel) => void;
  clearLogs: () => void;
  isVisible: boolean;
  toggleVisibility: () => void;
}

// Create the context
export const LogContext = createContext<LogContextType | undefined>(undefined);
