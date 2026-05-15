'use client';

import { useEffect, useState } from 'react';
import { GraphNode } from '@/types';

interface Holding {
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  valueUsd: number;
  amount: number;
  priceUsd: number;
  logoURI?: string;
}

interface Trade {
  txHash: string;
  tokenSymbol: string;
  tokenAddress: string;
  amountUsd: number;
  side: 'buy' | 'sell';
  timestamp: number;
}

interface WalletInfo {
  label: string;
  isKOL: boolean;
  isWhale: boolean;
  xHandle: string | null;
  tradeCount: number;
  totalPnlUsd: number;
  unrealizedPnlUsd: number;
  winRate: number;
  totalValueUsd: number;
  lastActive: string | null;
}

function getBirdeyeKey() {
  try {
    const s = localStorage.getItem('orca-settings');
    return s ? JSON.parse(s).birdeyeApiKey || '' : '';
  } catch { return ''; }
}

function fmt(n: number) {
  if (!n && n !== 0) return '—';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${n < 0 ? '-' : ''}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${n < 0 ? '-' : ''}$${(abs / 1_000).toFixed(0)}K`;
  return `${n < 0 ? '-' : ''}$${abs.toFixed(0)}`;
}

function timeAgo(ts: number) {
  if (!ts) return '—';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

export function WalletSidebar({ node, onClose }: { node: GraphNode; onClose: () => void }) {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setHoldings([]);
    setTrades([]);
    setWallet(null);
    setError(null);

    const key = getBirdeyeKey();
    fetch(`/api/wallets/${node.id}`, {
      headers: key ? { 'x-birdeye-key': key } : {},
    })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          setWallet(data.data.wallet);
          setHoldings(data.data.holdings || []);
          setTrades(data.data.recentTrades || []);
          setSource(data.source || '');
        } else {
          setError(data.error || 'Failed to load wallet data');
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [node.id]);

  const isLive = source === 'birdeye_live';

  return (
    <div style={{
      width: 340,
      background: 'var(--bg-elevated)',
      borderLeft: '2px solid var(--border-accent)',
      overflowY: 'auto',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border-default)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: '1.3rem', letterSpacing: '0.15em', color: 'var(--text-primary)' }}>
              {wallet?.label || node.label}
            </div>
            {wallet?.xHandle && (
              <a href={`https://x.com/${wallet.xHandle}`} target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--accent-primary)', fontSize: '0.82rem', fontFamily: 'Barlow Condensed', textDecoration: 'none' }}>
                @{wallet.xHandle}
              </a>
            )}
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem', padding: 4 }}>
            ✕
          </button>
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          {(wallet?.isKOL || node.isKOL) && (
            <span style={{ fontSize: '0.65rem', padding: '2px 8px', border: '1px solid var(--signal-watch)', color: 'var(--signal-watch)', fontFamily: 'IBM Plex Mono' }}>
              ⭐ KOL
            </span>
          )}
          {(wallet?.isWhale || node.isWhale) && (
            <span style={{ fontSize: '0.65rem', padding: '2px 8px', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', fontFamily: 'IBM Plex Mono' }}>
              🐋 WHALE
            </span>
          )}
          <span style={{
            fontSize: '0.65rem', padding: '2px 8px', border: '1px solid',
            borderColor: isLive ? 'var(--signal-bull)' : 'var(--border-default)',
            color: isLive ? 'var(--signal-bull)' : 'var(--text-muted)',
            fontFamily: 'IBM Plex Mono',
          }}>
            {isLive ? '🦅 LIVE' : source === 'no_key' ? '⚠ NO KEY' : '○ MOCK'}
          </span>
        </div>

        {/* Address */}
        <div style={{ marginTop: 10, fontSize: '0.68rem', fontFamily: 'IBM Plex Mono', color: 'var(--text-muted)', wordBreak: 'break-all', lineHeight: 1.5 }}>
          {node.address}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <a href={`https://solscan.io/account/${node.address}`} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', fontFamily: 'Barlow Condensed', textDecoration: 'none' }}>Solscan ↗</a>
          <a href={`https://birdeye.so/profile/${node.address}?chain=solana`} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', fontFamily: 'Barlow Condensed', textDecoration: 'none' }}>Birdeye ↗</a>
        </div>

        {!isLive && !loading && (
          <div style={{ marginTop: 10, padding: '6px 10px', background: 'rgba(255,150,0,0.08)', border: '1px solid var(--signal-watch)', fontSize: '0.68rem', fontFamily: 'Barlow Condensed', color: 'var(--signal-watch)' }}>
            {source === 'no_key'
              ? '⚠ Add Birdeye key in Settings for live wallet data'
              : '⚠ Live data unavailable — check API key'}
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono', fontSize: '0.78rem' }}>
          FETCHING LIVE DATA...
        </div>
      ) : error ? (
        <div style={{ padding: 20, color: 'var(--signal-bear)', fontFamily: 'IBM Plex Mono', fontSize: '0.75rem' }}>
          ⚠ {error}
        </div>
      ) : (
        <>
          {/* PnL + Stats */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-default)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'PORTFOLIO', value: fmt(wallet?.totalValueUsd || 0), color: 'var(--text-primary)' },
              { label: 'REALIZED PNL', value: wallet?.totalPnlUsd ? fmt(wallet.totalPnlUsd) : '—', color: (wallet?.totalPnlUsd || 0) >= 0 ? 'var(--signal-bull)' : 'var(--signal-bear)' },
              { label: 'WIN RATE', value: wallet?.winRate ? `${wallet.winRate.toFixed(0)}%` : '—', color: (wallet?.winRate || 0) >= 60 ? 'var(--signal-bull)' : 'var(--text-secondary)' },
              { label: 'TRADES', value: wallet?.tradeCount ? wallet.tradeCount.toLocaleString() : '—', color: 'var(--text-secondary)' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{label}</div>
                <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.95rem', fontWeight: 700, color, marginTop: 2 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Recent Trades */}
          {trades.length > 0 && (
            <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-default)' }}>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: '0.8rem', letterSpacing: '0.12em', color: 'var(--text-secondary)', marginBottom: 10 }}>
                RECENT TRADES
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {trades.slice(0, 6).map((t, i) => (
                  <a key={i}
                    href={t.tokenAddress ? `https://dexscreener.com/solana/${t.tokenAddress}` : '#'}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        fontSize: '0.62rem', fontFamily: 'IBM Plex Mono', padding: '1px 6px',
                        background: t.side === 'buy' ? 'rgba(0,255,100,0.1)' : 'rgba(255,60,60,0.1)',
                        color: t.side === 'buy' ? 'var(--signal-bull)' : 'var(--signal-bear)',
                        border: `1px solid ${t.side === 'buy' ? 'var(--signal-bull)' : 'var(--signal-bear)'}`,
                      }}>
                        {t.side.toUpperCase()}
                      </span>
                      <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                        ${t.tokenSymbol}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                        {t.amountUsd > 0 ? fmt(t.amountUsd) : '—'}
                      </div>
                      <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {timeAgo(t.timestamp)}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Holdings */}
          <div style={{ padding: '12px 18px' }}>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: '0.8rem', letterSpacing: '0.12em', color: 'var(--text-secondary)', marginBottom: 10 }}>
              PORTFOLIO {holdings.length > 0 ? `(${holdings.length} tokens)` : ''}
            </div>
            {holdings.length === 0 ? (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono' }}>
                {isLive ? 'No holdings found' : 'No data — add Birdeye key'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {holdings.map((h, i) => (
                  <a key={i}
                    href={`https://birdeye.so/token/${h.tokenAddress}?chain=solana`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none', transition: 'opacity 150ms' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                    <div>
                      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                        ${h.tokenSymbol}
                      </div>
                      <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {h.amount > 0 ? h.amount.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'} tokens
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {fmt(h.valueUsd)}
                      </div>
                      <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.65rem', color: 'var(--accent-primary)' }}>
                        Chart ↗
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
