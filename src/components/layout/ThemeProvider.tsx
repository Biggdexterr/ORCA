'use client';

import { useEffect } from 'react';
import { useOrcaStore } from '@/store/orcaStore';
import { useWebSocket } from '@/hooks/useWebSocket';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useOrcaStore();

  // Initialize WebSocket connection
  useWebSocket();

  useEffect(() => {
    // Load saved theme on mount
    const saved = localStorage.getItem('orca-theme') as 'dark' | 'light' | 'system' | null;
    if (saved) {
      setTheme(saved);
    } else {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const apply = () => {
        document.documentElement.className = mq.matches ? 'theme-dark' : 'theme-light';
      };
      apply();
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    } else {
      document.documentElement.className = `theme-${theme}`;
    }
  }, [theme]);

  return <>{children}</>;
}
