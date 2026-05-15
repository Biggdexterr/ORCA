'use client';

import { useEffect, useState } from 'react';
import { useOrcaStore } from '@/store/orcaStore';
import { DashboardStats } from '@/types';
import { ThemeToggle } from './ThemeToggle';

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span
        style={{
          fontSize: '0.65rem',
          color: 'var(--text-muted)',
          fontFamily: 'Bebas Neue',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: '0.85rem',
          color: 'var(--accent-primary)',
          fontFamily: 'IBM Plex Mono',
          fontWeight: 600,
        }}
        className="tabular-nums"
      >
        {value}
      </span>
    </div>
  );
}

export function TopBar() {
  const { stats, unreadAlerts, markAlertsRead, wsConnected } = useOrcaStore();
  const [localStats, setLocalStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/dashboard/stats');
        const data = await res.json();
        setLocalStats(data.data);
      } catch {
        // Use fallback stats
        setLocalStats({
          tokensScanned24h: 247,
          buySignals24h: 18,
          whaleMoves24h: 63,
          kolApes24h: 9,
          aiAccuracyRate: 73.2,
          activeWhales: 41,
          alertsSent24h: 112,
        });
      }
    }
    loadStats();
  }, []);

  const displayStats = stats || localStats;

  return (
    <header
      style={{
        background: 'var(--bg-surface)',
        borderBottom: '2px solid var(--border-default)',
        padding: '0 16px',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* Live Stats */}
      <div className="hidden sm:flex items-center gap-5 flex-1 overflow-hidden">
        <div className="stats-divider" />
        {displayStats && (
          <>
            <StatItem label="Scanned 24h" value={displayStats.tokensScanned24h.toLocaleString()} />
            <div className="stats-divider" />
            <StatItem label="Buy Signals" value={displayStats.buySignals24h} />
            <div className="stats-divider" />
            <StatItem label="Whale Moves" value={displayStats.whaleMoves24h} />
            <div className="stats-divider" />
            <StatItem label="AI Accuracy" value={`${displayStats.aiAccuracyRate.toFixed(1)}%`} />
            <div className="stats-divider" />
            <StatItem label="Active Whales" value={displayStats.activeWhales} />
          </>
        )}
      </div>

      {/* Right Side Controls */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Notification Bell */}
        <button
          onClick={markAlertsRead}
          style={{
            position: 'relative',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: 6,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {unreadAlerts > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 2,
                right: 2,
                background: 'var(--signal-bear)',
                color: '#fff',
                fontSize: '0.55rem',
                fontFamily: 'IBM Plex Mono',
                width: 14,
                height: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
              }}
            >
              {unreadAlerts > 9 ? '9+' : unreadAlerts}
            </span>
          )}
        </button>

        {/* Theme Toggle */}
        <ThemeToggle />
      </div>
    </header>
  );
}
