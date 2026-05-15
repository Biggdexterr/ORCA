import { NextRequest, NextResponse } from 'next/server';
import { generateMockTokens } from '@/lib/mockData';

export const dynamic = 'force-dynamic';

// ─── Score a token from on-chain metrics ─────────────────────
function scoreToken(token: any) {
  let score = 0;

  const liq = token.liquidity?.usd || token.liquidityUsd || token.liquidity || 0;
  if (liq > 500_000) score += 30;
  else if (liq > 100_000) score += 20;
  else if (liq > 50_000) score += 12;
  else if (liq > 10_000) score += 6;

  const vol = token.volume?.h24 || token.volume24h || token.v24hUSD || 0;
  if (vol > 1_000_000) score += 20;
  else if (vol > 200_000) score += 14;
  else if (vol > 50_000) score += 8;
  else if (vol > 10_000) score += 4;

  const buys = token.txns?.h24?.buys || 0;
  const sells = token.txns?.h24?.sells || 0;
  const buyRatio = buys + sells > 0 ? buys / (buys + sells) : 0.5;
  if (buyRatio > 0.6) score += 15;
  else if (buyRatio > 0.5) score += 8;
  else if (buyRatio < 0.3) score -= 10;

  const mc = token.marketCap || token.fdv || 0;
  if (mc > 50_000 && mc < 50_000_000) score += 10;
  else if (mc > 10_000) score += 5;

  const priceChange1h = token.priceChange?.h1 || 0;
  const priceChange24h = token.priceChange?.h24 || 0;
  if (priceChange1h > 10) score += 10;
  else if (priceChange1h > 5) score += 5;
  else if (priceChange1h < -20) score -= 10;
  if (priceChange24h > 20) score += 5;

  const finalScore = Math.max(0, Math.min(100, score));
  const verdict: 'BUY' | 'WATCH' | 'AVOID' =
    finalScore >= 65 ? 'BUY' : finalScore >= 40 ? 'WATCH' : 'AVOID';

  return { score: finalScore, verdict };
}

function buildReasoning(token: any, score: number): string {
  const lines: string[] = [];
  const liq = token.liquidity?.usd || 0;
  const vol = token.volume?.h24 || 0;
  const buys = token.txns?.h24?.buys || 0;
  const sells = token.txns?.h24?.sells || 0;
  const change1h = token.priceChange?.h1 || 0;
  const change24h = token.priceChange?.h24 || 0;

  if (liq > 100_000) lines.push(`Strong liquidity $${(liq/1000).toFixed(0)}K`);
  else if (liq > 0) lines.push(`Low liquidity $${(liq/1000).toFixed(1)}K`);
  if (vol > 100_000) lines.push(`High volume $${(vol/1000).toFixed(0)}K/24h`);
  if (buys + sells > 0) lines.push(`${buys} buys vs ${sells} sells`);
  if (change1h !== 0) lines.push(`${change1h > 0 ? '+' : ''}${change1h.toFixed(1)}% last hour`);
  if (change24h !== 0) lines.push(`${change24h > 0 ? '+' : ''}${change24h.toFixed(1)}% last 24h`);
  return lines.join(' · ') || `Score: ${score}/100`;
}

