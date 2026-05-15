'use client';

import { useOrcaStore } from '@/store/orcaStore';

type ThemeOption = { value: 'light' | 'system' | 'dark'; icon: string; label: string };

const OPTIONS: ThemeOption[] = [
  { value: 'light', icon: '☀', label: 'Light' },
  { value: 'system', icon: '⚙', label: 'System' },
  { value: 'dark', icon: '◐', label: 'Dark' },
];

export function ThemeToggle() {
  const { theme, setTheme } = useOrcaStore();

  return (
    <div
      style={{
        display: 'flex',
        border: '1px solid var(--border-default)',
        overflow: 'hidden',
      }}
    >
      {OPTIONS.map((opt) => {
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            title={opt.label}
            style={{
              background: active ? 'var(--accent-primary)' : 'transparent',
              color: active ? 'var(--text-inverse)' : 'var(--text-muted)',
              border: 'none',
              borderRight: opt.value !== 'dark' ? '1px solid var(--border-default)' : 'none',
              padding: '5px 9px',
              cursor: 'pointer',
              fontSize: '0.75rem',
              transition: 'background 150ms ease, color 150ms ease',
              fontFamily: 'sans-serif',
            }}
          >
            {opt.icon}
          </button>
        );
      })}
    </div>
  );
}
