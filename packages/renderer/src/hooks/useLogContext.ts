import { useContext } from 'react';
import { LogContext } from '../context/LogContextDef';

// Custom hook for using the log context
export const useLog = () => {
  const context = useContext(LogContext);
  if (context === undefined) {
    throw new Error('useLog must be used within a LogProvider');
  }
  return context;
};
