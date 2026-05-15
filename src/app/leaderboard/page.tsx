'use client';

import { useState, useEffect } from 'react';

interface TopToken {
  tokenAddress: string;
  description?: string;
  icon?: string;
  name?: string;
  symbol?: string;
  links?: { type: string; url: string }[];
  // From pairs fetch
  priceUsd?: string;
  liquidityUsd?: number;
  volume24h?: number;
  priceChange24h?: number;
  marketCap?: number;
}

export default function LeaderboardPage() {
  const [tokens, setTokens] = useState<TopToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchLeaderboard(); }, []);

  async function fetchLeaderboard() {
    setLoading(true);
    setError(null);
    try {
      // Fetch top boosted tokens on Solana from DexScreener (free)
      const [boostsRes, profilesRes] = await Promise.allSettled([
        fetch('https://api.dexscreener.com/token-boosts/top/v1'),
        fetch('https://api.dexscreener.com/token-profiles/latest/v1'),
      ]);

      const seen = new Set<string>();
      const all: TopToken[] = [];

      if (boostsRes.status === 'fulfilled' && boostsRes.value.ok) {
        const data = await boostsRes.value.json();
        (Array.isArray(data) ? data : [])
          .filter((t: any) => t.chainId === 'solana' && t.tokenAddress)
          .forEach((t: any) => {
            if (!seen.has(t.tokenAddress)) {
              seen.add(t.tokenAddress);
              all.push(t);
            }
          });
      }

      if (profilesRes.status === 'fulfilled' && profilesRes.value.ok) {
        const data = await profilesRes.value.json();
        (Array.isArray(data) ? data : [])
          .filter((t: any) => t.chainId === 'solana' && t.tokenAddress)
          .forEach((t: any) => {
            if (!seen.has(t.tokenAddress)) {
              seen.add(t.tokenAddress);
              all.push(t);
            }
          });
      }

      if (all.length === 0) throw new Error('No tokens returned from DexScreener');

      // Enrich with pair data (volume, liquidity, price)
      const addresses = all.slice(0, 30).map(t => t.tokenAddress).join(',');
      const pairsRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${addresses}`);
      const pairsData = pairsRes.ok ? await pairsRes.json() : { pairs: [] };
      const pairs: any[] = pairsData?.pairs || [];

      // Best pair per token
      const bestPair = new Map<string, any>();
      for (const p of pairs) {
        if (p.chainId !== 'solana') continue;
        const addr = p.baseToken?.address;
        if (!addr) continue;
        const liq = p.liquidity?.usd || 0;
        if (!bestPair.has(addr) || liq > (bestPair.get(addr)?.liquidity?.usd || 0)) {
          bestPair.set(addr, p);
        }
      }

      // Merge
      const enriched = all.slice(0, 50).map(t => {
        const pair = bestPair.get(t.tokenAddress);
        return {
          ...t,
          name: pair?.baseToken?.name || t.description || 'Unknown',
          symbol: pair?.baseToken?.symbol || '???',
          priceUsd: pair?.priceUsd || '0',
          liquidityUsd: pair?.liquidity?.usd || 0,
          volume24h: pair?.volume?.h24 || 0,
          priceChange24h: pair?.priceChange?.h24 || 0,
          marketCap: pair?.marketCap || pair?.fdv || 0,
        };
      });

      setTokens(enriched);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function fmt(n: number) {
    if (!n) return '—';
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 style={{ fontFamily: 'Bebas Neue', fontSize: '2rem', letterSpacing: '0.2em', color: 'var(--text-primary)' }}>
            TRENDING ON SOLANA
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontFamily: 'Barlow Condensed', marginTop: 4 }}>
            Top boosted & trending Solana tokens — live from DexScreener
          </p>
        </div>
        <button onClick={fetchLeaderboard}
          style={{ fontFamily: 'Bebas Neue', letterSpacing: '0.1em', padding: '8px 20px', background: 'var(--accent-primary)', color: 'var(--text-inverse)', border: 'none', cursor: 'pointer', fontSize: '0.95rem' }}>
          ↻ REFRESH
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(255,60,60,0.1)', border: '1px solid var(--signal-bear)', color: 'var(--signal-bear)', fontFamily: 'IBM Plex Mono', fontSize: '0.8rem' }}>
          ⚠ {error}
        </div>
      )}

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', fontFamily: 'IBM Plex Mono', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            FETCHING LIVE DATA FROM DEXSCREENER...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-default)' }}>
                  {['#', 'TOKEN', 'PRICE', 'LIQUIDITY', 'VOLUME 24H', '24H %', 'LINKS'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontFamily: 'Barlow Condensed', fontSize: '0.75rem', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tokens.map((w, i) => (
                  <tr key={w.tokenAddress || i}
                    style={{ borderBottom: '1px solid var(--border-default)', transition: 'background 120ms', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-overlay)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '10px 14px', fontFamily: 'IBM Plex Mono', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {i + 1}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                        ${w.symbol || '???'}
                      </div>
                      <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {w.name || w.tokenAddress?.slice(0, 12) || '—'}
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'IBM Plex Mono', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                      {w.priceUsd && parseFloat(w.priceUsd) > 0 ? `$${parseFloat(w.priceUsd).toFixed(6)}` : '—'}
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'IBM Plex Mono', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                      {fmt(w.liquidityUsd || 0)}
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'IBM Plex Mono', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                      {fmt(w.volume24h || 0)}
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'IBM Plex Mono', fontSize: '0.82rem' }}>
                      <span style={{ color: (w.priceChange24h || 0) >= 0 ? 'var(--signal-bull)' : 'var(--signal-bear)' }}>
                        {w.priceChange24h !== undefined && w.priceChange24h !== 0
                          ? `${w.priceChange24h > 0 ? '+' : ''}${w.priceChange24h.toFixed(1)}%`
                          : '—'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <a href={`https://dexscreener.com/solana/${w.tokenAddress}`} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', fontFamily: 'Barlow Condensed' }}>
                          Chart ↗
                        </a>
                        <a href={`https://solscan.io/token/${w.tokenAddress}`} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', fontFamily: 'Barlow Condensed' }}>
                          Solscan ↗
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tokens.length === 0 && !loading && (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono', fontSize: '0.8rem' }}>
                NO TOKENS FOUND
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
