// ============================================================
// ORCA — Zustand Global State Store
// ============================================================

import { create } from 'zustand';
import { Token, Alert, DashboardStats, Wallet } from '@/types';

type Theme = 'dark' | 'light' | 'system';

interface OrcaStore {
  // ─── Theme ─────────────────────────────────────────────────
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // ─── Connection Status ──────────────────────────────────────
  wsConnected: boolean;
  setWsConnected: (connected: boolean) => void;

  // ─── Live Token Feed ────────────────────────────────────────
  tokens: Token[];
  addToken: (token: Token) => void;
  updateToken: (address: string, updates: Partial<Token>) => void;
  setTokens: (tokens: Token[]) => void;

  // ─── Alerts ─────────────────────────────────────────────────
  alerts: Alert[];
  unreadAlerts: number;
  addAlert: (alert: Alert) => void;
  setAlerts: (alerts: Alert[]) => void;
  markAlertsRead: () => void;

  // ─── Dashboard Stats ────────────────────────────────────────
  stats: DashboardStats | null;
  setStats: (stats: DashboardStats) => void;

  // ─── Selected Entities ──────────────────────────────────────
  selectedToken: Token | null;
  setSelectedToken: (token: Token | null) => void;

  selectedWallet: Wallet | null;
  setSelectedWallet: (wallet: Wallet | null) => void;

  // ─── Sniper Drawer ──────────────────────────────────────────
  sniperDrawerOpen: boolean;
  setSniperDrawerOpen: (open: boolean) => void;
}

export const useOrcaStore = create<OrcaStore>((set) => ({
  // Theme
  theme: 'dark',
  setTheme: (theme) => {
    set({ theme });
    if (typeof window !== 'undefined') {
      localStorage.setItem('orca-theme', theme);
      const effectiveTheme =
        theme === 'system'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
          : theme;
      document.documentElement.className = `theme-${effectiveTheme}`;
    }
  },

  // Connection
  wsConnected: false,
  setWsConnected: (connected) => set({ wsConnected: connected }),

  // Tokens
  tokens: [],
  addToken: (token) =>
    set((state) => ({
      tokens: [token, ...state.tokens].slice(0, 200), // Keep last 200
    })),
  updateToken: (address, updates) =>
    set((state) => ({
      tokens: state.tokens.map((t) =>
        t.address === address ? { ...t, ...updates } : t
      ),
    })),
  setTokens: (tokens) => set({ tokens }),

  // Alerts
  alerts: [],
  unreadAlerts: 0,
  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts].slice(0, 100),
      unreadAlerts: state.unreadAlerts + 1,
    })),
  setAlerts: (alerts) => set({ alerts }),
  markAlertsRead: () => set({ unreadAlerts: 0 }),

  // Stats
  stats: null,
  setStats: (stats) => set({ stats }),

  // Selection
  selectedToken: null,
  setSelectedToken: (token) => set({ selectedToken: token }),

  selectedWallet: null,
  setSelectedWallet: (wallet) => set({ selectedWallet: wallet }),

  // Sniper drawer
  sniperDrawerOpen: false,
  setSniperDrawerOpen: (open) => set({ sniperDrawerOpen: open }),
}));
