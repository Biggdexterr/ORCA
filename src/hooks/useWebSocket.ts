// ============================================================
// ORCA — WebSocket Hook
// Manages real-time connection and dispatches events to store
// ============================================================

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useOrcaStore } from '@/store/orcaStore';
import { WSEvent } from '@/types';

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { setWsConnected, addToken, updateToken, addAlert, setStats } = useOrcaStore();

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data) as WSEvent;

        switch (msg.type) {
          case 'NEW_TOKEN':
            addToken(msg.data as any);
            break;
          case 'TOKEN_UPDATED':
            const { address, ...updates } = msg.data as any;
            updateToken(address, updates);
            break;
          case 'ALERT':
            addAlert(msg.data as any);
            break;
          case 'STATS_UPDATE':
            setStats(msg.data as any);
            break;
          default:
            break;
        }
      } catch (err) {
        console.error('[WS] Message parse error:', err);
      }
    },
    [addToken, updateToken, addAlert, setStats]
  );

  const connect = useCallback(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000/api/ws';

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        console.log('[WS] Connected');
      };

      ws.onmessage = handleMessage;

      ws.onclose = () => {
        setWsConnected(false);
        console.log('[WS] Disconnected — reconnecting in 5s');
        reconnectTimerRef.current = setTimeout(connect, 5000);
      };

      ws.onerror = (err) => {
        console.error('[WS] Error:', err);
        ws.close();
      };
    } catch (err) {
      console.error('[WS] Connection failed:', err);
      // In development, don't crash — WS server may not be running
    }
  }, [handleMessage, setWsConnected]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return wsRef;
}
