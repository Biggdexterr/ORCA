'use client';

import { Token } from '@/types';

function MetricBar({ label, value, max = 100, color = 'var(--accent-primary)' }: {
  label: string; value: number; max?: number; color?: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: '0.8rem', fontFamily: 'IBM Plex Mono', color }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
      </div>
      <div className="metric-bar-track">
        <div className="metric-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export function SniperDrawer({ token, onClose }: { token: Token; onClose: () => void }) {
  const verdictColor = {
    BUY: 'var(--signal-bull)',
    AVOID: 'var(--signal-bear)',
    WATCH: 'var(--signal-watch)',
  }[token.aiVerdict || 'WATCH'];

  return (
    <>
      {/* Overlay */}
      <div className="drawer-overlay" onClick={onClose} />

      {/* Panel */}
      <div className="drawer-panel">
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '2px solid var(--border-default)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'Bebas Neue',
                fontSize: '1.6rem',
                letterSpacing: '0.15em',
                color: 'var(--text-primary)',
                lineHeight: 1,
              }}
            >
              {token.name}
            </div>
            <div style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono', fontSize: '0.85rem', marginTop: 2 }}>
              ${token.symbol} · {token.address.slice(0, 8)}...{token.address.slice(-4)}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '6px 10px',
              fontFamily: 'IBM Plex Mono',
              fontSize: '0.8rem',
            }}
          >
            ✕ CLOSE
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Verdict Banner */}
          {token.aiVerdict && (
            <div
              style={{
                background: verdictColor,
                color: token.aiVerdict === 'BUY' ? '#000' : '#fff',
                padding: '12px 20px',
                marginBottom: 20,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontFamily: 'Bebas Neue', fontSize: '1.4rem', letterSpacing: '0.15em', lineHeight: 1 }}>
                  AI VERDICT: {token.aiVerdict}
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: 2 }}>
                  Based on {token.aiScore ? `${token.aiScore}/100` : 'N/A'} composite score
                </div>
              </div>
              <div
                style={{
                  fontFamily: 'IBM Plex Mono',
                  fontSize: '2.5rem',
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                {token.aiScore}
              </div>
            </div>
          )}

          {/* AI Reasoning */}
          {token.aiReasoning && (
            <div style={{ marginBottom: 20 }}>
              <h3 className="section-header" style={{ marginBottom: 12 }}>AI Analysis</h3>
              <div
                style={{
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border-default)',
                  padding: '14px 16px',
                  fontSize: '0.88rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                }}
              >
                {token.aiReasoning}
              </div>
            </div>
          )}

          {/* Catalysts */}
          {token.catalysts && token.catalysts.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h3 className="section-header" style={{ marginBottom: 10 }}>Catalysts</h3>
              {token.catalysts.map((c, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 10,
                    padding: '6px 0',
                    color: 'var(--signal-bull)',
                    fontSize: '0.88rem',
                    borderBottom: '1px solid var(--border-default)',
                  }}
                >
                  <span style={{ flexShrink: 0 }}>▸</span>
                  <span>{c}</span>
                </div>
              ))}
            </div>
          )}

          {/* Risk Flags */}
          {token.riskFlags && token.riskFlags.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h3 className="section-header" style={{ marginBottom: 10 }}>⚠ Risk Flags</h3>
              {token.riskFlags.map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 10,
                    padding: '6px 0',
                    color: 'var(--signal-bear)',
                    fontSize: '0.88rem',
                    borderBottom: '1px solid var(--border-default)',
                  }}
                >
                  <span style={{ flexShrink: 0 }}>!</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          )}

          {/* Metrics */}
          <div style={{ marginBottom: 24 }}>
            <h3 className="section-header" style={{ marginBottom: 14 }}>Metrics</h3>
            <MetricBar label="Liquidity (USD)" value={token.liquidityUsd} max={500000} color="var(--accent-primary)" />
            <MetricBar label="Top 10 Holder %" value={token.top10HolderPercent} max={100} color="var(--signal-watch)" />
            <MetricBar label="Dev Wallet %" value={token.devWalletPercent} max={25} color="var(--signal-bear)" />
            <MetricBar label="Social Score" value={token.socialScore} max={100} color="var(--signal-bull)" />
            <MetricBar label="Volume 24h" value={token.volume24h} max={2000000} color="var(--accent-primary)" />

            {/* Raw numbers */}
            <div
              style={{
                marginTop: 16,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
              }}
            >
              {[
                { label: 'Market Cap', value: `$${(token.marketCapUsd / 1000).toFixed(0)}K` },
                { label: 'Holders', value: token.holderCount.toLocaleString() },
                { label: 'Price', value: `$${token.priceUsd.toFixed(8)}` },
                { label: 'Chain', value: 'SOLANA' },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border-default)',
                    padding: '8px 12px',
                  }}
                >
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* External Links */}
          <div style={{ display: 'flex', gap: 10 }}>
            <a
              href={`https://dexscreener.com/solana/${token.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-angular"
              style={{ flex: 1, textDecoration: 'none', fontSize: '0.85rem' }}
            >
              <span>📊 DexScreener</span>
            </a>
            <a
              href={`https://birdeye.so/token/${token.address}?chain=solana`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-angular btn-angular-outline"
              style={{ flex: 1, textDecoration: 'none', fontSize: '0.85rem' }}
            >
              <span>🦅 Birdeye</span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
