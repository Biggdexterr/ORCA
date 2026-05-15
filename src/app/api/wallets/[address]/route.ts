import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const KOL_LABELS: Record<string, { label: string; xHandle: string | null; isKOL: boolean }> = {
  '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM': { label: 'Ansem', xHandle: 'blknoiz06', isKOL: true },
  'CakcnaRDHka2gXyfnt4lrsQmXfgsT9SKhJ2hHjSgTdyG': { label: 'Hsaka', xHandle: 'HsakaTrades', isKOL: true },
  'GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE': { label: 'Cobie', xHandle: 'cobie', isKOL: true },
  '7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5': { label: 'Murad', xHandle: 'MustStopMurad', isKOL: true },
  'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKH': { label: 'Gainzy', xHandle: 'gainzy222', isKOL: true },
  'HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC': { label: 'Airdrop Detective', xHandle: 'AirdropDetective', isKOL: true },
  '3FHpkMTQ3QyAJoLoXVdBpH4TfHiehnL2kXmv9UcTkT8T': { label: 'Whale #1', xHandle: null, isKOL: false },
  'BL99bfxJkV1oGKrCaGMFepgHnz5CGpDUZA3UJxVPwqDK': { label: 'Whale #2', xHandle: null, isKOL: false },
};

function birdeyeHeaders(apiKey: string) {
  return { 'X-API-KEY': apiKey, 'x-chain': 'solana', 'accept': 'application/json' };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { address: string } }
) {
  const { address } = params;
  const apiKey = req.headers.get('x-birdeye-key') || process.env.BIRDEYE_API_KEY || '';

  if (!address || address.length < 8) {
    return NextResponse.json({ success: false, error: 'Invalid address' }, { status: 400 });
  }

  const known = KOL_LABELS[address];

  // ── No API key: return basic wallet info only ─────────────
  if (!apiKey) {
    return NextResponse.json({
      success: true,
      source: 'no_key',
      data: {
        wallet: {
          address,
          label: known?.label || `${address.slice(0, 6)}...${address.slice(-4)}`,
          isKOL: known?.isKOL || false,
          isWhale: !known?.isKOL,
          xHandle: known?.xHandle || null,
          tradeCount: 0,
          totalPnlUsd: 0,
          winRate: 0,
          lastActive: null,
        },
        holdings: [],
        recentTrades: [],
        pnlSummary: null,
      }
    });
  }

  try {
    // ── Fetch all 3 Birdeye endpoints in parallel ─────────
    const [portfolioRes, txRes, pnlRes] = await Promise.allSettled([
      // Wallet portfolio — Premium ✅
      fetch(`https://public-api.birdeye.so/v1/wallet/token_list?wallet=${address}`, {
        headers: birdeyeHeaders(apiKey), cache: 'no-store',
      }),
      // Wallet transactions — Premium ✅
      fetch(`https://public-api.birdeye.so/v1/wallet/tx_list?wallet=${address}&limit=20`, {
        headers: birdeyeHeaders(apiKey), cache: 'no-store',
      }),
      // Wallet PnL summary — Premium ✅
      fetch(`https://public-api.birdeye.so/wallet/v2/pnl/summary?wallet=${address}`, {
        headers: birdeyeHeaders(apiKey), cache: 'no-store',
      }),
    ]);

    // ── Parse portfolio ───────────────────────────────────
    let holdings: any[] = [];
    let totalValueUsd = 0;
    if (portfolioRes.status === 'fulfilled' && portfolioRes.value.ok) {
      const portfolioData = await portfolioRes.value.json();
      const items = portfolioData?.data?.items || [];
      totalValueUsd = portfolioData?.data?.totalUsd || 0;
      holdings = items
        .filter((h: any) => (h.valueUsd || 0) > 0.01)
        .sort((a: any, b: any) => (b.valueUsd || 0) - (a.valueUsd || 0))
        .slice(0, 15)
        .map((h: any) => ({
          tokenAddress: h.address,
          tokenSymbol: h.symbol || '???',
          tokenName: h.name || h.symbol || 'Unknown',
          amount: h.uiAmount || 0,
          valueUsd: h.valueUsd || 0,
          priceUsd: h.priceUsd || 0,
          logoURI: h.logoURI || h.icon || null,
        }));
    }

    // ── Parse transactions ────────────────────────────────
    let recentTrades: any[] = [];
    let lastActive: string | null = null;
    if (txRes.status === 'fulfilled' && txRes.value.ok) {
      const txData = await txRes.value.json();
      const txs = txData?.data?.solana || txData?.data?.items || [];
      recentTrades = txs.slice(0, 10).map((tx: any) => ({
        txHash: tx.txHash || tx.signature || '',
        tokenSymbol: tx.symbol || tx.tokenSymbol || '???',
        tokenAddress: tx.tokenAddress || tx.to || '',
        amountUsd: tx.value || tx.amountUsd || 0,
        side: (tx.side === 'sell' || tx.type === 'SELL') ? 'sell' : 'buy',
        timestamp: tx.blockTime ? tx.blockTime * 1000 : new Date(tx.timestamp || 0).getTime(),
      }));
      if (recentTrades.length > 0) {
        const latest = Math.max(...recentTrades.map(t => t.timestamp));
        lastActive = new Date(latest).toISOString();
      }
    }

    // ── Parse PnL ─────────────────────────────────────────
    let pnlSummary: any = null;
    if (pnlRes.status === 'fulfilled' && pnlRes.value.ok) {
      const pnlData = await pnlRes.value.json();
      pnlSummary = pnlData?.data || null;
    }

    const totalPnlUsd = pnlSummary?.realizedPnL || pnlSummary?.pnl || 0;
    const winRate = pnlSummary?.winRate ? pnlSummary.winRate * 100 : 0;
    const tradeCount = pnlSummary?.tradesCount || recentTrades.length;

    return NextResponse.json({
      success: true,
      source: 'birdeye_live',
      data: {
        wallet: {
          address,
          label: known?.label || `${address.slice(0, 6)}...${address.slice(-4)}`,
          isKOL: known?.isKOL || false,
          isWhale: totalValueUsd > 100_000 || (!known?.isKOL),
          xHandle: known?.xHandle || null,
          totalPnlUsd,
          unrealizedPnlUsd: pnlSummary?.unrealizedPnL || 0,
          winRate,
          tradeCount,
          totalValueUsd,
          lastActive,
        },
        holdings,
        recentTrades,
        pnlSummary,
      }
    });

  } catch (err: any) {
    console.error(`[/api/wallets/${address}]`, err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
