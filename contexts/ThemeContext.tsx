import React, { createContext, ReactNode, useContext, useState } from 'react';

interface AppThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const AppThemeContext = createContext<AppThemeContextType | undefined>(undefined);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <AppThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </AppThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(AppThemeContext);
  if (context === undefined) {
    throw new Error('useAppTheme must be used within an AppThemeProvider');
  }
  return context;
}
