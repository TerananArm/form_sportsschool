'use client';
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // โหลดค่า Dark Mode และ Sidebar จาก LocalStorage
  useEffect(() => {
    // Sidebar
    const savedSidebar = localStorage.getItem('sidebarCollapsed');
    if (savedSidebar) setIsSidebarCollapsed(savedSidebar === 'true');

    // Dark Mode Logic
    const applyTheme = (isDark) => {
      setIsDarkMode(isDark);
      if (isDark) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    };

    const savedTheme = localStorage.getItem('theme');
    const systemMedia = window.matchMedia('(prefers-color-scheme: dark)');

    // Initial Load
    if (savedTheme) {
      applyTheme(savedTheme === 'dark');
    } else {
      // Default to light mode as requested
      applyTheme(false);
    }

    // Listener for System Changes (only if no user preference)
    const handleSystemChange = (e) => {
      if (!localStorage.getItem('theme')) {
        applyTheme(e.matches);
      }
    };

    systemMedia.addEventListener('change', handleSystemChange);
    return () => systemMedia.removeEventListener('change', handleSystemChange);
  }, []);

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
  };

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);

    // Disable transitions temporarily to prevent lag/flash effect
    document.documentElement.classList.add('no-transitions');

    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }

    // Re-enable transitions after a short microtask
    setTimeout(() => {
      document.documentElement.classList.remove('no-transitions');
    }, 0);
  };

  return (
    <ThemeContext.Provider value={{ isSidebarCollapsed, toggleSidebar, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);