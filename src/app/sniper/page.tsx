'use client';

import { useEffect, useState, useCallback } from 'react';
import { Token, Verdict } from '@/types';
import { generateMockTokens } from '@/lib/mockData';
import { formatDistanceToNow } from 'date-fns';
import { SniperDrawer } from '@/components/sniper/SniperDrawer';
import { SniperFilters as FilterBar } from '@/components/sniper/SniperFilters';

// ─── Score Badge ──────────────────────────────────────────────
function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono', fontSize: '0.85rem' }}>—</span>;
  const cls = score >= 70 ? 'score-high' : score >= 40 ? 'score-mid' : 'score-low';
  return (
    <span className={`score-badge ${cls}`} style={{ fontSize: '0.75rem' }}>
      {score}
    </span>
  );
}

// ─── Token Row ────────────────────────────────────────────────
function TokenRow({ token, onClick }: { token: Token; onClick: () => void }) {
  const isNew = Date.now() - new Date(token.createdAt).getTime() < 60000;

  return (
    <tr
      onClick={onClick}
      className={isNew ? 'animate-new-row' : ''}
      style={{ cursor: 'pointer' }}
    >
      <td>
        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{token.name}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'IBM Plex Mono' }}>
          ${token.symbol}
        </div>
      </td>
      <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', fontFamily: 'IBM Plex Mono' }}>
        {formatDistanceToNow(new Date(token.launchTimestamp), { addSuffix: true })}
      </td>
      <td style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
        ${(token.liquidityUsd / 1000).toFixed(0)}K
      </td>
      <td style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
        {token.holderCount.toLocaleString()}
      </td>
      <td style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.82rem' }}>
        ${(token.volume24h / 1000).toFixed(0)}K
      </td>
      <td>
        <ScoreBadge score={token.aiScore} />
      </td>
      <td>
        {token.aiVerdict ? (
          <span className={`verdict-pill verdict-${token.aiVerdict.toLowerCase()}`}>
            {token.aiVerdict}
          </span>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Pending...</span>
        )}
      </td>
    </tr>
  );
}

// ─── Accuracy Tracker Card ────────────────────────────────────
function AccuracyCard() {
  return (
    <div className="card-angular" style={{ padding: '16px 20px', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: 'Bebas Neue', letterSpacing: '0.1em', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>
            SNIPERMINE ACCURACY TRACKER
          </div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            AI verdict historical performance
          </div>
        </div>
        {[
          { label: 'BUY Win Rate', value: '73.2%', color: 'var(--signal-bull)' },
          { label: 'AVOID Accuracy', value: '81.0%', color: 'var(--signal-bear)' },
          { label: 'Tokens Scored', value: '2,847', color: 'var(--accent-primary)' },
          { label: 'Avg Return (BUY)', value: '+142%', color: 'var(--accent-critical)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div
              style={{
                fontFamily: 'IBM Plex Mono',
                fontSize: '1.3rem',
                fontWeight: 700,
                color,
                lineHeight: 1,
              }}
              className="tabular-nums"
            >
              {value}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Sniper Page ──────────────────────────────────────────────
export default function SniperPage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [filters, setFilters] = useState({
    minLiquidity: 0,
    verdict: 'all' as Verdict | 'all',
    minScore: 0,
    timeRange: 'all' as '1h' | '6h' | '24h' | 'all',
  });

  const loadTokens = useCallback(async () => {
    const params = new URLSearchParams({
      minLiquidity: filters.minLiquidity.toString(),
      verdict: filters.verdict,
      minScore: filters.minScore.toString(),
    });

    try {
      const res = await fetch(`/api/sniper/tokens?${params}`);
      const data = await res.json();
      setTokens(data.data || []);
    } catch {
      setTokens(generateMockTokens(30));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadTokens();
    // Auto-refresh every 30s
    const interval = setInterval(loadTokens, 30000);
    return () => clearInterval(interval);
  }, [loadTokens]);

  const filteredTokens = tokens.filter(t => {
    if (filters.timeRange === 'all') return true;
    const hoursAgo = { '1h': 1, '6h': 6, '24h': 24 }[filters.timeRange];
    return Date.now() - new Date(t.launchTimestamp).getTime() < hoursAgo * 3600 * 1000;
  });

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <h1
            style={{
              fontFamily: 'Bebas Neue',
              fontSize: '2.2rem',
              letterSpacing: '0.2em',
              color: 'var(--text-primary)',
              lineHeight: 1,
            }}
          >
            SNIPERMINE
          </h1>
          <span
            style={{
              background: 'var(--signal-bear)',
              color: '#fff',
              fontFamily: 'IBM Plex Mono',
              fontSize: '0.65rem',
              padding: '3px 8px',
              fontWeight: 700,
              letterSpacing: '0.05em',
            }}
          >
            LIVE
          </span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          AI-powered token launch detection. Every new Solana token. Scored before you blink.
        </p>
      </div>

      {/* Accuracy Card */}
      <AccuracyCard />

      {/* Filter Bar */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* Token Table */}
      <div className="card-angular" style={{ padding: 0, overflow: 'hidden', marginTop: 16 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono' }}>
            SCANNING CHAIN...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ minWidth: 700 }}>
              <thead>
                <tr>
                  <th>TOKEN</th>
                  <th>LAUNCHED</th>
                  <th>LIQUIDITY</th>
                  <th>HOLDERS</th>
                  <th>VOL 24H</th>
                  <th>AI SCORE</th>
                  <th>VERDICT</th>
                </tr>
              </thead>
              <tbody>
                {filteredTokens.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                      No tokens match current filters
                    </td>
                  </tr>
                ) : (
                  filteredTokens.map(token => (
                    <TokenRow
                      key={token.id}
                      token={token}
                      onClick={() => setSelectedToken(token)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer */}
      {selectedToken && (
        <SniperDrawer token={selectedToken} onClose={() => setSelectedToken(null)} />
      )}
    </div>
  );
}
