import { NextRequest, NextResponse } from 'next/server';
import { generateMockWallets, generateMockGraphData } from '@/lib/mockData';

export const dynamic = 'force-dynamic';

const TRACKED_WALLETS = [
  { address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', label: 'Ansem', isKOL: true },
  { address: 'CakcnaRDHka2gXyfnt4lrsQmXfgsT9SKhJ2hHjSgTdyG', label: 'Hsaka', isKOL: true },
  { address: 'GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE', label: 'Cobie', isKOL: true },
  { address: '7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5', label: 'Murad', isKOL: true },
  { address: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKH', label: 'Gainzy', isKOL: false },
  { address: 'HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC', label: 'Airdrop Detective', isKOL: true },
  { address: '3FHpkMTQ3QyAJoLoXVdBpH4TfHiehnL2kXmv9UcTkT8T', label: 'Whale #1', isKOL: false },
  { address: 'BL99bfxJkV1oGKrCaGMFepgHnz5CGpDUZA3UJxVPwqDK', label: 'Whale #2', isKOL: false },
];

async function fetchWalletTxs(address: string, apiKey: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://public-api.birdeye.so/v1/wallet/tx_list?wallet=${address}&limit=20`,
      { headers: { 'X-API-KEY': apiKey, 'x-chain': 'solana', 'accept': 'application/json' }, cache: 'no-store' }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const txs = data?.data?.solana || data?.data?.items || [];
    // Return token addresses this wallet recently bought
    return txs
      .filter((tx: any) => tx.side === 'buy' || tx.type === 'SWAP')
      .map((tx: any) => tx.tokenAddress || tx.to)
      .filter(Boolean)
      .slice(0, 10);
  } catch { return []; }
}

async function fetchWalletPnL(address: string, apiKey: string) {
  try {
    const res = await fetch(
      `https://public-api.birdeye.so/wallet/v2/pnl/summary?wallet=${address}`,
      { headers: { 'X-API-KEY': apiKey, 'x-chain': 'solana', 'accept': 'application/json' }, cache: 'no-store' }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data || null;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get('x-birdeye-key') || process.env.BIRDEYE_API_KEY || '';

  if (!apiKey) {
    const mock = generateMockWallets(20);
    return NextResponse.json({ success: true, data: generateMockGraphData(mock), source: 'mock' });
  }

  try {
    // Fetch recent buys + PnL for each wallet
    const walletData: Array<{ address: string; label: string; isKOL: boolean; recentBuys: string[]; pnl: any }> = [];

    for (const w of TRACKED_WALLETS) {
      const [buys, pnl] = await Promise.allSettled([
        fetchWalletTxs(w.address, apiKey),
        fetchWalletPnL(w.address, apiKey),
      ]);

      walletData.push({
        address: w.address,
        label: w.label,
        isKOL: w.isKOL,
        recentBuys: buys.status === 'fulfilled' ? buys.value : [],
        pnl: pnl.status === 'fulfilled' ? pnl.value : null,
      });

      await new Promise(r => setTimeout(r, 250)); // rate limit
    }

    // Build graph nodes
    const nodes = walletData.map(w => ({
      id: w.address,
      address: w.address,
      label: w.label,
      isKOL: w.isKOL,
      isWhale: !w.isKOL,
      totalPnlUsd: w.pnl?.realizedPnL || 0,
      winRate: w.pnl?.winRate ? w.pnl.winRate * 100 : 0,
      tradeCount: w.pnl?.tradesCount || 0,
      lastActive: new Date().toISOString(),
    }));

    // Build edges: connect wallets that bought same token within recent history
    const edges: Array<{ source: string; target: string; copyScore: number; sharedTrades: number }> = [];
    const seen = new Set<string>();

    for (let i = 0; i < walletData.length; i++) {
      for (let j = i + 1; j < walletData.length; j++) {
        const a = walletData[i];
        const b = walletData[j];
        const shared = a.recentBuys.filter(addr => b.recentBuys.includes(addr));
        if (shared.length > 0) {
          const key = [a.address, b.address].sort().join('::');
          if (!seen.has(key)) {
            seen.add(key);
            edges.push({
              source: a.address,
              target: b.address,
              copyScore: shared.length * 10,
              sharedTrades: shared.length,
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: { nodes, edges },
      source: 'birdeye_live',
      meta: {
        walletsTracked: nodes.length,
        connectionsFound: edges.length,
        fetchedAt: new Date().toISOString(),
      }
    });

  } catch (err: any) {
    const mock = generateMockWallets(20);
    return NextResponse.json({
      success: true,
      data: generateMockGraphData(mock),
      source: 'mock_fallback',
      error: err.message,
    });
  }
}
