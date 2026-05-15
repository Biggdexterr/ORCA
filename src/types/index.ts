// ============================================================
// ORCA — Core Type Definitions
// ============================================================

export type Verdict = 'BUY' | 'AVOID' | 'WATCH';
export type TradeStatus = 'HOLDING' | 'SOLD';
export type AlertType = 'SNIPER_HIT' | 'WHALE_BUY' | 'KOL_APE';
export type Chain = 'solana' | 'ethereum' | 'base';

// ─── Token ───────────────────────────────────────────────────
export interface Token {
  id: string;
  address: string;
  name: string;
  symbol: string;
  chain: Chain;
  launchTimestamp: string;
  liquidityUsd: number;
  marketCapUsd: number;
  devWalletPercent: number;
  holderCount: number;
  top10HolderPercent: number;
  volume24h: number;
  priceUsd: number;
  socialScore: number;
  aiVerdict: Verdict | null;
  aiScore: number | null;
  aiReasoning: string | null;
  catalysts: string[];
  riskFlags: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Wallet ──────────────────────────────────────────────────
export interface Wallet {
  id: string;
  address: string;
  label: string;
  xHandle: string | null;
  xProfileUrl: string | null;
  avatarUrl: string | null;
  isKOL: boolean;
  isWhale: boolean;
  totalPnlUsd: number;
  winRate: number;
  tradeCount: number;
  lastActive: string | null;
  createdAt: string;
  holdings?: WalletToken[];
}

// ─── WalletToken ─────────────────────────────────────────────
export interface WalletToken {
  id: string;
  walletId: string;
  tokenAddress: string;
  buyTimestamp: string;
  buyPriceUsd: number;
  currentPriceUsd: number;
  pnlPercent: number;
  amountUsd: number;
  status: TradeStatus;
  token?: Token;
}

// ─── WalletRelationship ──────────────────────────────────────
export interface WalletRelationship {
  id: string;
  followerId: string;
  leaderId: string;
  copyScore: number;
  sharedTrades: number;
  createdAt: string;
  follower?: Wallet;
  leader?: Wallet;
}

// ─── Alert ───────────────────────────────────────────────────
export interface Alert {
  id: string;
  type: AlertType;
  tokenAddress: string | null;
  walletAddress: string | null;
  message: string;
  telegramSent: boolean;
  verdict: Verdict | null;
  createdAt: string;
  token?: Token;
  wallet?: Wallet;
}

// ─── AI Analysis ─────────────────────────────────────────────
export interface AIAnalysis {
  verdict: Verdict;
  score: number;
  reasoning: string[];
  riskFlags: string[];
  catalysts: string[];
}

// ─── D3 Graph ────────────────────────────────────────────────
export interface GraphNode {
  id: string;
  address: string;
  label: string;
  xHandle: string | null;
  avatarUrl: string | null;
  isKOL: boolean;
  isWhale: boolean;
  totalPnlUsd: number;
  winRate: number;
  tradeCount: number;
  // D3 simulation properties (added by force simulation)
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphEdge {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  copyScore: number;
  sharedTrades: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ─── Dashboard Stats ─────────────────────────────────────────
export interface DashboardStats {
  tokensScanned24h: number;
  buySignals24h: number;
  whaleMoves24h: number;
  kolApes24h: number;
  aiAccuracyRate: number;
  activeWhales: number;
  alertsSent24h: number;
}

// ─── API Responses ───────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── Birdeye API Types ───────────────────────────────────────
export interface BirdeyeToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  liquidity: number;
  mc: number;
  v24hUSD: number;
  price: number;
}

export interface BirdeyeNewToken {
  address: string;
  name: string;
  symbol: string;
  liquidityUsd: number;
  holderCount: number;
  createdAt: number;
}

// ─── DexScreener Types ───────────────────────────────────────
export interface DexScreenerPair {
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken: { address: string; name: string; symbol: string };
  quoteToken: { address: string; name: string; symbol: string };
  priceUsd: string;
  liquidity: { usd: number };
  volume: { h24: number };
  txns: { h24: { buys: number; sells: number } };
  priceChange: { h1: number; h24: number };
  marketCap: number;
  fdv: number;
  pairCreatedAt: number;
}

// ─── WebSocket Events ────────────────────────────────────────
export type WSEventType =
  | 'NEW_TOKEN'
  | 'TOKEN_UPDATED'
  | 'WHALE_BUY'
  | 'KOL_APE'
  | 'ALERT'
  | 'GRAPH_UPDATE'
  | 'STATS_UPDATE';

export interface WSEvent<T = unknown> {
  type: WSEventType;
  data: T;
  timestamp: string;
}

// ─── Filter Types ────────────────────────────────────────────
export interface SniperFilters {
  minLiquidity: number;
  verdicts: Verdict[];
  minScore: number;
  timeRange: '1h' | '6h' | '24h' | 'all';
}

export interface WhaleMapFilters {
  showKOLs: boolean;
  showWhales: boolean;
  minCopyScore: number;
}

export interface KOLFilters {
  minWinRate: number;
  minPnl: number;
  activeOnly: boolean;
}
