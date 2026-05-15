/**
 * Wallet Auto-Discovery Engine
 * Finds top-performing wallets using Birdeye leaderboard.
 */

import { getTopGainers } from './birdeye';

export interface DiscoveredWallet {
  address: string;
  label: string;
  pnl: number;
  pnlPct: number;
  volume: number;
  winRate: number;
  tradeCount: number;
  isWhale: boolean;
  isKOL: boolean;
  discoveredAt: string;
}

function mapToDiscovered(item: any, i: number, timeframe: string): DiscoveredWallet {
  return {
    address: item.address || item.wallet || '',
    label: `Top Trader #${i + 1} (${timeframe})`,
    pnl: item.pnl || item.realizedPnl || 0,
    pnlPct: item.pnlPct || 0,
    volume: item.volume || item.volumeUsd || 0,
    winRate: item.winRate ? item.winRate * 100 : 0,
    tradeCount: item.trade || item.tradeCount || 0,
    isWhale: (item.pnl || 0) > 100_000,
    isKOL: false,
    discoveredAt: new Date().toISOString(),
  };
}

export async function fetchTopGainers(timeframe: '1D' | '7D' | '30D' = '7D', limit = 50): Promise<DiscoveredWallet[]> {
  const items = await getTopGainers(timeframe, limit);
  return items.map((item: any, i: number) => mapToDiscovered(item, i, timeframe));
}

export async function fetchTopByVolume(timeframe: '1D' | '7D' | '30D' = '7D', limit = 50): Promise<DiscoveredWallet[]> {
  // Use same endpoint, Birdeye gainers-losers supports volume sort
  const key = process.env.BIRDEYE_API_KEY;
  if (!key) throw new Error('BIRDEYE_API_KEY not set');
  const res = await fetch(
    `https://public-api.birdeye.so/trader/gainers-losers?type=${timeframe}&sort_by=volume&sort_type=desc&offset=0&limit=${limit}`,
    { headers: { 'X-API-KEY': key, 'x-chain': 'solana', 'accept': 'application/json' }, cache: 'no-store' }
  );
  if (!res.ok) throw new Error(`Birdeye volume leaders: ${res.status}`);
  const data = await res.json();
  const items = data?.data?.items || [];
  return items.map((item: any, i: number) => mapToDiscovered(item, i, timeframe));
}

export async function scoutTopWallets(limit = 50): Promise<DiscoveredWallet[]> {
  const [r7d, r1d] = await Promise.allSettled([
    fetchTopGainers('7D', limit),
    fetchTopGainers('1D', 20),
  ]);

  const all: DiscoveredWallet[] = [];
  if (r7d.status === 'fulfilled') all.push(...r7d.value);
  if (r1d.status === 'fulfilled') all.push(...r1d.value);

  const seen = new Map<string, DiscoveredWallet>();
  for (const w of all) {
    if (!w.address) continue;
    const ex = seen.get(w.address);
    if (!ex || w.pnl > ex.pnl) seen.set(w.address, w);
  }

  return Array.from(seen.values())
    .filter(w => w.pnl > 0)
    .sort((a, b) => b.pnl - a.pnl)
    .slice(0, limit);
}

export async function fetchTokenTopTraders(tokenAddress: string, timeframe = '24h', limit = 20): Promise<DiscoveredWallet[]> {
  const key = process.env.BIRDEYE_API_KEY;
  if (!key) throw new Error('BIRDEYE_API_KEY not set');
  const res = await fetch(
    `https://public-api.birdeye.so/defi/v2/tokens/top_traders?address=${tokenAddress}&time_frame=${timeframe}&sort_type=desc&sort_by=volume&offset=0&limit=${limit}`,
    { headers: { 'X-API-KEY': key, 'x-chain': 'solana', 'accept': 'application/json' }, cache: 'no-store' }
  );
  if (!res.ok) throw new Error(`Birdeye token top traders: ${res.status}`);
  const data = await res.json();
  const items = data?.data?.items || [];
  return items.map((item: any, i: number) => mapToDiscovered(item, i, timeframe));
}
