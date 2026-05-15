import { NextRequest, NextResponse } from 'next/server';
import { fetchAllTrackedWallets, detectCopyTrades } from '@/lib/walletTracker';
import { TRACKED_WALLETS } from '@/lib/wallets';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const internalKey = process.env.INTERNAL_API_KEY;
    if (internalKey && authHeader !== `Bearer ${internalKey}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (TRACKED_WALLETS.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No wallets configured. Add addresses to src/lib/wallets.ts',
      }, { status: 400 });
    }

    if (!process.env.BIRDEYE_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'BIRDEYE_API_KEY not set in .env',
      }, { status: 400 });
    }

    console.log(`[WalletTracker] Starting poll of ${TRACKED_WALLETS.length} wallets...`);
    const start = Date.now();

    const liveWallets = await fetchAllTrackedWallets();
    const copyTrades = detectCopyTrades(liveWallets);

    const elapsed = Date.now() - start;
    console.log(`[WalletTracker] Done in ${elapsed}ms — ${liveWallets.length} wallets, ${copyTrades.length} copy trades`);

    return NextResponse.json({
      success: true,
      data: {
        walletsChecked: liveWallets.length,
        copyTradesDetected: copyTrades.length,
        copyTrades: copyTrades.slice(0, 10), // return top 10
        elapsedMs: elapsed,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/wallets/track]', error);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      walletsConfigured: TRACKED_WALLETS.length,
      hasApiKey: Boolean(process.env.BIRDEYE_API_KEY),
      wallets: TRACKED_WALLETS.map(w => ({ label: w.label, address: w.address.slice(0, 8) + '...' })),
    },
  });
}
