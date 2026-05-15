/**
 * In-memory alert store — persists for the lifetime of the Next.js server process.
 * No database needed. Alerts accumulate as the scanner runs.
 */

export interface LiveAlert {
  id: string;
  type: 'SNIPER_HIT' | 'WHALE_BUY' | 'KOL_APE';
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  message: string;
  verdict: 'BUY' | 'WATCH' | 'AVOID';
  aiScore: number;
  liquidityUsd: number;
  volume24h: number;
  priceChange1h: number;
  priceChange24h: number;
  dexUrl: string;
  telegramSent: boolean;
  createdAt: string;
}

// Global store — survives across API route calls in same process
const store: LiveAlert[] = [];
const seenTokens = new Set<string>(); // prevent duplicate alerts

export function addAlert(alert: Omit<LiveAlert, 'id' | 'createdAt'>): LiveAlert {
  const full: LiveAlert = {
    ...alert,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  store.unshift(full); // newest first
  if (store.length > 200) store.pop(); // cap at 200
  return full;
}

export function getAlerts(limit = 100): LiveAlert[] {
  return store.slice(0, limit);
}

export function hasSeenToken(address: string): boolean {
  return seenTokens.has(address);
}

export function markTokenSeen(address: string) {
  seenTokens.add(address);
  // Reset after 500 entries to avoid memory leak
  if (seenTokens.size > 500) {
    const arr = Array.from(seenTokens);
    arr.slice(0, 100).forEach(a => seenTokens.delete(a));
  }
}

export function markTelegramSent(id: string) {
  const alert = store.find(a => a.id === id);
  if (alert) alert.telegramSent = true;
}
