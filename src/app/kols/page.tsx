'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface KOL {
  address: string;
  label: string;
  xHandle: string | null;
  totalPnlUsd: number;
  unrealizedPnlUsd: number;
  winRate: number;
  tradeCount: number;
  totalValueUsd: number;
  topHoldings: {
    symbol: string;
    name: string;
    valueUsd: number;
    uiAmount: number;
    address: string;
    logoURI?: string;
  }[];
  isKOL: boolean;
  isWhale: boolean;
  source: string;
}

interface Trade {
  walletLabel: string;
  walletAddress: string;
  tokenSymbol: string;
  tokenAddress: string;
  amountUsd: number;
  side: string;
  timestamp: number;
  txHash: string;
}

function fmt(n: number) {
  if (!n) return '—';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${n < 0 ? '-' : ''}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${n < 0 ? '-' : ''}$${(abs / 1_000).toFixed(0)}K`;
  return `${n < 0 ? '-' : ''}$${abs.toFixed(0)}`;
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function getBirdeyeKey() {
  try {
    const s = localStorage.getItem('orca-settings');
    return s ? JSON.parse(s).birdeyeApiKey || '' : '';
  } catch { return ''; }
}

export default function KOLPage() {
  const [kols, setKols] = useState<KOL[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'cards' | 'feed'>('cards');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError(null);
    const key = getBirdeyeKey();
    const headers: Record<string, string> = key ? { 'x-birdeye-key': key } : {};

    try {
      const [kolsRes, tradesRes] = await Promise.allSettled([
        fetch('/api/kols', { headers }),
        fetch('/api/kols/activity', { headers }),
      ]);

      if (kolsRes.status === 'fulfilled') {
        const data = await kolsRes.value.json();
        if (data.success) setKols(data.data);
        else setError(data.error);
      }
      if (tradesRes.status === 'fulfilled') {
        const data = await tradesRes.value.json();
        if (data.success) setTrades(data.data);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 1400 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Bebas Neue', fontSize: '2rem', letterSpacing: '0.2em', color: 'var(--text-primary)', margin: 0 }}>
            KOL RADAR
          </h1>
          <p style={{ fontFamily: 'Barlow Condensed', color: 'var(--text-secondary)', marginTop: 4 }}>
            Live wallet PnL & holdings via Birdeye · {kols.length} KOLs tracked
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['cards', 'feed'].map(v => (
            <button key={v} onClick={() => setView(v as any)}
              style={{ padding: '7px 18px', fontFamily: 'IBM Plex Mono', fontSize: '0.78rem', cursor: 'pointer', border: '1px solid var(--border-default)', background: view === v ? 'var(--accent-primary)' : 'var(--bg-surface)', color: view === v ? 'var(--text-inverse)' : 'var(--text-secondary)' }}>
              {v.toUpperCase()}
            </button>
          ))}
          <button onClick={fetchData}
            style={{ padding: '7px 18px', fontFamily: 'IBM Plex Mono', fontSize: '0.78rem', cursor: 'pointer', border: '1px solid var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}>
            ↻ REFRESH
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(255,60,60,0.1)', border: '1px solid var(--signal-bear)', color: 'var(--signal-bear)', fontFamily: 'IBM Plex Mono', fontSize: '0.8rem', marginBottom: 20 }}>
          ⚠ {error} — {error.includes('key') ? <Link href="/settings" style={{ color: 'inherit' }}>Add Birdeye key in Settings →</Link> : 'Check console'}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 64, textAlign: 'center', fontFamily: 'IBM Plex Mono', color: 'var(--text-muted)' }}>
          FETCHING LIVE WALLET DATA FROM BIRDEYE...
        </div>
      ) : view === 'cards' ? (
        // ── KOL Cards ─────────────────────────────────────────
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {kols.map(kol => (
            <div key={kol.address}
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', padding: 20, display: 'flex', flexDirection: 'column', gap: 14, transition: 'border-color 150ms', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-accent)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}>

              {/* KOL header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontFamily: 'Bebas Neue', fontSize: '1.15rem', letterSpacing: '0.12em', color: 'var(--text-primary)' }}>
                    {kol.label}
                  </div>
                  {kol.xHandle && (
                    <a href={`https://x.com/${kol.xHandle}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontFamily: 'Barlow Condensed', fontSize: '0.8rem', color: 'var(--accent-primary)', textDecoration: 'none' }}>
                      @{kol.xHandle}
                    </a>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {kol.isKOL && <span style={{ fontSize: '0.62rem', padding: '2px 6px', border: '1px solid var(--signal-watch)', color: 'var(--signal-watch)', fontFamily: 'IBM Plex Mono' }}>KOL</span>}
                  {kol.isWhale && <span style={{ fontSize: '0.62rem', padding: '2px 6px', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', fontFamily: 'IBM Plex Mono' }}>WHALE</span>}
                  <span style={{ fontSize: '0.62rem', padding: '2px 6px', border: '1px solid var(--signal-bull)', color: 'var(--signal-bull)', fontFamily: 'IBM Plex Mono' }}>
                    🦅 LIVE
                  </span>
                </div>
              </div>

              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'REALIZED PNL', value: fmt(kol.totalPnlUsd), color: kol.totalPnlUsd >= 0 ? 'var(--signal-bull)' : 'var(--signal-bear)' },
                  { label: 'PORTFOLIO', value: fmt(kol.totalValueUsd), color: 'var(--text-primary)' },
                  { label: 'WIN RATE', value: kol.winRate > 0 ? `${kol.winRate.toFixed(0)}%` : '—', color: kol.winRate >= 60 ? 'var(--signal-bull)' : 'var(--text-secondary)' },
                  { label: 'TRADES', value: kol.tradeCount > 0 ? kol.tradeCount.toLocaleString() : '—', color: 'var(--text-secondary)' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: 'var(--bg-elevated)', padding: '8px 10px' }}>
                    <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{label}</div>
                    <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.9rem', fontWeight: 700, color, marginTop: 2 }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Top holdings */}
              {kol.topHoldings.length > 0 && (
                <div>
                  <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 6 }}>TOP HOLDINGS</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {kol.topHoldings.map(h => (
                      <a key={h.address}
                        href={`https://birdeye.so/token/${h.address}?chain=solana`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: 'var(--bg-overlay)', border: '1px solid var(--border-default)', textDecoration: 'none', transition: 'border-color 120ms' }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}>
                        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.72rem', color: 'var(--text-primary)', fontWeight: 600 }}>${h.symbol}</span>
                        <span style={{ fontFamily: 'Barlow Condensed', fontSize: '0.65rem', color: 'var(--text-muted)' }}>{fmt(h.valueUsd)}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Links */}
              <div style={{ display: 'flex', gap: 10, paddingTop: 4, borderTop: '1px solid var(--border-default)' }}>
                <a href={`https://birdeye.so/profile/${kol.address}?chain=solana`} target="_blank" rel="noopener noreferrer"
                  style={{ fontFamily: 'Barlow Condensed', fontSize: '0.75rem', color: 'var(--accent-primary)', textDecoration: 'none' }}>
                  Birdeye ↗
                </a>
                <a href={`https://solscan.io/account/${kol.address}`} target="_blank" rel="noopener noreferrer"
                  style={{ fontFamily: 'Barlow Condensed', fontSize: '0.75rem', color: 'var(--accent-primary)', textDecoration: 'none' }}>
                  Solscan ↗
                </a>
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.62rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                  {kol.address.slice(0, 6)}...{kol.address.slice(-4)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // ── Ape Feed ──────────────────────────────────────────
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
          <div style={{ padding: '14px 18px', borderBottom: '2px solid var(--border-default)' }}>
            <span style={{ fontFamily: 'Bebas Neue', letterSpacing: '0.12em', color: 'var(--text-primary)' }}>
              RECENT KOL TRADES — LIVE FROM BIRDEYE
            </span>
          </div>
          {trades.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono', fontSize: '0.8rem' }}>
              NO RECENT TRADES FOUND
            </div>
          ) : trades.map((trade, i) => (
            <div key={i} style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.2rem' }}>🐦</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {trade.walletLabel}
                </span>
                <span style={{ fontFamily: 'Barlow Condensed', fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: 8 }}>
                  {trade.side === 'buy' ? 'bought' : 'sold'}
                </span>
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-primary)', marginLeft: 8 }}>
                  ${trade.tokenSymbol}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.85rem', color: trade.side === 'buy' ? 'var(--signal-bull)' : 'var(--signal-bear)', fontWeight: 700 }}>
                  {fmt(trade.amountUsd)}
                </div>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {timeAgo(trade.timestamp)}
                </div>
              </div>
              {trade.tokenAddress && (
                <a href={`https://birdeye.so/token/${trade.tokenAddress}?chain=solana`} target="_blank" rel="noopener noreferrer"
                  style={{ fontFamily: 'Barlow Condensed', fontSize: '0.75rem', color: 'var(--accent-primary)', textDecoration: 'none' }}>
                  Chart ↗
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
