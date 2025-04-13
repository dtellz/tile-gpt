import React from 'react';
import { useTheme } from '../../hooks/useThemeContext';
import './ThemeToggle.css';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="theme-toggle">
      <button 
        className="theme-toggle-button" 
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'dark' ? (
          // Simple sun icon - shown when in dark mode (clicking will switch to light)
          <div className="icon-container">
            ☀️
          </div>
        ) : (
          // Simple moon icon - shown when in light mode (clicking will switch to dark)
          <div className="icon-container">
            🌙
          </div>
        )}
      </button>
    </div>
  );
};
