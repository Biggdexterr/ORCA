/**
 * ORCA — Tracked Wallet Registry
 *
 * Add real whale/KOL wallet addresses here.
 * The app will track these wallets live via Birdeye.
 *
 * Sources to find alpha wallets:
 *   https://app.lookonchain.com  (top Solana traders)
 *   https://birdeye.so/leaderboard (sort by PnL)
 *   https://solscan.io/accounts   (rich list)
 *   https://intel.arkm.com        (labeled wallets)
 */

export interface TrackedWallet {
  address: string;
  label: string;
  isWhale: boolean;
  isKOL: boolean;
  xHandle?: string;
}

// ─────────────────────────────────────────────────────────────
// ADD YOUR REAL WALLET ADDRESSES HERE
// ─────────────────────────────────────────────────────────────
export const TRACKED_WALLETS: TrackedWallet[] = [
  // Example format — replace with real addresses:
  // {
  //   address: '7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5',
  //   label: 'Lookonchain Whale #1',
  //   isWhale: true,
  //   isKOL: false,
  // },
  // {
  //   address: 'GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE',
  //   label: 'CT Alpha KOL',
  //   isWhale: false,
  //   isKOL: true,
  //   xHandle: 'their_x_handle',
  // },

  // ← PASTE YOUR WALLETS BELOW THIS LINE
];

// Quick lookup by address
export const WALLET_MAP = new Map(
  TRACKED_WALLETS.map(w => [w.address, w])
);
