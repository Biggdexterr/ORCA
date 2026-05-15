import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Known KOL wallets — top Solana CT traders
// These are publicly known addresses from Lookonchain/Arkham
const KOL_REGISTRY = [
  { address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', label: 'Ansem', xHandle: 'blknoiz06' },
  { address: 'CakcnaRDHka2gXyfnt4lrsQmXfgsT9SKhJ2hHjSgTdyG', label: 'Hsaka', xHandle: 'HsakaTrades' },
  { address: 'GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE', label: 'Cobie', xHandle: 'cobie' },
  { address: '7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5', label: 'Murad', xHandle: 'MustStopMurad' },
  { address: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKH', label: 'Gainzy', xHandle: 'gainzy222' },
  { address: 'HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC', label: 'Airdrop Detective', xHandle: 'AirdropDetective' },
  { address: '3FHpkMTQ3QyAJoLoXVdBpH4TfHiehnL2kXmv9UcTkT8T', label: 'Degod Whale', xHandle: null },
  { address: 'BL99bfxJkV1oGKrCaGMFepgHnz5CGpDUZA3UJxVPwqDK', label: 'SOL Trader', xHandle: null },
];

async function fetchWalletPnL(address: string, apiKey: string) {
  const res = await fetch(
    `https://public-api.birdeye.so/wallet/v2/pnl/summary?wallet=${address}`,
    {
      headers: { 'X-API-KEY': apiKey, 'x-chain': 'solana', 'accept': 'application/json' },
      cache: 'no-store',
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data?.data || null;
}

async function fetchWalletPortfolio(address: string, apiKey: string) {
  const res = await fetch(
    `https://public-api.birdeye.so/v1/wallet/token_list?wallet=${address}`,
    {
      headers: { 'X-API-KEY': apiKey, 'x-chain': 'solana', 'accept': 'application/json' },
      cache: 'no-store',
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data?.data || null;
}

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get('x-birdeye-key') || process.env.BIRDEYE_API_KEY || '';

  if (!apiKey) {
    return NextResponse.json({ success: false, error: 'Birdeye API key required' });
  }

  try {
    // Fetch PnL summary for each KOL — rate limit: 1 req/sec, max 5/sec
    const results = [];

    for (const kol of KOL_REGISTRY) {
      try {
        const [pnl, portfolio] = await Promise.allSettled([
          fetchWalletPnL(kol.address, apiKey),
          fetchWalletPortfolio(kol.address, apiKey),
        ]);

        const pnlData = pnl.status === 'fulfilled' ? pnl.value : null;
        const portfolioData = portfolio.status === 'fulfilled' ? portfolio.value : null;

        results.push({
          address: kol.address,
          label: kol.label,
          xHandle: kol.xHandle,
          // PnL data from Birdeye
          totalPnlUsd: pnlData?.realizedPnL || pnlData?.pnl || 0,
          unrealizedPnlUsd: pnlData?.unrealizedPnL || 0,
          winRate: pnlData?.winRate ? pnlData.winRate * 100 : 0,
          tradeCount: pnlData?.tradesCount || pnlData?.numTrades || 0,
          // Portfolio from Birdeye
          totalValueUsd: portfolioData?.totalUsd || 0,
          topHoldings: (portfolioData?.items || [])
            .filter((h: any) => h.valueUsd > 0)
            .sort((a: any, b: any) => b.valueUsd - a.valueUsd)
            .slice(0, 5)
            .map((h: any) => ({
              symbol: h.symbol,
              name: h.name,
              valueUsd: h.valueUsd,
              uiAmount: h.uiAmount,
              address: h.address,
              logoURI: h.logoURI || h.icon,
            })),
          isKOL: true,
          isWhale: (portfolioData?.totalUsd || 0) > 100_000,
          lastActive: new Date().toISOString(),
          source: 'birdeye_live',
        });

        // Respect Birdeye rate limit — 5 req/sec across all wallet APIs
        await new Promise(r => setTimeout(r, 300));

      } catch (e: any) {
        console.warn(`[KOL] Failed for ${kol.label}:`, e.message);
        results.push({
          address: kol.address,
          label: kol.label,
          xHandle: kol.xHandle,
          totalPnlUsd: 0,
          unrealizedPnlUsd: 0,
          winRate: 0,
          tradeCount: 0,
          totalValueUsd: 0,
          topHoldings: [],
          isKOL: true,
          isWhale: false,
          lastActive: null,
          source: 'error',
          error: e.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      total: results.length,
      source: 'birdeye_live',
      fetchedAt: new Date().toISOString(),
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
