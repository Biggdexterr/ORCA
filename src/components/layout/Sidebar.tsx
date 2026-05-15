'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useOrcaStore } from '@/store/orcaStore';

const NAV_ITEMS = [
  {
    href: '/',
    label: 'Dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    href: '/sniper',
    label: 'Sniper',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9"/>
        <circle cx="12" cy="12" r="3"/>
        <line x1="12" y1="3" x2="12" y2="1"/>
        <line x1="12" y1="23" x2="12" y2="21"/>
        <line x1="3" y1="12" x2="1" y2="12"/>
        <line x1="23" y1="12" x2="21" y2="12"/>
      </svg>
    ),
  },
  {
    href: '/whalemap',
    label: 'WhaleMap',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 16.5c0 2.485-4.03 4.5-9 4.5s-9-2.015-9-4.5"/>
        <path d="M3 16.5c0-2.485 4.03-4.5 9-4.5s9 2.015 9 4.5"/>
        <path d="M12 12C8.134 12 5 10.657 5 9s3.134-3 7-3 7 1.343 7 3-3.134 3-7 3z"/>
        <line x1="21" y1="9" x2="21" y2="16.5"/>
        <line x1="3" y1="9" x2="3" y2="16.5"/>
      </svg>
    ),
  },
  {
    href: '/kols',
    label: 'KOL Radar',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
  {
    href: '/leaderboard',
    label: 'Leaderboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    href: '/alerts',
    label: 'Alerts',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
];

// ORCA fin logo SVG
const OrcaLogo = () => (
  <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8 36 C8 36 12 20 24 12 C36 4 44 16 40 28 C36 40 20 44 8 36 Z"
      fill="var(--accent-primary)"
      opacity="0.9"
    />
    <path
      d="M24 12 C24 12 28 6 36 8 C40 9 42 12 40 16"
      stroke="var(--accent-critical)"
      strokeWidth="2.5"
      fill="none"
    />
    <circle cx="32" cy="20" r="2.5" fill="var(--text-inverse)" />
  </svg>
);

export function Sidebar() {
  const pathname = usePathname();
  const { unreadAlerts, wsConnected } = useOrcaStore();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        style={{
          width: collapsed ? 64 : 220,
          background: 'var(--bg-surface)',
          borderRight: '2px solid var(--border-default)',
          transition: 'width 200ms ease',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          zIndex: 30,
        }}
        className="hidden md:flex"
      >
        {/* Logo */}
        <div
          style={{
            padding: '16px',
            borderBottom: '2px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <OrcaLogo />
          {!collapsed && (
            <div>
              <div
                style={{
                  fontFamily: 'Bebas Neue',
                  fontSize: '1.4rem',
                  letterSpacing: '0.2em',
                  color: 'var(--accent-primary)',
                  lineHeight: 1,
                }}
              >
                ORCA
              </div>
              <div
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.08em',
                  fontFamily: 'IBM Plex Mono',
                }}
              >
                SMART MONEY INTEL
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {collapsed ? (
                <path d="M9 18l6-6-6-6"/>
              ) : (
                <path d="M15 18l-6-6 6-6"/>
              )}
            </svg>
          </button>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: collapsed ? '12px 20px' : '11px 16px',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--bg-overlay)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
                  textDecoration: 'none',
                  transition: 'background 120ms ease, color 120ms ease',
                  fontFamily: 'Bebas Neue',
                  letterSpacing: '0.12em',
                  fontSize: '0.9rem',
                  position: 'relative',
                }}
                className={isActive ? '' : 'hover:bg-overlay'}
              >
                <span style={{ flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
                {item.href === '/alerts' && unreadAlerts > 0 && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      background: 'var(--signal-bear)',
                      color: '#fff',
                      fontSize: '0.65rem',
                      fontFamily: 'IBM Plex Mono',
                      padding: '1px 5px',
                      minWidth: 18,
                      textAlign: 'center',
                    }}
                  >
                    {unreadAlerts > 99 ? '99+' : unreadAlerts}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Connection Status */}
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            className={wsConnected ? 'live-dot' : 'dead-dot'}
            style={{ display: 'block', width: 8, height: 8, flexShrink: 0 }}
          />
          {!collapsed && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono' }}>
              {wsConnected ? 'LIVE' : 'DISCONNECTED'}
            </span>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex"
        style={{
          background: 'var(--bg-surface)',
          borderTop: '2px solid var(--border-default)',
        }}
      >
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 0',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                textDecoration: 'none',
                borderTop: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                gap: 4,
              }}
            >
              {item.icon}
              <span style={{ fontSize: '0.6rem', fontFamily: 'Bebas Neue', letterSpacing: '0.08em' }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
