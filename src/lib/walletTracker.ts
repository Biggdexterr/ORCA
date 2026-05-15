/**
 * Wallet Tracker Service
 * Fetches real on-chain data from Birdeye for tracked wallets
 */

import { getWalletTransactions, getWalletPortfolio } from './birdeye';
import { TRACKED_WALLETS, TrackedWallet } from './wallets';

export interface LiveWallet {
  address: string;
  label: string;
  isWhale: boolean;
  isKOL: boolean;
  xHandle?: string;
  totalPnlUsd: number;
  winRate: number;
  tradeCount: number;
  recentBuys: LiveTrade[];
  lastActive: string | null;
}

export interface LiveTrade {
  txHash: string;
  tokenAddress: string;
  tokenSymbol: string;
  amountUsd: number;
  side: 'buy' | 'sell';
  timestamp: number;
  priceUsd?: number;
}

export interface LiveHolding {
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  amount: number;
  valueUsd: number;
  priceUsd: number;
  pnlUsd?: number;
  pnlPct?: number;
}

// ─── Fetch single wallet's recent activity ────────────────────────────────

export async function fetchWalletActivity(address: string): Promise<{
  recentBuys: LiveTrade[];
  tradeCount: number;
  lastActive: string | null;
}> {
  try {
    const txs = await getWalletTransactions(address, 50);

    const trades: LiveTrade[] = txs.map((tx: any) => ({
      txHash: tx.txHash || tx.hash || '',
      tokenAddress: tx.tokenAddress || tx.to || '',
      tokenSymbol: tx.tokenSymbol || tx.symbol || '???',
      amountUsd: tx.value || tx.amountUsd || 0,
      side: (tx.side === 'sell' || tx.type === 'SELL') ? 'sell' : 'buy',
      timestamp: tx.blockTime ? tx.blockTime * 1000 : new Date(tx.timestamp || 0).getTime(),
    }));

    const recentBuys = trades
      .filter(t => t.side === 'buy')
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

    const lastActive = trades.length > 0
      ? new Date(Math.max(...trades.map(t => t.timestamp))).toISOString()
      : null;

    return { recentBuys, tradeCount: trades.length, lastActive };
  } catch (err) {
    console.error(`[WalletTracker] fetchWalletActivity error for ${address}:`, err);
    return { recentBuys: [], tradeCount: 0, lastActive: null };
  }
}

// ─── Fetch wallet portfolio (current holdings) ────────────────────────────

export async function fetchWalletPortfolio(address: string): Promise<LiveHolding[]> {
  try {
    const items = await getWalletPortfolio(address);

    return items
      .filter((item: any) => item.valueUsd > 1) // filter dust
      .map((item: any): LiveHolding => ({
        tokenAddress: item.address,
        tokenSymbol: item.symbol || '???',
        tokenName: item.name || item.symbol || 'Unknown',
        amount: item.uiAmount || 0,
        valueUsd: item.valueUsd || 0,
        priceUsd: item.priceUsd || 0,
      }))
      .sort((a: LiveHolding, b: LiveHolding) => b.valueUsd - a.valueUsd)
      .slice(0, 20);
  } catch (err) {
    console.error(`[WalletTracker] fetchWalletPortfolio error for ${address}:`, err);
    return [];
  }
}

// ─── Fetch all tracked wallets ────────────────────────────────────────────

export async function fetchAllTrackedWallets(): Promise<LiveWallet[]> {
  if (TRACKED_WALLETS.length === 0) {
    console.warn('[WalletTracker] No wallets configured in src/lib/wallets.ts');
    return [];
  }

  const results: LiveWallet[] = [];

  // Stagger requests to avoid rate limits (5 per second max on most Birdeye plans)
  for (const wallet of TRACKED_WALLETS) {
    try {
      const activity = await fetchWalletActivity(wallet.address);

      results.push({
        address: wallet.address,
        label: wallet.label,
        isWhale: wallet.isWhale,
        isKOL: wallet.isKOL,
        xHandle: wallet.xHandle,
        totalPnlUsd: 0, // Birdeye free tier doesn't give PnL directly
        winRate: 0,     // Would need historical trade analysis
        tradeCount: activity.tradeCount,
        recentBuys: activity.recentBuys,
        lastActive: activity.lastActive,
      });

      // Small delay between requests to respect rate limits
      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      console.error(`[WalletTracker] Failed for ${wallet.label}:`, err);
    }
  }

  return results;
}

// ─── Detect copy trades across tracked wallets ────────────────────────────

export interface CopyTradeSignal {
  leaderAddress: string;
  leaderLabel: string;
  followerAddress: string;
  followerLabel: string;
  tokenAddress: string;
  tokenSymbol: string;
  timeDiffSeconds: number;
  leaderAmountUsd: number;
  followerAmountUsd: number;
}

export function detectCopyTrades(
  wallets: LiveWallet[],
  windowMs = 10 * 60 * 1000 // 10 minutes
): CopyTradeSignal[] {
  const signals: CopyTradeSignal[] = [];

  // Collect all recent buys with wallet info
  const allBuys = wallets.flatMap(w =>
    w.recentBuys.map(t => ({ ...t, walletAddress: w.address, walletLabel: w.label }))
  );

  // Compare every pair
  for (let i = 0; i < allBuys.length; i++) {
    for (let j = i + 1; j < allBuys.length; j++) {
      const a = allBuys[i];
      const b = allBuys[j];

      if (
        a.walletAddress !== b.walletAddress &&
        a.tokenAddress === b.tokenAddress &&
        Math.abs(a.timestamp - b.timestamp) < windowMs
      ) {
        const [leader, follower] = a.timestamp < b.timestamp ? [a, b] : [b, a];

        signals.push({
          leaderAddress: leader.walletAddress,
          leaderLabel: leader.walletLabel,
          followerAddress: follower.walletAddress,
          followerLabel: follower.walletLabel,
          tokenAddress: a.tokenAddress,
          tokenSymbol: a.tokenSymbol,
          timeDiffSeconds: Math.abs(a.timestamp - b.timestamp) / 1000,
          leaderAmountUsd: leader.amountUsd,
          followerAmountUsd: follower.amountUsd,
        });
      }
    }
  }

  return signals;
}