// ─── Fetch from DexScreener — FREE, no key needed ─────────────
async function fetchDexScreener(): Promise<any[]> {
  // Get latest Solana token profiles
  const res = await fetch('https://api.dexscreener.com/token-profiles/latest/v1', {
    headers: { 'accept': 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`DexScreener profiles: ${res.status}`);
  const profiles = await res.json();

  // Filter Solana only, get top 20 addresses
  const solanaProfiles = (Array.isArray(profiles) ? profiles : [])
    .filter((p: any) => p.chainId === 'solana')
    .slice(0, 20);

  if (solanaProfiles.length === 0) throw new Error('No Solana profiles from DexScreener');

  // Fetch pair data for these tokens in one batch call
  const addresses = solanaProfiles.map((p: any) => p.tokenAddress).join(',');
  const pairsRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${addresses}`, {
    cache: 'no-store',
  });
  if (!pairsRes.ok) throw new Error(`DexScreener pairs: ${pairsRes.status}`);
  const pairsData = await pairsRes.json();
  const pairs = pairsData?.pairs || [];

  // Group by token, pick most liquid pair per token
  const byToken = new Map<string, any>();
  for (const pair of pairs) {
    if (pair.chainId !== 'solana') continue;
    const addr = pair.baseToken?.address;
    if (!addr) continue;
    const existing = byToken.get(addr);
    const liq = pair.liquidity?.usd || 0;
    if (!existing || liq > (existing.liquidity?.usd || 0)) {
      byToken.set(addr, pair);
    }
  }

  return Array.from(byToken.values());
}

// ─── Fetch boosted/trending from DexScreener ─────────────────
async function fetchDexScreenerTrending(): Promise<any[]> {
  const res = await fetch('https://api.dexscreener.com/token-boosts/top/v1', {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`DexScreener trending: ${res.status}`);
  const data = await res.json();
  const solana = (Array.isArray(data) ? data : [])
    .filter((t: any) => t.chainId === 'solana')
    .slice(0, 20);

  if (solana.length === 0) return [];

  const addresses = solana.map((t: any) => t.tokenAddress).join(',');
  const pairsRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${addresses}`, {
    cache: 'no-store',
  });
  if (!pairsRes.ok) return [];
  const pairsData = await pairsRes.json();
  return pairsData?.pairs?.filter((p: any) => p.chainId === 'solana') || [];
}

// ─── Main handler ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const minLiquidity = Number(searchParams.get('minLiquidity') || 0);
  const verdictFilter = searchParams.get('verdict') || 'all';
  const minScore = Number(searchParams.get('minScore') || 0);
  const limit = Math.min(Number(searchParams.get('limit') || 30), 50);
  const offset = Number(searchParams.get('offset') || 0);
  const feed = searchParams.get('feed') || 'new';

  try {
    // Fetch from DexScreener (free, no key needed)
    let rawPairs: any[] = [];

    try {
      const [latest, trending] = await Promise.allSettled([
        fetchDexScreener(),
        fetchDexScreenerTrending(),
      ]);

      if (latest.status === 'fulfilled') rawPairs.push(...latest.value);
      if (trending.status === 'fulfilled') rawPairs.push(...trending.value);
    } catch (e: any) {
      console.error('[Sniper] DexScreener fetch failed:', e.message);
    }

    // Deduplicate by token address
    const seen = new Set<string>();
    rawPairs = rawPairs.filter((p: any) => {
      const addr = p.baseToken?.address;
      if (!addr || seen.has(addr)) return false;
      seen.add(addr);
      return true;
    });

    if (rawPairs.length === 0) {
      throw new Error('No pairs returned from DexScreener');
    }

    console.log(`[Sniper] Got ${rawPairs.length} real Solana pairs from DexScreener`);

    // Score and shape each token
    const results = rawPairs.map((pair: any) => {
      const { score, verdict } = scoreToken(pair);
      return {
        id: pair.baseToken?.address || pair.pairAddress,
        address: pair.baseToken?.address || '',
        name: pair.baseToken?.name || 'Unknown',
        symbol: pair.baseToken?.symbol || '???',
        priceUsd: parseFloat(pair.priceUsd || '0'),
        liquidityUsd: pair.liquidity?.usd || 0,
        volume24h: pair.volume?.h24 || 0,
        marketCapUsd: pair.marketCap || pair.fdv || 0,
        holderCount: 0, // DexScreener doesn't provide this
        priceChange1h: pair.priceChange?.h1 || 0,
        priceChange24h: pair.priceChange?.h24 || 0,
        buys24h: pair.txns?.h24?.buys || 0,
        sells24h: pair.txns?.h24?.sells || 0,
        aiScore: score,
        aiVerdict: verdict,
        aiReasoning: buildReasoning(pair, score),
        pairAddress: pair.pairAddress,
        dexId: pair.dexId,
        launchTimestamp: pair.pairCreatedAt
          ? new Date(pair.pairCreatedAt).toISOString()
          : new Date().toISOString(),
        createdAt: new Date().toISOString(),
        source: 'dexscreener',
      };
    });

    // Filter
    let filtered = results.filter(t =>
      t.liquidityUsd >= minLiquidity && t.aiScore >= minScore
    );
    if (verdictFilter !== 'all') filtered = filtered.filter(t => t.aiVerdict === verdictFilter);
    filtered.sort((a, b) => b.aiScore - a.aiScore);

    return NextResponse.json({
      success: true,
      data: filtered.slice(offset, offset + limit),
      total: filtered.length,
      source: 'live_dexscreener',
      fetchedAt: new Date().toISOString(),
    });

  } catch (err: any) {
    console.error('[/api/sniper/tokens] Falling back to mock:', err.message);
    const tokens = generateMockTokens(30);
    return NextResponse.json({
      success: true,
      data: tokens.slice(offset, offset + limit),
      total: tokens.length,
      source: 'mock_fallback',
      error: err.message,
    });
  }
}
