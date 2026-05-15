'use client';

import { useState, useEffect, useCallback } from 'react';

interface LiveAlert {
  id: string;
  type: 'SNIPER_HIT' | 'WHALE_BUY' | 'KOL_APE';
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  message: string;
  verdict: 'BUY' | 'WATCH' | 'AVOID';
  aiScore: number;
  liquidityUsd: number;
  volume24h: number;
  priceChange1h: number;
  priceChange24h: number;
  dexUrl: string;
  telegramSent: boolean;
  createdAt: string;
}

const TYPE_ICONS: Record<string, string> = {
  SNIPER_HIT: '🎯',
  WHALE_BUY: '🐋',
  KOL_APE: '🐦',
};

const VERDICT_STYLE: Record<string, { color: string; bg: string }> = {
  BUY: { color: 'var(--signal-bull)', bg: 'rgba(0,255,100,0.08)' },
  WATCH: { color: 'var(--signal-watch)', bg: 'rgba(255,200,0,0.08)' },
  AVOID: { color: 'var(--signal-bear)', bg: 'rgba(255,60,60,0.08)' },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'BUY' | 'WATCH' | 'AVOID'>('ALL');
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [scanStats, setScanStats] = useState<{ scanned: number; newAlerts: number; telegramSent: number } | null>(null);
  const [telegramConfigured, setTelegramConfigured] = useState(false);

  // Check if Telegram is configured in settings
  useEffect(() => {
    try {
      const stored = localStorage.getItem('orca-settings');
      if (stored) {
        const s = JSON.parse(stored);
        setTelegramConfigured(Boolean(s.telegramBotToken && s.telegramChatId));
      }
    } catch {}
  }, []);

  // Fetch alerts from store
  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts?limit=100');
      const data = await res.json();
      if (data.success) setAlerts(data.data);
    } catch {}
    finally { setLoading(false); }
  }, []);

  // Run the scanner
  const runScan = useCallback(async () => {
    if (scanning) return;
    setScanning(true);
    try {
      // Get user's Telegram settings
      let telegramToken = '';
      let telegramChatId = '';
      try {
        const stored = localStorage.getItem('orca-settings');
        if (stored) {
          const s = JSON.parse(stored);
          telegramToken = s.telegramBotToken || '';
          telegramChatId = s.telegramChatId || '';
        }
      } catch {}

      const res = await fetch('/api/alerts/scan', {
        method: 'POST',
        headers: {
          ...(telegramToken ? { 'x-telegram-token': telegramToken } : {}),
          ...(telegramChatId ? { 'x-telegram-chat-id': telegramChatId } : {}),
          'x-min-score': '60',
        },
      });
      const data = await res.json();
      if (data.success) {
        setScanStats({ scanned: data.scanned, newAlerts: data.newAlerts, telegramSent: data.telegramSent });
        setLastScan(new Date().toISOString());
        // Refresh alert list
        await fetchAlerts();
      }
    } catch (e) {
      console.error('[Scan error]', e);
    } finally {
      setScanning(false);
    }
  }, [scanning, fetchAlerts]);

  // Initial load + auto-scan every 60s
  useEffect(() => {
    fetchAlerts();
    runScan();
    const scanInterval = setInterval(runScan, 60_000);
    const fetchInterval = setInterval(fetchAlerts, 5_000);
    return () => { clearInterval(scanInterval); clearInterval(fetchInterval); };
  }, []);

  const filtered = filter === 'ALL' ? alerts : alerts.filter(a => a.verdict === filter);

  const counts = {
    ALL: alerts.length,
    BUY: alerts.filter(a => a.verdict === 'BUY').length,
    WATCH: alerts.filter(a => a.verdict === 'WATCH').length,
    AVOID: alerts.filter(a => a.verdict === 'AVOID').length,
  };

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Bebas Neue', fontSize: '2rem', letterSpacing: '0.2em', color: 'var(--text-primary)', margin: 0 }}>
            LIVE ALERTS
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontFamily: 'Barlow Condensed', marginTop: 4, fontSize: '0.9rem' }}>
            Real-time signals from DexScreener · Auto-scans every 60s
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Telegram status */}
          <div style={{ padding: '6px 12px', border: '1px solid', borderColor: telegramConfigured ? 'var(--signal-bull)' : 'var(--border-default)', fontFamily: 'IBM Plex Mono', fontSize: '0.72rem', color: telegramConfigured ? 'var(--signal-bull)' : 'var(--text-muted)' }}>
            {telegramConfigured ? '✓ TELEGRAM ON' : '✗ TELEGRAM OFF'}
          </div>

          {/* Manual scan button */}
          <button onClick={runScan} disabled={scanning}
            style={{ fontFamily: 'Bebas Neue', letterSpacing: '0.1em', padding: '8px 20px', background: scanning ? 'var(--bg-surface)' : 'var(--accent-primary)', color: scanning ? 'var(--text-muted)' : 'var(--text-inverse)', border: 'none', cursor: scanning ? 'default' : 'pointer', fontSize: '0.95rem', transition: 'all 200ms' }}>
            {scanning ? '⟳ SCANNING...' : '⟳ SCAN NOW'}
          </button>
        </div>
      </div>

      {/* Scan stats bar */}
      {scanStats && (
        <div style={{ display: 'flex', gap: 16, padding: '10px 16px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Last scan: <span style={{ color: 'var(--text-primary)' }}>{lastScan ? timeAgo(lastScan) : '—'}</span>
          </span>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Tokens scanned: <span style={{ color: 'var(--text-primary)' }}>{scanStats.scanned}</span>
          </span>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            New alerts: <span style={{ color: scanStats.newAlerts > 0 ? 'var(--signal-bull)' : 'var(--text-primary)' }}>{scanStats.newAlerts}</span>
          </span>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Telegram sent: <span style={{ color: scanStats.telegramSent > 0 ? 'var(--signal-bull)' : 'var(--text-primary)' }}>{scanStats.telegramSent}</span>
          </span>
          {!telegramConfigured && (
            <a href="/settings" style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.75rem', color: 'var(--accent-primary)' }}>
              → Add Telegram in Settings
            </a>
          )}
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(['ALL', 'BUY', 'WATCH', 'AVOID'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: '6px 16px', fontFamily: 'IBM Plex Mono', fontSize: '0.78rem', cursor: 'pointer',
              background: filter === f ? 'var(--accent-primary)' : 'var(--bg-surface)',
              color: filter === f ? 'var(--text-inverse)' : 'var(--text-secondary)',
              border: `1px solid ${filter === f ? 'var(--accent-primary)' : 'var(--border-default)'}`,
              clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)',
            }}>
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Alerts list */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: 'IBM Plex Mono', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            INITIALIZING SCANNER...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: 'IBM Plex Mono', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {scanning ? 'SCANNING FOR SIGNALS...' : 'NO ALERTS YET — SCANNER RUNS EVERY 60S'}
          </div>
        ) : (
          <div>
            {filtered.map((alert, i) => {
              const vs = VERDICT_STYLE[alert.verdict] || VERDICT_STYLE.WATCH;
              return (
                <div key={alert.id}
                  style={{
                    padding: '14px 18px',
                    borderBottom: i < filtered.length - 1 ? '1px solid var(--border-default)' : 'none',
                    background: i === 0 ? 'var(--bg-overlay)' : 'transparent',
                    display: 'flex', flexDirection: 'column', gap: 8,
                  }}>

                  {/* Top row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '1.1rem' }}>{TYPE_ICONS[alert.type]}</span>
                      <span style={{ fontFamily: 'Bebas Neue', fontSize: '1.1rem', letterSpacing: '0.1em', color: 'var(--text-primary)' }}>
                        ${alert.tokenSymbol}
                      </span>
                      <span style={{ fontFamily: 'Barlow Condensed', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {alert.tokenName}
                      </span>
                      {/* Verdict badge */}
                      <span style={{ padding: '2px 10px', fontFamily: 'IBM Plex Mono', fontSize: '0.72rem', fontWeight: 700, color: vs.color, background: vs.bg, border: `1px solid ${vs.color}` }}>
                        {alert.verdict}
                      </span>
                      {/* Score */}
                      <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {alert.aiScore}/100
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {alert.telegramSent && (
                        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.68rem', color: 'var(--signal-bull)' }}>
                          ✓ TG
                        </span>
                      )}
                      <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {timeAgo(alert.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Metrics row */}
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      💧 {fmt(alert.liquidityUsd)}
                    </span>
                    <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      📊 Vol {fmt(alert.volume24h)}
                    </span>
                    <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.75rem', color: alert.priceChange1h >= 0 ? 'var(--signal-bull)' : 'var(--signal-bear)' }}>
                      1h {alert.priceChange1h > 0 ? '+' : ''}{alert.priceChange1h.toFixed(1)}%
                    </span>
                    <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.75rem', color: alert.priceChange24h >= 0 ? 'var(--signal-bull)' : 'var(--signal-bear)' }}>
                      24h {alert.priceChange24h > 0 ? '+' : ''}{alert.priceChange24h.toFixed(1)}%
                    </span>
                  </div>

                  {/* Links row */}
                  <div style={{ display: 'flex', gap: 12 }}>
                    <a href={alert.dexUrl} target="_blank" rel="noopener noreferrer"
                      style={{ fontFamily: 'Barlow Condensed', fontSize: '0.78rem', color: 'var(--accent-primary)' }}>
                      DexScreener ↗
                    </a>
                    <a href={`https://solscan.io/token/${alert.tokenAddress}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontFamily: 'Barlow Condensed', fontSize: '0.78rem', color: 'var(--accent-primary)' }}>
                      Solscan ↗
                    </a>
                    <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      {alert.tokenAddress.slice(0, 8)}...{alert.tokenAddress.slice(-6)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
