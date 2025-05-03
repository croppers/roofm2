'use client';
import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // On mount, check existing class on <html>
  useEffect(() => {
    const root = window.document.documentElement;
    const initial = root.classList.contains('dark') ? 'dark' : 'light';
    setTheme(initial);
  }, []);

  // Apply theme class to <html> and <body>
  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    if (theme === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <button
      onClick={toggleTheme}
      className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-sm rounded"
    >
      {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
    </button>
  );
} 