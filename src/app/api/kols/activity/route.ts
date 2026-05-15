import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const KOL_ADDRESSES = [
  '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
  'CakcnaRDHka2gXyfnt4lrsQmXfgsT9SKhJ2hHjSgTdyG',
  'GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE',
  '7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5',
  'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKH',
];

const KOL_LABELS: Record<string, string> = {
  '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM': 'Ansem',
  'CakcnaRDHka2gXyfnt4lrsQmXfgsT9SKhJ2hHjSgTdyG': 'Hsaka',
  'GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE': 'Cobie',
  '7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5': 'Murad',
  'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKH': 'Gainzy',
};

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get('x-birdeye-key') || process.env.BIRDEYE_API_KEY || '';
  if (!apiKey) return NextResponse.json({ success: false, error: 'API key required' });

  try {
    const allTrades: any[] = [];

    for (const address of KOL_ADDRESSES.slice(0, 3)) { // limit to 3 to avoid rate limits
      try {
        const res = await fetch(
          `https://public-api.birdeye.so/v1/wallet/tx_list?wallet=${address}&limit=10`,
          {
            headers: { 'X-API-KEY': apiKey, 'x-chain': 'solana', 'accept': 'application/json' },
            cache: 'no-store',
          }
        );
        if (!res.ok) continue;
        const data = await res.json();
        const txs = data?.data?.solana || data?.data?.items || [];

        txs
          .filter((tx: any) => tx.side === 'buy' || tx.type === 'SWAP')
          .slice(0, 5)
          .forEach((tx: any) => {
            allTrades.push({
              walletAddress: address,
              walletLabel: KOL_LABELS[address] || address.slice(0, 8),
              tokenSymbol: tx.symbol || tx.tokenSymbol || '???',
              tokenAddress: tx.tokenAddress || tx.to || '',
              amountUsd: tx.value || tx.amountUsd || 0,
              side: tx.side || 'buy',
              timestamp: tx.blockTime ? tx.blockTime * 1000 : new Date(tx.timestamp || 0).getTime(),
              txHash: tx.txHash || tx.signature || '',
            });
          });

        await new Promise(r => setTimeout(r, 300));
      } catch {}
    }

    allTrades.sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json({
      success: true,
      data: allTrades,
      source: 'birdeye_live',
      fetchedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
