// ============================================================
// ORCA — Mock Data for Local Development
// All API calls fall back to this data when keys aren't set
// ============================================================

import { Token, Wallet, WalletToken, Alert, GraphData, DashboardStats, WalletRelationship } from '@/types';

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;
const randomInt = (min: number, max: number) => Math.floor(randomBetween(min, max));
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const SOLANA_ADDRESSES = [
  'H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG',
  '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKD',
  'BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY',
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
  'So11111111111111111111111111111111111111112',
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  'WENWENvqqNya429ubCdR81ZmD69brwQaaBYY6p3LCpk',
];

const TOKEN_NAMES = [
  { name: 'Cosmic Orca', symbol: 'CORC' },
  { name: 'Rust Protocol', symbol: 'RUST' },
  { name: 'StoneBreaker', symbol: 'SBRK' },
  { name: 'Bunker Finance', symbol: 'BUNK' },
  { name: 'Obsidian DAO', symbol: 'OBS' },
  { name: 'WarlordSOL', symbol: 'WARD' },
  { name: 'IronClaw', symbol: 'IRON' },
  { name: 'DeepShark', symbol: 'DSHK' },
  { name: 'MadWhale', symbol: 'MWHL' },
  { name: 'CopperBack', symbol: 'CPRB' },
  { name: 'Volcanic Cat', symbol: 'VOLC' },
  { name: 'Apex Sentinel', symbol: 'APEX' },
];

const WALLET_LABELS = [
  'Whale Alpha',
  'Smart Money #1',
  'Insider Bag',
  'First Mover',
  'Pump Spotter',
  'Early Exit',
  'Diamond Hands',
  'Rotator King',
  'Sniper Bot #3',
  'LP Farmer',
];

const KOL_HANDLES = [
  { handle: 'solana_whale', label: 'Solana Whale' },
  { handle: 'memecoinKing', label: 'Memecoin King' },
  { handle: 'alphaLeaks_', label: 'Alpha Leaks' },
  { handle: 'degenTrader', label: 'Degen Trader' },
  { handle: 'ctInsider', label: 'CT Insider' },
  { handle: 'rugDetector', label: 'Rug Detector' },
  { handle: 'whaleAlert_', label: 'Whale Alert' },
  { handle: 'solSniper', label: 'Sol Sniper' },
];

