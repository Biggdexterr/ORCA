'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { GraphData, GraphNode, GraphEdge, Wallet } from '@/types';
import { generateMockWallets, generateMockGraphData } from '@/lib/mockData';
import { D3WhaleGraph } from '@/components/whalemap/D3WhaleGraph';
import { WalletSidebar } from '@/components/whalemap/WalletSidebar';

export default function WhaleMapPage() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWallet, setSelectedWallet] = useState<GraphNode | null>(null);
  const [filter, setFilter] = useState<'all' | 'kol' | 'whale'>('all');

  useEffect(() => {
    async function loadGraph() {
      try {
        const key = (() => { try { const s = localStorage.getItem('orca-settings'); return s ? JSON.parse(s).birdeyeApiKey || '' : ''; } catch { return ''; } })();
      const res = await fetch('/api/graph', { headers: key ? { 'x-birdeye-key': key } : {} });
        const data = await res.json();
        setGraphData(data.data);
      } catch {
        const wallets = generateMockWallets(40);
        setGraphData(generateMockGraphData(wallets));
      } finally {
        setLoading(false);
      }
    }
    loadGraph();

    // Refresh every 60s to show new relationships
    const interval = setInterval(loadGraph, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredGraph = graphData
    ? {
        nodes: graphData.nodes.filter(n => {
          if (filter === 'kol') return n.isKOL;
          if (filter === 'whale') return n.isWhale;
          return true;
        }),
        edges: graphData.edges.filter(e => {
          const nodeIds = new Set(
            (graphData.nodes.filter(n => {
              if (filter === 'kol') return n.isKOL;
              if (filter === 'whale') return n.isWhale;
              return true;
            })).map(n => n.id)
          );
          const src = typeof e.source === 'string' ? e.source : (e.source as GraphNode).id;
          const tgt = typeof e.target === 'string' ? e.target : (e.target as GraphNode).id;
          return nodeIds.has(src) && nodeIds.has(tgt);
        }),
      }
    : null;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header Bar */}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '2px solid var(--border-default)',
          background: 'var(--bg-surface)',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          flexShrink: 0,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'Bebas Neue',
              fontSize: '1.8rem',
              letterSpacing: '0.2em',
              color: 'var(--text-primary)',
              lineHeight: 1,
            }}
          >
            WHALEMAP
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 2 }}>
            Smart money network · {graphData?.nodes.length || 0} wallets · {graphData?.edges.length || 0} relationships
          </p>
        </div>

        {/* Filter Toggle */}
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          {(['all', 'whale', 'kol'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '7px 14px',
                background: filter === f ? 'var(--accent-primary)' : 'transparent',
                color: filter === f ? 'var(--text-inverse)' : 'var(--text-secondary)',
                border: '1px solid',
                borderColor: filter === f ? 'var(--accent-primary)' : 'var(--border-default)',
                cursor: 'pointer',
                fontFamily: 'Bebas Neue',
                letterSpacing: '0.1em',
                fontSize: '0.85rem',
                transition: 'all 120ms ease',
              }}
            >
              {f === 'all' ? 'SHOW ALL' : f === 'whale' ? '🐋 WHALES ONLY' : '⭐ KOLs ONLY'}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16 }}>
          {[
            { label: 'High Win Rate', color: 'var(--signal-bull)' },
            { label: 'Low Win Rate', color: 'var(--signal-bear)' },
            { label: 'Unknown', color: 'var(--text-muted)' },
          ].map(({ label, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  background: color,
                  transform: 'rotate(45deg)',
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Graph + Sidebar */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {loading ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontFamily: 'IBM Plex Mono',
              fontSize: '0.9rem',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>◎</div>
              MAPPING WHALE NETWORK...
            </div>
          </div>
        ) : filteredGraph ? (
          <D3WhaleGraph
            data={filteredGraph}
            onNodeClick={setSelectedWallet}
            selectedNodeId={selectedWallet?.id || null}
          />
        ) : null}

        {/* Wallet Sidebar */}
        {selectedWallet && (
          <WalletSidebar
            node={selectedWallet}
            onClose={() => setSelectedWallet(null)}
          />
        )}
      </div>
    </div>
  );
}
