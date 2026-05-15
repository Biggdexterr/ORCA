import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  try {
    // Use DexScreener to find top token traders — free
    const res = await fetch('https://api.dexscreener.com/token-boosts/top/v1', {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`DexScreener: ${res.status}`);
    const data = await res.json();
    const solana = (Array.isArray(data) ? data : [])
      .filter((t: any) => t.chainId === 'solana')
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      data: solana,
      source: 'dexscreener',
      meta: { count: solana.length, fetchedAt: new Date().toISOString() },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
