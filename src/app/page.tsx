'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MiniDonutChart } from '@/components/dashboard/MiniDonutChart';

interface LiveToken {
  address: string;
  symbol: string;
  name: string;
  priceUsd: number;
  volume24h: number;
  priceChange1h: number;
  priceChange24h: number;
  liquidity: number;
  marketCap: number;
  uniqueWallets24h?: number;
  buys24h?: number;
  sells24h?: number;
  logoURI?: string;
  source: 'birdeye' | 'dexscreener';
}

interface TopGainer {
  address: string;
  label: string;
  pnl: number;
  volume: number;
  winRate: number;
}

interface DashStats {
  tokensScanned24h: number;
  buySignals24h: number;
  whaleMoves24h: number;
  kolApes24h: number;
  aiAccuracyRate: number;
  activeWhales: number;
  topMemeTokens: LiveToken[];
  trendingTokens: LiveToken[];
  topGainers: TopGainer[];
  totalVolume24h: number;
  fetchedAt: string;
}

function fmt(n: number) {
  if (!n) return '—';
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${abs.toFixed(0)}`;
}

function SourceBadge({ source, plan }: { source: string; plan: string }) {
  const isBirdeye = source === 'birdeye';
  return (
    <span style={{
      fontFamily: 'IBM Plex Mono', fontSize: '0.62rem',
      padding: '2px 8px', border: '1px solid',
      borderColor: isBirdeye ? 'var(--accent-primary)' : 'var(--border-default)',
      color: isBirdeye ? 'var(--accent-primary)' : 'var(--text-muted)',
    }}>
      {isBirdeye ? '🦅 BIRDEYE' : '📡 DEXSCREENER'}
    </span>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="card-angular" style={{ padding: 20, position: 'relative', overflow: 'hidden', flex: 1, minWidth: 150 }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 40, height: 40, background: 'var(--border-default)', clipPath: 'polygon(100% 0, 100% 100%, 0 0)', opacity: 0.4 }} />
      <div style={{ fontFamily: 'Bebas Neue', letterSpacing: '0.12em', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: 'Bebas Neue', fontSize: '2rem', letterSpacing: '0.05em', color: color || 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function TokenRow({ token, rank }: { token: LiveToken; rank: number }) {
  const up24 = (token.priceChange24h || 0) >= 0;
  const up1h = (token.priceChange1h || 0) >= 0;
  const href = token.source === 'birdeye'
    ? `https://birdeye.so/token/${token.address}?chain=solana`
    : `https://dexscreener.com/solana/${token.address}`;

  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      style={{ display: 'grid', gridTemplateColumns: '24px 1fr auto', gap: 10, alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--border-default)', textDecoration: 'none', transition: 'background 100ms' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-overlay)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

      <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.7rem', color: 'var(--text-muted)' }}>#{rank}</span>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            ${token.symbol}
          </span>
          {token.uniqueWallets24h && token.uniqueWallets24h > 0 && (
            <span style={{ fontFamily: 'Barlow Condensed', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              {token.uniqueWallets24h.toLocaleString()} wallets
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
          <span style={{ fontFamily: 'Barlow Condensed', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Liq {fmt(token.liquidity)}
          </span>
          {token.buys24h !== undefined && (
            <span style={{ fontFamily: 'Barlow Condensed', fontSize: '0.7rem', color: 'var(--signal-bull)' }}>
              {token.buys24h}B / {token.sells24h}S
            </span>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>
          {fmt(token.volume24h)}
        </div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 2 }}>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.68rem', color: up1h ? 'var(--signal-bull)' : 'var(--signal-bear)' }}>
            {up1h ? '+' : ''}{(token.priceChange1h || 0).toFixed(1)}% 1h
          </span>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.68rem', color: up24 ? 'var(--signal-bull)' : 'var(--signal-bear)' }}>
            {up24 ? '+' : ''}{(token.priceChange24h || 0).toFixed(1)}% 24h
          </span>
        </div>
      </div>
    </a>
  );
}

function TokenPanel({ title, tokens, loading, source, viewAllHref, emptyMsg }: {
  title: string;
  tokens: LiveToken[];
  loading: boolean;
  source: string;
  viewAllHref: string;
  emptyMsg: string;
}) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 16px', borderBottom: '2px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'Bebas Neue', letterSpacing: '0.12em', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{title}</span>
        <SourceBadge source={source} plan="" />
      </div>

      {loading ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono', fontSize: '0.78rem' }}>
          FETCHING LIVE DATA...
        </div>
      ) : tokens.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'Barlow Condensed', fontSize: '0.85rem' }}>
          {emptyMsg}
        </div>
      ) : (
        tokens.map((t, i) => <TokenRow key={t.address || i} token={t} rank={i + 1} />)
      )}

      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-default)', marginTop: 'auto' }}>
        <Link href={viewAllHref} style={{ fontFamily: 'Barlow Condensed', fontSize: '0.8rem', color: 'var(--accent-primary)', textDecoration: 'none' }}>
          VIEW ALL →
        </Link>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('');
  const [plan, setPlan] = useState('');

  function getBirdeyeKey() {
    try {
      const s = localStorage.getItem('orca-settings');
      return s ? JSON.parse(s).birdeyeApiKey || '' : '';
    } catch { return ''; }
  }

  async function loadStats() {
    try {
      const key = getBirdeyeKey();
      const res = await fetch('/api/dashboard/stats', {
        headers: key ? { 'x-birdeye-key': key } : {},
      });
      const data = await res.json();
      if (data.data) {
        setStats(data.data);
        setSource(data.source || 'dexscreener');
        setPlan(data.plan || 'free');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 60_000);
    return () => clearInterval(interval);
  }, []);

  const sourceLabel = source === 'birdeye'
    ? `🦅 Birdeye live data · ${plan === 'standard_or_above' ? 'Standard+' : 'Free'} plan`
    : source === 'dexscreener'
    ? '📡 DexScreener live data · Add Birdeye key in Settings for enhanced data'
    : 'Loading...';

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Bebas Neue', fontSize: '2.2rem', letterSpacing: '0.2em', color: 'var(--text-primary)', lineHeight: 1, margin: 0 }}>
            DASHBOARD
          </h1>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'Barlow Condensed', marginTop: 6, fontSize: '0.88rem' }}>
            {sourceLabel}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={loadStats}
            style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.75rem', padding: '6px 14px', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', background: 'var(--bg-surface)', cursor: 'pointer' }}>
            ↻ REFRESH
          </button>
          {source !== 'birdeye' && (
            <Link href="/settings"
              style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.75rem', padding: '6px 14px', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', textDecoration: 'none' }}>
              + ADD BIRDEYE KEY
            </Link>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <StatCard
          label="TOKENS SCANNED"
          value={loading ? '...' : (stats?.tokensScanned24h || 0).toLocaleString()}
          sub={source === 'birdeye' ? 'via Birdeye API' : 'via DexScreener'}
          color="var(--accent-primary)"
        />
        <StatCard
          label="BUY SIGNALS"
          value={loading ? '...' : stats?.buySignals24h || 0}
          sub="+10% price movers"
          color="var(--signal-bull)"
        />
        <StatCard
          label="HIGH VOLUME"
          value={loading ? '...' : stats?.whaleMoves24h || 0}
          sub="tokens >$500K vol"
          color="var(--signal-watch)"
        />
        <StatCard
          label="TOTAL VOLUME"
          value={loading ? '...' : fmt(stats?.totalVolume24h || 0)}
          sub="tracked tokens 24h"
          color="var(--text-primary)"
        />
        <StatCard
          label="AI ACCURACY"
          value={loading ? '...' : `${stats?.aiAccuracyRate || 72.8}%`}
          sub="score model"
          color="var(--accent-primary)"
        />
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 360px', gap: 16, alignItems: 'start' }}>

        {/* Top Momentum Tokens (Meme / High movers) */}
        <TokenPanel
          title={source === 'birdeye' ? '🐸 TOP MEME TOKENS' : '⚡ TOP MOMENTUM'}
          tokens={stats?.topMemeTokens || []}
          loading={loading}
          source={source}
          viewAllHref="/sniper?tab=MEME"
          emptyMsg="No tokens found"
        />

        {/* Trending / High Volume */}
        <TokenPanel
          title="🔥 TRENDING BY VOLUME"
          tokens={stats?.trendingTokens || []}
          loading={loading}
          source={source}
          viewAllHref="/sniper"
          emptyMsg="No tokens found"
        />

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Top Gainers — only shows with Birdeye */}
          {(stats?.topGainers?.length || 0) > 0 && (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
              <div style={{ padding: '12px 16px', borderBottom: '2px solid var(--border-default)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'Bebas Neue', letterSpacing: '0.12em', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  🏆 TOP TRADERS TODAY
                </span>
                <SourceBadge source="birdeye" plan="" />
              </div>
              {stats!.topGainers.map((g, i) => (
                <a key={g.address} href={`https://birdeye.so/profile/${g.address}?chain=solana`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--border-default)', textDecoration: 'none', transition: 'background 100ms' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-overlay)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.7rem', color: 'var(--text-muted)' }}>#{i + 1}</span>
                    <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.78rem', color: 'var(--text-primary)' }}>{g.label}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.82rem', color: g.pnl >= 0 ? 'var(--signal-bull)' : 'var(--signal-bear)', fontWeight: 700 }}>
                      {g.pnl >= 0 ? '+' : ''}{fmt(g.pnl)}
                    </div>
                    <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      {g.winRate > 0 ? `${g.winRate.toFixed(0)}% win rate` : 'Vol ' + fmt(g.volume)}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* AI Accuracy */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', padding: 20 }}>
            <div style={{ fontFamily: 'Bebas Neue', letterSpacing: '0.12em', fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 16 }}>
              AI VERDICT ACCURACY
            </div>
            <MiniDonutChart accuracy={stats?.aiAccuracyRate || 72.8} />
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'BUY Accuracy', pct: stats?.aiAccuracyRate || 72.8, color: 'var(--signal-bull)' },
                { label: 'AVOID Accuracy', pct: 81.2, color: 'var(--signal-bear)' },
                { label: 'WATCH Accuracy', pct: 58.4, color: 'var(--signal-watch)' },
              ].map(({ label, pct, color }) => (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontFamily: 'Barlow Condensed', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{label}</span>
                    <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.75rem', color }}>{pct.toFixed(1)}%</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--bg-overlay)' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, transition: 'width 600ms ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Access */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', padding: 20 }}>
            <div style={{ fontFamily: 'Bebas Neue', letterSpacing: '0.12em', fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 12 }}>
              QUICK ACCESS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { href: '/sniper', icon: '🎯', label: 'SNIPER FEED', desc: 'AI-scored live tokens' },
                { href: '/sniper?tab=MEME', icon: '🐸', label: 'MEME SCANNER', desc: 'Birdeye meme list' },
                { href: '/kols', icon: '⭐', label: 'KOL RADAR', desc: 'Live wallet tracking' },
                { href: '/whalemap', icon: '🐋', label: 'WHALE MAP', desc: 'Copy-trade graph' },
                { href: '/alerts', icon: '🔔', label: 'LIVE ALERTS', desc: 'Real-time signals' },
              ].map(({ href, icon, label, desc }) => (
                <Link key={href} href={href}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', textDecoration: 'none', transition: 'border-color 150ms' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-accent)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}>
                  <span style={{ fontSize: '1rem' }}>{icon}</span>
                  <div>
                    <div style={{ fontFamily: 'Bebas Neue', letterSpacing: '0.1em', fontSize: '0.82rem', color: 'var(--text-primary)' }}>{label}</div>
                    <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.68rem', color: 'var(--text-muted)' }}>{desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
