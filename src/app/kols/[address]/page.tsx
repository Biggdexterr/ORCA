'use client';

import { useEffect, useState } from 'react';
import { Wallet, WalletToken } from '@/types';
import { generateMockWallets, generateMockHoldings, generateMockPnLHistory } from '@/lib/mockData';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function KOLProfilePage({ params }: { params: { address: string } }) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [holdings, setHoldings] = useState<WalletToken[]>([]);
  const [pnlHistory, setPnlHistory] = useState<{ date: string; pnl: number }[]>([]);

  useEffect(() => {
    // In production, fetch by address
    const mockWallets = generateMockWallets(50).filter(w => w.isKOL);
    const found = mockWallets[0] || null;
    setWallet(found ? { ...found, address: params.address } : null);
    if (found) {
      setHoldings(generateMockHoldings(found.id, 12));
      setPnlHistory(generateMockPnLHistory(30));
    }
  }, [params.address]);

  if (!wallet) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono' }}>
        WALLET NOT FOUND
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Back */}
      <a href="/kols" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontFamily: 'Bebas Neue', letterSpacing: '0.1em', fontSize: '0.85rem', display: 'inline-block', marginBottom: 20 }}>
        ← BACK TO KOL RADAR
      </a>

      {/* Profile Header */}
      <div className="card-angular" style={{ padding: '24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div
            style={{
              width: 64,
              height: 64,
              background: 'var(--bg-elevated)',
              border: '2px solid var(--border-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              clipPath: 'polygon(12px 0%, 100% 0%, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0% 100%, 0% 12px)',
            }}
          >
            {wallet.xHandle ? wallet.xHandle[0].toUpperCase() : '?'}
          </div>
          <div>
            <h1 style={{ fontFamily: 'Bebas Neue', fontSize: '2rem', letterSpacing: '0.15em', color: 'var(--text-primary)', lineHeight: 1 }}>
              {wallet.label}
            </h1>
            {wallet.xHandle && (
              <a href={wallet.xProfileUrl || '#'} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '0.9rem' }}>
                @{wallet.xHandle}
              </a>
            )}
            <div style={{ color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono', fontSize: '0.78rem', marginTop: 4 }}>
              {wallet.address}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 20 }}>
            {[
              { label: 'Win Rate', value: `${wallet.winRate.toFixed(1)}%`, color: wallet.winRate >= 70 ? 'var(--signal-bull)' : 'var(--signal-watch)' },
              { label: 'Total PnL', value: `$${(wallet.totalPnlUsd / 1000).toFixed(0)}K`, color: wallet.totalPnlUsd >= 0 ? 'var(--signal-bull)' : 'var(--signal-bear)' },
              { label: 'Trades', value: wallet.tradeCount.toString(), color: 'var(--text-primary)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '1.4rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        {/* PnL Chart */}
        <div className="card-angular" style={{ padding: '20px' }}>
          <h2 className="section-header" style={{ marginBottom: 16 }}>PnL History (30 Days)</h2>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pnlHistory} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--border-default)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
                  tickLine={false}
                  tickFormatter={d => d.slice(5)}
                />
                <YAxis
                  tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
                  tickLine={false}
                  tickFormatter={v => `$${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-accent)',
                    fontFamily: 'IBM Plex Mono',
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                  }}
                  formatter={(v: number) => [`$${v.toLocaleString()}`, 'PnL']}
                />
                <Line
                  type="monotone"
                  dataKey="pnl"
                  stroke="var(--signal-bull)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Holdings */}
        <div className="card-angular" style={{ padding: '20px' }}>
          <h2 className="section-header" style={{ marginBottom: 14 }}>Trade History</h2>
          <div style={{ overflowY: 'auto', maxHeight: 260 }}>
            {holdings.map(h => (
              <div
                key={h.id}
                style={{
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border-default)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                    ${h.token?.symbol || h.tokenAddress.slice(0, 6)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono' }}>
                    {h.status}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontFamily: 'IBM Plex Mono',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: h.pnlPercent >= 0 ? 'var(--signal-bull)' : 'var(--signal-bear)',
                  }}>
                    {h.pnlPercent >= 0 ? '+' : ''}{h.pnlPercent.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    ${h.amountUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
