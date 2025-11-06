import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Lấy theme từ localStorage hoặc mặc định là 'light'
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      const initialTheme = savedTheme || 'light';
      
      // Áp dụng theme ngay khi load (trước khi React render)
      const root = document.documentElement;
      if (initialTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      
      return initialTheme;
    }
    return 'light';
  });

  useEffect(() => {
    // Lưu theme vào localStorage và áp dụng cho document
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      
      // Áp dụng theme cho document
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      
      // Lưu vào localStorage
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => {
      return prevTheme === 'light' ? 'dark' : 'light';
    });
  };

  const value = {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

