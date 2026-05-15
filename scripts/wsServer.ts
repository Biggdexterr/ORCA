/**
 * Standalone WebSocket Server for ORCA real-time events
 * Run alongside Next.js dev server: npx ts-node --project tsconfig.scripts.json scripts/wsServer.ts
 *
 * Events emitted:
 *   NEW_TOKEN    — a new token was sniped and analyzed
 *   TOKEN_UPDATED — token metrics updated
 *   ALERT        — new alert fired
 *   STATS_UPDATE — dashboard stats refreshed
 *   WHALE_MOVE   — whale wallet activity detected
 */

import { WebSocketServer, WebSocket } from 'ws';
import { generateMockTokens, generateMockAlerts, generateMockDashboardStats } from '../src/lib/mockData';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

const wss = new WebSocketServer({ port: PORT });

console.log(`[ORCA WS] Server running on ws://localhost:${PORT}`);

const clients = new Set<WebSocket>();

function broadcast(event: { type: string; data: unknown }) {
  const payload = JSON.stringify(event);
  clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });
}

wss.on('connection', (ws, req) => {
  clients.add(ws);
  const ip = req.socket.remoteAddress;
  console.log(`[ORCA WS] Client connected from ${ip} — total: ${clients.size}`);

  // Send initial state on connect
  ws.send(JSON.stringify({ type: 'CONNECTED', data: { clients: clients.size } }));

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      console.log(`[ORCA WS] Received:`, msg);
      // Future: handle subscription messages here
    } catch {}
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[ORCA WS] Client disconnected — total: ${clients.size}`);
  });

  ws.on('error', (err) => {
    console.error(`[ORCA WS] Client error:`, err.message);
    clients.delete(ws);
  });
});

// ─── Mock event generators ─────────────────────────────────────────────────

// New token every 15s (in prod: Birdeye webhook or polling)
setInterval(() => {
  const tokens = generateMockTokens(1);
  const token = tokens[0];
  console.log(`[ORCA WS] Broadcasting NEW_TOKEN: ${token.symbol}`);
  broadcast({ type: 'NEW_TOKEN', data: token });
}, 15_000);

// Token update (price change) every 8s
setInterval(() => {
  const tokens = generateMockTokens(1);
  const token = tokens[0];
  // Simulate price movement
  token.priceUsd = token.priceUsd * (0.8 + Math.random() * 0.4);
  broadcast({ type: 'TOKEN_UPDATED', data: token });
}, 8_000);

// Alert every 45s
setInterval(() => {
  const alerts = generateMockAlerts(1);
  console.log(`[ORCA WS] Broadcasting ALERT: ${alerts[0].type}`);
  broadcast({ type: 'ALERT', data: alerts[0] });
}, 45_000);

// Stats update every 30s
setInterval(() => {
  broadcast({ type: 'STATS_UPDATE', data: generateMockDashboardStats() });
}, 30_000);

// Whale move alert every 60s
setInterval(() => {
  broadcast({
    type: 'WHALE_MOVE',
    data: {
      walletLabel: `Whale_${Math.floor(Math.random() * 999)}`,
      walletAddress: `${Math.random().toString(36).slice(2, 10)}...`,
      tokenSymbol: ['BONK', 'WIF', 'POPCAT', 'MYRO', 'BOME'][Math.floor(Math.random() * 5)],
      amountUsd: Math.floor(10000 + Math.random() * 90000),
      timestamp: new Date().toISOString(),
    }
  });
}, 60_000);

process.on('SIGINT', () => {
  console.log('\n[ORCA WS] Shutting down...');
  wss.close(() => process.exit(0));
});
