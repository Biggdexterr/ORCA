const BASE = 'https://public-api.birdeye.so';

function headers() {
  const key = process.env.BIRDEYE_API_KEY;
  if (!key) throw new Error('BIRDEYE_API_KEY is not set');
  return {
    'X-API-KEY': key,
    'x-chain': 'solana',
    'accept': 'application/json',
  };
}

async function get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString(), { headers: headers(), cache: 'no-store' });
  if (res.status === 429) throw new Error('RATE_LIMITED');
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Birdeye ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

// Wait helper for retries
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

async function getWithRetry<T>(path: string, params?: Record<string, string | number>, retries = 2): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await get<T>(path, params);
    } catch (e: any) {
      if (e.message === 'RATE_LIMITED' && i < retries) {
        await wait(2000 * (i + 1)); // 2s, 4s backoff
        continue;
      }
      throw e;
    }
  }
  throw new Error('Max retries exceeded');
}

// ─── New token listings ───────────────────────────────────────
export async function getNewListings(limit = 50) {
  const data = await getWithRetry<any>('/defi/token_new_listing', {
    limit,
    offset: 0,
    time_to: Math.floor(Date.now() / 1000),
  });
  return data?.data?.items || [];
}

// ─── Trending tokens — correct sort_by values for Birdeye ────
export async function getTrendingTokens(limit = 50) {
  // Birdeye accepts: rank, volume24hUSD, liquidity (NOT v24hUSD for this endpoint)
  const data = await getWithRetry<any>('/defi/token_trending', {
    sort_by: 'rank',
    sort_type: 'asc',
    offset: 0,
    limit,
  });
  return data?.data?.tokens || data?.data?.items || data?.data || [];
}

// ─── Token overview ───────────────────────────────────────────
export async function getTokenOverview(address: string) {
  const data = await getWithRetry<any>('/defi/token_overview', { address });
  return data?.data || null;
}

// ─── Token security ───────────────────────────────────────────
export async function getTokenSecurity(address: string) {
  const data = await getWithRetry<any>('/defi/token_security', { address });
  return data?.data || null;
}

// ─── Wallet transactions ──────────────────────────────────────
export async function getWalletTransactions(walletAddress: string, limit = 50) {
  const data = await getWithRetry<any>('/v1/wallet/tx_list', { wallet: walletAddress, limit });
  return data?.data?.solana || data?.data?.items || [];
}

// ─── Wallet portfolio ─────────────────────────────────────────
export async function getWalletPortfolio(walletAddress: string) {
  const data = await getWithRetry<any>('/v1/wallet/token_list', { wallet: walletAddress });
  return data?.data?.items || [];
}

// ─── Top gainers leaderboard ──────────────────────────────────
export async function getTopGainers(timeframe: '1D' | '7D' | '30D' = '7D', limit = 50) {
  const data = await getWithRetry<any>('/trader/gainers-losers', {
    type: timeframe,
    sort_by: 'PnL',
    sort_type: 'desc',
    offset: 0,
    limit,
  });
  return data?.data?.items || [];
}

// ─── Top traders for a token ──────────────────────────────────
export async function getTokenTopTraders(tokenAddress: string, timeframe = '24h', limit = 20) {
  const data = await getWithRetry<any>('/defi/v2/tokens/top_traders', {
    address: tokenAddress,
    time_frame: timeframe,
    sort_type: 'desc',
    sort_by: 'volume',
    offset: 0,
    limit,
  });
  return data?.data?.items || [];
}

export function getBirdeyeClient() {
  return { getTokenOverview, getNewListings, getTrendingTokens, getWalletTransactions, getWalletPortfolio, getTokenSecurity, getTopGainers };
}
