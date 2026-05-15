import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function test(label: string, url: string, extraHeaders?: Record<string, string>) {
  try {
    const res = await fetch(url, {
      headers: { 'accept': 'application/json', ...extraHeaders },
      cache: 'no-store',
    });
    const json = await res.json().catch(() => ({}));
    const items = json?.pairs || json?.data?.items || json?.data?.tokens || (Array.isArray(json) ? json : []);
    const first = Array.isArray(items) && items[0];
    return {
      label, status: res.status, ok: res.ok,
      count: Array.isArray(items) ? items.length : 0,
      message: json?.message || null,
      sample: first ? { name: first.baseToken?.name || first.name || first.tokenAddress, symbol: first.baseToken?.symbol || first.symbol } : null,
    };
  } catch (e: any) {
    return { label, error: e.message };
  }
}

export async function GET() {
  const apiKey = process.env.BIRDEYE_API_KEY || '';
  const birdeyeHeaders = { 'X-API-KEY': apiKey, 'x-chain': 'solana' };

  const results = await Promise.all([
    test('DexScreener Latest Profiles', 'https://api.dexscreener.com/token-profiles/latest/v1'),
    test('DexScreener Top Boosts', 'https://api.dexscreener.com/token-boosts/top/v1'),
    test('DexScreener Solana Pairs', 'https://api.dexscreener.com/latest/dex/pairs/solana/7qbRF6YsyGuLUVs6Y1q64bdVrfe4ZcV3bMXjo1khvdGa'),
    ...(apiKey ? [
      test('Birdeye Token Overview (SOL)', 'https://public-api.birdeye.so/defi/token_overview?address=So11111111111111111111111111111111111111112', birdeyeHeaders),
      test('Birdeye Trending', 'https://public-api.birdeye.so/defi/token_trending?sort_by=rank&sort_type=asc&limit=3', birdeyeHeaders),
    ] : []),
  ]);

  return NextResponse.json({ apiKeySet: Boolean(apiKey), results });
}
