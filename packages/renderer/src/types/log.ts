// Define log entry types
export type LogLevel = 'info' | 'warning' | 'error' | 'success';

export interface LogEntry {
  id: string;
  message: string;
  level: LogLevel;
  timestamp: Date;
}