// ─── Generate Mock Tokens ─────────────────────────────────────
export function generateMockTokens(count = 20): Token[] {
  return Array.from({ length: count }, (_, i) => {
    const meta = TOKEN_NAMES[i % TOKEN_NAMES.length];
    const score = randomInt(10, 98);
    const verdict = score >= 70 ? 'BUY' : score >= 40 ? 'WATCH' : 'AVOID';
    const hoursAgo = randomBetween(0, 23);
    const launchTime = new Date(Date.now() - hoursAgo * 3600 * 1000);

    return {
      id: `mock-token-${i}`,
      address: SOLANA_ADDRESSES[i % SOLANA_ADDRESSES.length],
      name: meta.name,
      symbol: meta.symbol,
      chain: 'solana',
      launchTimestamp: launchTime.toISOString(),
      liquidityUsd: randomBetween(10000, 500000),
      marketCapUsd: randomBetween(50000, 5000000),
      devWalletPercent: randomBetween(1, 25),
      holderCount: randomInt(100, 5000),
      top10HolderPercent: randomBetween(20, 80),
      volume24h: randomBetween(5000, 2000000),
      priceUsd: randomBetween(0.000001, 0.01),
      socialScore: randomBetween(0, 100),
      aiVerdict: verdict as Token['aiVerdict'],
      aiScore: score,
      aiReasoning: `AI analyzed ${meta.symbol} across ${randomInt(5, 15)} metrics`,
      catalysts: [
        'Strong liquidity depth with organic volume patterns',
        `Holder count growing ${randomInt(10, 50)}% in first hour`,
        'Dev wallet under 5% — low concentration risk',
      ].slice(0, randomInt(1, 3)),
      riskFlags: [
        'High initial price impact on buys',
        'Low social engagement vs volume',
        'Sniper activity detected in first block',
      ].slice(0, verdict === 'AVOID' ? randomInt(1, 3) : randomInt(0, 2)),
      createdAt: launchTime.toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
}

// ─── Generate Mock Wallets ────────────────────────────────────
export function generateMockWallets(count = 50): Wallet[] {
  return Array.from({ length: count }, (_, i) => {
    const isKOL = i < 8;
    const kol = isKOL ? KOL_HANDLES[i] : null;
    const winRate = randomBetween(40, 92);

    return {
      id: `mock-wallet-${i}`,
      address: `${SOLANA_ADDRESSES[i % SOLANA_ADDRESSES.length]}${i}`.slice(0, 44),
      label: isKOL ? kol!.label : WALLET_LABELS[i % WALLET_LABELS.length],
      xHandle: isKOL ? kol!.handle : null,
      xProfileUrl: isKOL ? `https://twitter.com/${kol!.handle}` : null,
      avatarUrl: null,
      isKOL,
      isWhale: !isKOL && winRate > 65,
      totalPnlUsd: randomBetween(-50000, 2000000),
      winRate,
      tradeCount: randomInt(10, 500),
      lastActive: new Date(Date.now() - randomBetween(0, 48) * 3600 * 1000).toISOString(),
      createdAt: new Date(Date.now() - randomBetween(30, 365) * 86400 * 1000).toISOString(),
    };
  });
}

// ─── Generate Mock Graph Data ────────────────────────────────
export function generateMockGraphData(wallets: Wallet[]): GraphData {
  const nodes = wallets.map(w => ({
    id: w.id,
    address: w.address,
    label: w.label,
    xHandle: w.xHandle,
    avatarUrl: w.avatarUrl,
    isKOL: w.isKOL,
    isWhale: w.isWhale,
    totalPnlUsd: w.totalPnlUsd,
    winRate: w.winRate,
    tradeCount: w.tradeCount,
  }));

  // Generate realistic copy relationships
  const edges = [];
  for (let i = 0; i < Math.min(wallets.length * 2, 80); i++) {
    const from = pick(wallets);
    const to = pick(wallets.filter(w => w.id !== from.id));
    const copyScore = randomInt(30, 95);
    edges.push({
      id: `edge-${i}`,
      source: from.id,
      target: to.id,
      copyScore,
      sharedTrades: randomInt(2, 30),
    });
  }

  return { nodes, edges };
}

// ─── Generate Mock Alerts ────────────────────────────────────
export function generateMockAlerts(count = 20): Alert[] {
  const types: Alert['type'][] = ['SNIPER_HIT', 'WHALE_BUY', 'KOL_APE'];
  const verdicts: Alert['verdict'][] = ['BUY', 'AVOID', 'WATCH'];
  const tokens = generateMockTokens(5);
  const wallets = generateMockWallets(8);

  return Array.from({ length: count }, (_, i) => {
    const type = pick(types);
    const token = pick(tokens);
    const wallet = pick(wallets);
    const verdict = pick(verdicts);
    const minsAgo = randomInt(1, 120);

    let message = '';
    if (type === 'SNIPER_HIT') {
      message = `🎯 SNIPER — $${token.symbol} | Score: ${token.aiScore}/100 | Verdict: ${verdict}`;
    } else if (type === 'WHALE_BUY') {
      message = `🐋 WHALE BUY — ${wallet.label} bought $${token.symbol} | $${randomInt(10, 200)}K`;
    } else {
      message = `🐦 KOL APE — @${wallet.xHandle || wallet.label} just bought $${token.symbol}`;
    }

    return {
      id: `mock-alert-${i}`,
      type,
      tokenAddress: token.address,
      walletAddress: wallet.address,
      message,
      telegramSent: Math.random() > 0.3,
      verdict,
      createdAt: new Date(Date.now() - minsAgo * 60 * 1000).toISOString(),
      token,
      wallet,
    };
  });
}

// ─── Generate Mock Dashboard Stats ──────────────────────────
export function generateMockDashboardStats(): DashboardStats {
  return {
    tokensScanned24h: randomInt(180, 420),
    buySignals24h: randomInt(12, 45),
    whaleMoves24h: randomInt(30, 120),
    kolApes24h: randomInt(5, 25),
    aiAccuracyRate: randomBetween(62, 84),
    activeWhales: randomInt(20, 65),
    alertsSent24h: randomInt(40, 200),
  };
}

// ─── Generate Mock Wallet Tokens (Holdings) ──────────────────
export function generateMockHoldings(walletId: string, count = 5): WalletToken[] {
  const tokens = generateMockTokens(count);
  return tokens.map((token, i) => {
    const buyPrice = token.priceUsd * randomBetween(0.5, 1.5);
    const pnl = ((token.priceUsd - buyPrice) / buyPrice) * 100;
    return {
      id: `mock-holding-${walletId}-${i}`,
      walletId,
      tokenAddress: token.address,
      buyTimestamp: new Date(Date.now() - randomBetween(1, 72) * 3600 * 1000).toISOString(),
      buyPriceUsd: buyPrice,
      currentPriceUsd: token.priceUsd,
      pnlPercent: pnl,
      amountUsd: randomBetween(1000, 100000),
      status: Math.random() > 0.3 ? 'HOLDING' : 'SOLD',
      token,
    };
  });
}

// ─── PnL chart data for KOL profiles ─────────────────────────
export function generateMockPnLHistory(days = 30) {
  let pnl = 0;
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(Date.now() - (days - i) * 86400 * 1000);
    pnl += randomBetween(-15000, 40000);
    return {
      date: date.toISOString().split('T')[0],
      pnl: Math.round(pnl),
    };
  });
}
