import { NextRequest } from 'next/server';
import { generateMockTokens, generateMockAlerts, generateMockDashboardStats } from '@/lib/mockData';

// Native Next.js WebSocket handler
// This endpoint upgrades HTTP connections to WebSocket
// For production use, consider a dedicated ws:// server (see scripts/wsServer.ts)

export const runtime = 'nodejs';

let wsClients: Set<WebSocket> = new Set();

function broadcast(data: unknown) {
  const payload = JSON.stringify(data);
  wsClients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      client.send(payload);
    }
  });
}

// Simulate real-time events for development
function startMockEventLoop() {
  // Send a new token every 15 seconds
  setInterval(() => {
    const tokens = generateMockTokens(1);
    broadcast({ type: 'NEW_TOKEN', data: tokens[0] });
  }, 15000);

  // Send stats update every 30 seconds
  setInterval(() => {
    broadcast({ type: 'STATS_UPDATE', data: generateMockDashboardStats() });
  }, 30000);

  // Send alerts every 45 seconds
  setInterval(() => {
    const alerts = generateMockAlerts(1);
    broadcast({ type: 'ALERT', data: alerts[0] });
  }, 45000);
}

// Start the mock event loop once
let loopStarted = false;
if (!loopStarted) {
  loopStarted = true;
  startMockEventLoop();
}

export async function GET(req: NextRequest) {
  // Check if this is a WebSocket upgrade request
  const upgrade = req.headers.get('upgrade');
  if (upgrade?.toLowerCase() !== 'websocket') {
    return new Response('Expected WebSocket upgrade', { status: 426 });
  }

  // Note: Native Next.js WebSocket support requires Next.js 14.1+ with the
  // experimental.serverComponentsExternalPackages config or a custom server.
  // For production, use the standalone ws server in scripts/wsServer.ts
  
  return new Response('WebSocket upgrade not supported in this environment. Use scripts/wsServer.ts', {
    status: 501,
    headers: { 'Content-Type': 'text/plain' }
  });
}

// Export broadcast for use by other API routes
export { broadcast };
