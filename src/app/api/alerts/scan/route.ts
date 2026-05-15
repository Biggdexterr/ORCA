/**
 * POST /api/alerts/scan
 * 
 * The scanner — call this on a schedule to generate real alerts.
 * Frontend calls this every 60s automatically.
 * 
 * Flow:
 * 1. Fetch latest Solana tokens from DexScreener
 * 2. Score each token
 * 3. If score >= 65 (BUY) and not seen before → create alert
 * 4. Send Telegram notification if bot token + chat ID provided
 */

import { NextRequest, NextResponse } from 'next/server';
import { addAlert, hasSeenToken, markTokenSeen, markTelegramSent } from '@/lib/alertStore';
import { sendTelegram, formatSniperAlert } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

function scoreToken(pair: any): number {
  let score = 0;
  const liq = pair.liquidity?.usd || 0;
  const vol = pair.volume?.h24 || 0;
  const buys = pair.txns?.h24?.buys || 0;
  const sells = pair.txns?.h24?.sells || 0;
  const change1h = pair.priceChange?.h1 || 0;

  if (liq > 500_000) score += 30;
  else if (liq > 100_000) score += 20;
  else if (liq > 50_000) score += 12;
  else if (liq > 10_000) score += 6;

  if (vol > 1_000_000) score += 20;
  else if (vol > 200_000) score += 14;
  else if (vol > 50_000) score += 8;
  else if (vol > 10_000) score += 4;

  const buyRatio = buys + sells > 0 ? buys / (buys + sells) : 0.5;
  if (buyRatio > 0.65) score += 15;
  else if (buyRatio > 0.55) score += 8;
  else if (buyRatio < 0.3) score -= 10;

  if (change1h > 15) score += 10;
  else if (change1h > 5) score += 5;
  else if (change1h < -20) score -= 10;

  const mc = pair.marketCap || pair.fdv || 0;
  if (mc > 50_000 && mc < 50_000_000) score += 10;

  return Math.max(0, Math.min(100, score));
}

export async function POST(req: NextRequest) {
  // Get Telegram credentials from header (passed from client localStorage) or env
  const telegramToken = req.headers.get('x-telegram-token') || process.env.TELEGRAM_BOT_TOKEN || '';
  const telegramChatId = req.headers.get('x-telegram-chat-id') || process.env.TELEGRAM_CHAT_ID || '';
  const minScore = parseInt(req.headers.get('x-min-score') || '65');

  try {
    // Fetch latest Solana pairs from DexScreener
    const [boostsRes, profilesRes] = await Promise.allSettled([
      fetch('https://api.dexscreener.com/token-boosts/top/v1', { cache: 'no-store' }),
      fetch('https://api.dexscreener.com/token-profiles/latest/v1', { cache: 'no-store' }),
    ]);

    const addresses = new Set<string>();
    if (boostsRes.status === 'fulfilled' && boostsRes.value.ok) {
      const data = await boostsRes.value.json();
      (Array.isArray(data) ? data : [])
        .filter((t: any) => t.chainId === 'solana' && t.tokenAddress)
        .slice(0, 25)
        .forEach((t: any) => addresses.add(t.tokenAddress));
    }
    if (profilesRes.status === 'fulfilled' && profilesRes.value.ok) {
      const data = await profilesRes.value.json();
      (Array.isArray(data) ? data : [])
        .filter((t: any) => t.chainId === 'solana' && t.tokenAddress)
        .slice(0, 25)
        .forEach((t: any) => addresses.add(t.tokenAddress));
    }

    if (addresses.size === 0) {
      return NextResponse.json({ success: false, error: 'No tokens fetched from DexScreener' });
    }

    // Fetch pair data
    const addrs = Array.from(addresses).slice(0, 30).join(',');
    const pairsRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${addrs}`, { cache: 'no-store' });
    if (!pairsRes.ok) throw new Error(`DexScreener pairs: ${pairsRes.status}`);
    const pairsData = await pairsRes.json();
    const pairs: any[] = (pairsData?.pairs || []).filter((p: any) => p.chainId === 'solana');

    // Best pair per token
    const best = new Map<string, any>();
    for (const p of pairs) {
      const addr = p.baseToken?.address;
      if (!addr) continue;
      const liq = p.liquidity?.usd || 0;
      if (!best.has(addr) || liq > (best.get(addr).liquidity?.usd || 0)) best.set(addr, p);
    }

    const newAlerts: any[] = [];
    const telegramResults: any[] = [];

    for (const [address, pair] of best) {
      // Skip if already alerted on this token
      if (hasSeenToken(address)) continue;

      const score = scoreToken(pair);
      if (score < minScore) continue;

      const verdict: 'BUY' | 'WATCH' | 'AVOID' =
        score >= 65 ? 'BUY' : score >= 40 ? 'WATCH' : 'AVOID';

      const symbol = pair.baseToken?.symbol || '???';
      const name = pair.baseToken?.name || 'Unknown';
      const liq = pair.liquidity?.usd || 0;
      const vol = pair.volume?.h24 || 0;
      const change1h = pair.priceChange?.h1 || 0;
      const change24h = pair.priceChange?.h24 || 0;
      const dexUrl = `https://dexscreener.com/solana/${address}`;

      const alert = addAlert({
        type: 'SNIPER_HIT',
        tokenAddress: address,
        tokenSymbol: symbol,
        tokenName: name,
        message: `$${symbol} scored ${score}/100 — Liq $${(liq/1000).toFixed(0)}K | Vol $${(vol/1000).toFixed(0)}K | ${change1h > 0 ? '+' : ''}${change1h.toFixed(1)}% 1h`,
        verdict,
        aiScore: score,
        liquidityUsd: liq,
        volume24h: vol,
        priceChange1h: change1h,
        priceChange24h: change24h,
        dexUrl,
        telegramSent: false,
      });

      markTokenSeen(address);
      newAlerts.push(alert);

      // Send Telegram
      if (telegramToken && telegramChatId) {
        const msg = formatSniperAlert({
          tokenSymbol: symbol,
          tokenName: name,
          verdict,
          aiScore: score,
          liquidityUsd: liq,
          volume24h: vol,
          priceChange1h: change1h,
          priceChange24h: change24h,
          dexUrl,
          tokenAddress: address,
        });

        const sent = await sendTelegram(msg, telegramToken, telegramChatId);
        if (sent) {
          markTelegramSent(alert.id);
          telegramResults.push({ symbol, sent: true });
        } else {
          telegramResults.push({ symbol, sent: false });
        }
      }
    }

    return NextResponse.json({
      success: true,
      scanned: best.size,
      newAlerts: newAlerts.length,
      telegramSent: telegramResults.filter(t => t.sent).length,
      alerts: newAlerts,
    });

  } catch (err: any) {
    console.error('[Scanner]', err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
