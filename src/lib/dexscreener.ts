/**
 * DexScreener API Client — free, no key needed
 * Used as fallback when Birdeye is unavailable
 */

const BASE = 'https://api.dexscreener.com';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'accept': 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`DexScreener ${path} → ${res.status}`);
  return res.json();
}

export async function getLatestSolanaPairs() {
  const data = await get<any>('/token-profiles/latest/v1');
  // Filter Solana only
  return (data || []).filter((p: any) => p.chainId === 'solana').slice(0, 50);
}

export async function getTokenPairs(tokenAddress: string) {
  const data = await get<any>(`/latest/dex/tokens/${tokenAddress}`);
  return data?.pairs || [];
}

export async function searchTokens(query: string) {
  const data = await get<any>(`/latest/dex/search?q=${encodeURIComponent(query)}`);
  return data?.pairs || [];
}
