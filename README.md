# 🐋 ORCA — On-chain Reconnaissance & Chain Analytics

> Smart money intelligence for Solana — real-time token sniping, whale tracking, KOL radar, and AI-powered analysis.

![Next.js](https://img.shields.io/badge/Next.js-14.2.35-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?style=flat-square&logo=tailwindcss)
![Railway](https://img.shields.io/badge/WS_Server-Railway-purple?style=flat-square)
![Vercel](https://img.shields.io/badge/Frontend-Vercel-black?style=flat-square&logo=vercel)

---

## 📌 Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started (Local)](#getting-started-local)
- [Environment Variables](#environment-variables)
- [Deploying to Vercel + Railway](#deploying-to-vercel--railway)
- [Birdeye API Reference](#birdeye-api-reference)
- [WebSocket Events](#websocket-events)

---

## About

ORCA is a real-time on-chain analytics dashboard for Solana. It surfaces new token launches, whale wallet movements, KOL activity, trending meme tokens, and AI-generated trade signals — all in one interface.

Data is sourced from [Birdeye](https://birdeye.so) and [DexScreener](https://dexscreener.com), with optional AI analysis powered by [Anthropic Claude](https://anthropic.com).

---

## Features

- **Dashboard** — Live stats: tokens scanned, buy signals, whale moves, AI accuracy
- **Token Sniper** — New Solana token listings with price, liquidity, and volume data
- **Whale Map** — Track large wallet movements and KOL trades
- **KOL Radar** — Monitor wallets with 500+ unique holders in 24h
- **Leaderboard** — Top trending and gaining tokens
- **Alerts** — Real-time notifications for sniper hits, KOL apes, and whale moves
- **AI Analysis** — Claude-powered token scoring (requires Anthropic API key)
- **Real-time WebSocket** — Live event streaming for tokens, alerts, and stats

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State | Zustand |
| Charts | Recharts, D3 |
| AI | Anthropic Claude (`@anthropic-ai/sdk`) |
| Real-time | WebSocket (standalone server via `ws`) |
| Data | Birdeye API, DexScreener API |
| Frontend hosting | Vercel |
| WS Server hosting | Railway |

---

## Project Structure

```
ORCA/
├── src/
│   ├── app/                  # Next.js App Router pages & API routes
│   │   ├── api/
│   │   │   ├── dashboard/    # Stats endpoint (Birdeye + DexScreener)
│   │   │   ├── tokens/       # Token listing & sniper endpoints
│   │   │   └── ws/           # WebSocket upgrade handler (dev only)
│   │   ├── dashboard/
│   │   ├── sniper/
│   │   ├── whalemap/
│   │   ├── kol-radar/
│   │   ├── leaderboard/
│   │   └── alerts/
│   ├── components/           # Reusable UI components
│   ├── hooks/                # useWebSocket, custom hooks
│   ├── lib/                  # API clients, mockData, utilities
│   ├── store/                # Zustand global store (orcaStore.ts)
│   └── types/                # Shared TypeScript types
├── scripts/
│   └── wsServer.ts           # Standalone WebSocket server (runs on Railway)
├── Procfile                  # Railway start command
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

---

## Getting Started (Local)

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### 1. Clone the repo

```bash
git clone https://github.com/Biggdexterr/ORCA.git
cd ORCA
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the project root:

```env
# Birdeye API (get yours at https://birdeye.so/data-service)
BIRDEYE_API_KEY=your_birdeye_api_key

# Anthropic Claude AI (optional — get yours at https://console.anthropic.com)
ANTHROPIC_API_KEY=your_anthropic_api_key

# WebSocket URL (local dev)
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### 4. Start the WebSocket server

In a separate terminal:

```bash
npx ts-node --project tsconfig.scripts.json scripts/wsServer.ts
```

You should see:
```
[ORCA WS] Server running on ws://localhost:3001
```

### 5. Start the Next.js dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `BIRDEYE_API_KEY` | Yes | Birdeye Data Services API key |
| `ANTHROPIC_API_KEY` | No | Enables AI token analysis via Claude. Falls back to mock if not set. |
| `NEXT_PUBLIC_WS_URL` | Yes | WebSocket server URL. Use `ws://localhost:3001` locally, `wss://your-railway-url` in production. |

> **Note:** The app runs without `ANTHROPIC_API_KEY` — AI features are silently disabled and the app falls back to mock analysis data.

---

## Deploying to Vercel + Railway

ORCA uses a split deployment: the **Next.js frontend** runs on Vercel, and the **WebSocket server** runs as a separate service on Railway.

### Frontend — Vercel

1. Push your repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your ORCA repo
3. Add these **Environment Variables** in Vercel project settings:

```
BIRDEYE_API_KEY        = your_birdeye_api_key
ANTHROPIC_API_KEY      = placeholder   (or real key if you have one)
NEXT_PUBLIC_WS_URL     = wss://your-railway-app.up.railway.app
```

4. Deploy

### WebSocket Server — Railway

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
2. Select your ORCA repo
3. In **Settings**, set:
   - **Build Command:** `npm install`
   - **Start Command:** `npx ts-node --project tsconfig.scripts.json scripts/wsServer.ts`
4. Railway will auto-assign a `PORT` environment variable — the WS server reads this automatically
5. Go to **Settings → Networking → Generate Domain** to get your public URL
6. Copy the domain (e.g. `orca-production-xxxx.up.railway.app`) and set it as `NEXT_PUBLIC_WS_URL` in Vercel:

```
wss://orca-production-xxxx.up.railway.app
```

7. Redeploy Vercel — the status indicator in the bottom-left should show **CONNECTED**

---

## Birdeye API Reference

ORCA uses the [Birdeye Data Services API](https://docs.birdeye.so). Get your API key at [birdeye.so/data-service](https://birdeye.so/data-service).

### Endpoints Used in This Build

| Endpoint | Description | Used For |
|---|---|---|
| `GET /defi/v3/token/meme/list` | List of trending meme tokens | Dashboard meme feed |
| `GET /defi/token_trending` | Trending tokens by chain | Leaderboard / trending tab |
| `GET /defi/v2/tokens/new_listing` | Newly listed tokens | Token Sniper |
| `GET /defi/token_overview` | Full token metadata + market data | Token detail view |
| `GET /defi/v3/token/meme/detail/single` | Single meme token detail | Token drill-down |
| `GET /defi/v2/tokens/top_traders` | Top traders for a token | KOL Radar / Whale Map |
| `GET /defi/price` | Real-time token price | Price display |
| `GET /defi/history_price` | Historical price data | Price charts |
| `GET /defi/ohlcv` | OHLCV candlestick data | Token charts |

All requests are made to:
```
https://public-api.birdeye.so
```

With headers:
```
X-API-KEY: your_birdeye_api_key
x-chain: solana
```

---

### Birdeye API Tier Availability

The endpoints used in ORCA and their availability by plan:

| Endpoint | Standard (Free) | Starter/Lite | Premium | Business/Enterprise |
|---|---|---|---|---|
| `/defi/token_trending` | ✅ | ✅ | ✅ | ✅ |
| `/defi/token_overview` | ✅ | ✅ | ✅ | ✅ |
| `/defi/price` | ✅ | ✅ | ✅ | ✅ |
| `/defi/history_price` | ✅ | ✅ | ✅ | ✅ |
| `/defi/ohlcv` | ✅ | ✅ | ✅ | ✅ |
| `/defi/v3/token/meme/list` | ✅ | ✅ | ✅ | ✅ |
| `/defi/v3/token/meme/detail/single` | ✅ | ✅ | ✅ | ✅ |
| `/defi/v2/tokens/new_listing` | ✅ | ✅ | ✅ | ✅ |
| `/defi/v2/tokens/top_traders` | ✅ | ✅ | ✅ | ✅ |
| `/defi/v3/token/meta-data/single` | ❌ | ✅ | ✅ | ✅ |
| `/defi/token_security` | ❌ | ✅ | ✅ | ✅ |
| `/defi/token_creation_info` | ❌ | ✅ | ✅ | ✅ |
| `/defi/multi_price` (batch prices) | ❌ | ✅ | ✅ | ✅ |
| `/defi/v3/token/trade-data/single` | ❌ | ✅ | ✅ | ✅ |
| `/defi/v3/token/list/scroll` | ❌ | ❌ | ❌ | ✅ |
| `/defi/v2/tokens/all` | ❌ | ❌ | ❌ | ✅ |
| **WebSocket streams** | ❌ | ❌ | ✅ | ✅ |

> **Free tier (Standard)** is sufficient to run ORCA's core features. Upgrading to **Starter/Lite** unlocks token security checks and creation info. **Premium** unlocks Birdeye WebSocket streams (real-time price/tx feeds) which could replace the mock WS event loop.

---

## WebSocket Events

The standalone WS server (`scripts/wsServer.ts`) broadcasts these events:

| Event | Payload | Interval |
|---|---|---|
| `NEW_TOKEN` | Token object | Every 15s |
| `TOKEN_UPDATED` | `{ address, priceUsd, ... }` | Every 8s |
| `ALERT` | Alert object (`SNIPER_HIT`, `KOL_APE`, etc.) | Every 45s |
| `STATS_UPDATE` | Dashboard stats object | Every 30s |
| `WHALE_MOVE` | `{ walletLabel, tokenSymbol, amountUsd, ... }` | Every 60s |
| `CONNECTED` | `{ clients: number }` | On connect |

In production, these mock events can be replaced with real Birdeye WebSocket subscriptions (`SUBSCRIBE_PRICE`, `SUBSCRIBE_TXS`, `SUBSCRIBE_TOKEN_NEW_LISTING`) available on **Premium and above**.

---

## Fallback Behaviour

| Feature | Without API Key | With Free Key | With Paid Key |
|---|---|---|---|
| Dashboard stats | Mock data | Live Birdeye data | Live Birdeye data |
| Token sniper | Mock tokens | Live new listings | Live new listings |
| AI analysis | Disabled (mock scores) | Disabled | Enabled (Claude) |
| Real-time WS | Mock event loop | Mock event loop | Birdeye WS streams |

---

*Built by [@Biggdexterr](https://github.com/Biggdexterr)*