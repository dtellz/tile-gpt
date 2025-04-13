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
        {theme === 'light' ? (
          <svg className="theme-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
            <path d="M12 2V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 20V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M4 12L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M22 12L20 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M19.778 4.22183L17.6569 6.34315" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M6.34309 17.6569L4.22183 19.7782" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M19.778 19.7782L17.6569 17.6569" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M6.34309 6.34315L4.22183 4.22183" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg className="theme-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21.752 15.002C20.5633 15.4975 19.2879 15.7517 18 15.75C13.5 15.75 9.75 12.75 9.75 7.5C9.75 5.75 10.5 3.5 11.25 2.25C7.5 2.75 3 6.25 3 12.25C3 17.75 7.25 22 12.75 22C16.5 22 20.25 19 21.5 15.25L21.752 15.002Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 5C16.5 6.5 18 8 19.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    </div>
  );
};
