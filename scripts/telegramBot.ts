/**
 * ORCA Telegram Bot
 * Built with Telegraf.js
 *
 * Usage: npx ts-node --project tsconfig.scripts.json scripts/telegramBot.ts
 *
 * Commands:
 *   /start              — welcome message
 *   /subscribe sniper   — subscribe to AI sniper BUY alerts
 *   /subscribe whales   — subscribe to whale movement alerts
 *   /subscribe kols     — subscribe to KOL ape alerts
 *   /unsubscribe [type] — remove subscription
 *   /status             — show active subscriptions
 *   /top                — today's top 5 BUY verdicts
 */

import { Telegraf, Context, Markup } from 'telegraf';
import { Message } from 'telegraf/typings/core/types/typegram';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ORCA_API_URL = process.env.ORCA_API_URL || 'http://localhost:3000';

if (!BOT_TOKEN) {
  console.error('[TelegramBot] TELEGRAM_BOT_TOKEN not set. Exiting.');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// ─── In-memory subscription store ─────────────────────────────────────────
// In production, persist this to Redis or PostgreSQL
type SubType = 'sniper' | 'whales' | 'kols';
const subscriptions = new Map<number, Set<SubType>>();

function getUserSubs(chatId: number): Set<SubType> {
  if (!subscriptions.has(chatId)) subscriptions.set(chatId, new Set());
  return subscriptions.get(chatId)!;
}

// ─── Helper functions ──────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// ─── Commands ─────────────────────────────────────────────────────────────

bot.start((ctx) => {
  const username = ctx.from?.first_name || 'Trader';
  ctx.replyWithMarkdownV2(
    `*🐋 Welcome to ORCA, ${username}\\.*\n\n` +
    `_See what smart money sees\\._\n\n` +
    `*Available commands:*\n` +
    `📡 /subscribe sniper \\— AI token launch alerts\n` +
    `🐋 /subscribe whales \\— Whale wallet movements\n` +
    `🐦 /subscribe kols \\— KOL wallet activity\n` +
    `/unsubscribe \\[type\\] \\— Stop receiving alerts\n` +
    `/status \\— Your active subscriptions\n` +
    `/top \\— Today's top BUY signals\n\n` +
    `Start with /subscribe to receive real\\-time alpha\\.`
  );
});

bot.command('subscribe', (ctx) => {
  const args = ctx.message.text.split(' ').slice(1);
  const type = args[0]?.toLowerCase() as SubType | undefined;

  if (!type || !['sniper', 'whales', 'kols'].includes(type)) {
    ctx.reply(
      '❌ Invalid subscription type.\n\n' +
      'Valid options:\n' +
      '• /subscribe sniper\n' +
      '• /subscribe whales\n' +
      '• /subscribe kols'
    );
    return;
  }

  const subs = getUserSubs(ctx.chat.id);
  subs.add(type);

  const labels: Record<SubType, string> = {
    sniper: '🎯 AI Token Sniper (BUY verdicts)',
    whales: '🐋 Whale Wallet Movements',
    kols: '🐦 KOL Wallet Activity',
  };

  ctx.reply(`✅ Subscribed to ${labels[type]}!\n\nYou'll receive alerts when new signals are detected.`);
});

bot.command('unsubscribe', (ctx) => {
  const args = ctx.message.text.split(' ').slice(1);
  const type = args[0]?.toLowerCase() as SubType | undefined;

  if (!type || !['sniper', 'whales', 'kols'].includes(type)) {
    ctx.reply(
      '❌ Specify what to unsubscribe from:\n' +
      '• /unsubscribe sniper\n' +
      '• /unsubscribe whales\n' +
      '• /unsubscribe kols'
    );
    return;
  }

  const subs = getUserSubs(ctx.chat.id);
  subs.delete(type);

  ctx.reply(`🔕 Unsubscribed from ${type} alerts.`);
});

bot.command('status', (ctx) => {
  const subs = getUserSubs(ctx.chat.id);

  if (subs.size === 0) {
    ctx.reply('📭 No active subscriptions.\n\nUse /subscribe to start receiving alerts.');
    return;
  }

  const list = Array.from(subs).map(s => {
    const icons: Record<SubType, string> = { sniper: '🎯', whales: '🐋', kols: '🐦' };
    return `${icons[s]} ${s.charAt(0).toUpperCase() + s.slice(1)}`;
  }).join('\n');

  ctx.reply(`📡 *Active Subscriptions:*\n\n${list}`, { parse_mode: 'Markdown' });
});

bot.command('top', async (ctx) => {
  try {
    const res = await fetch(`${ORCA_API_URL}/api/sniper/tokens?verdict=BUY&limit=5`);
    const data = await res.json();

    if (!data.success || !data.data?.length) {
      ctx.reply('📊 No top tokens found for today. Check back later!');
      return;
    }

    const tokens = data.data.slice(0, 5);
    let msg = `🏆 *Today's Top BUY Signals*\n\n`;

    tokens.forEach((token: { aiScore: number; symbol: string; name: string; liquidityUsd: number; holderCount: number }, i: number) => {
      const score = token.aiScore;
      const emoji = score >= 85 ? '🔥' : score >= 70 ? '⚡' : '✅';
      msg += `${i + 1}. ${emoji} *$${token.symbol}* — ${token.name}\n`;
      msg += `   Score: ${score}/100 | Liq: ${formatNumber(token.liquidityUsd)}\n`;
      msg += `   Holders: ${token.holderCount.toLocaleString()}\n\n`;
    });

    msg += `_Updated every 30 minutes_`;
    ctx.reply(msg, { parse_mode: 'Markdown' });
  } catch (err) {
    ctx.reply('❌ Failed to fetch top tokens. Is ORCA running?');
  }
});

// ─── Alert formatters (called from alert pipeline) ─────────────────────────

export function formatSniperAlert(token: {
  symbol: string;
  aiScore: number;
  aiVerdict: string;
  liquidityUsd: number;
  holderCount: number;
  top10HolderPercent: number;
  volume24h: number;
  aiReasoning: string;
  address: string;
}): string {
  const verdictEmoji = token.aiVerdict === 'BUY' ? '✅ BUY' : token.aiVerdict === 'WATCH' ? '⚠️ WATCH' : '❌ AVOID';
  const reasoning = token.aiReasoning
    ? token.aiReasoning.split('\n').filter(Boolean).slice(0, 3).map(r => `• ${r}`).join('\n')
    : '• AI analysis complete';

  return (
    `🎯 *SNIPER ALERT — $${token.symbol}*\n` +
    `Verdict: ${verdictEmoji} | Score: ${token.aiScore}/100\n\n` +
    `💧 Liquidity: ${formatNumber(token.liquidityUsd)}\n` +
    `👥 Holders: ${token.holderCount.toLocaleString()} | Top 10: ${token.top10HolderPercent.toFixed(0)}%\n` +
    `📊 Volume 24h: ${formatNumber(token.volume24h)}\n\n` +
    `🧠 AI Reasoning:\n${reasoning}\n\n` +
    `🔗 [DexScreener](https://dexscreener.com/solana/${token.address}) | [Birdeye](https://birdeye.so/token/${token.address}?chain=solana)`
  );
}

export function formatWhaleAlert(data: {
  walletLabel: string;
  walletAddress: string;
  tokenSymbol: string;
  amountUsd: number;
  priceChangePct?: number;
  xHandle?: string;
  tokenAddress?: string;
}): string {
  const change = data.priceChangePct
    ? `\n📈 Token up ${data.priceChangePct.toFixed(0)}% since entry`
    : '';
  const kolLine = data.xHandle ? `\n🐦 @${data.xHandle} just aped in` : '';
  const dexLink = data.tokenAddress
    ? `\n🔗 [DexScreener](https://dexscreener.com/solana/${data.tokenAddress}) | [ORCA](http://localhost:3000)`
    : '';

  return (
    `🐋 *WHALE ALERT — ${data.walletLabel || truncateAddress(data.walletAddress)}*\n` +
    `Bought *$${data.tokenSymbol}* — ${formatNumber(data.amountUsd)} USDC` +
    kolLine + change + dexLink
  );
}

// ─── Alert broadcaster ─────────────────────────────────────────────────────

export async function broadcastSniperAlert(token: Parameters<typeof formatSniperAlert>[0]) {
  // Only send BUY verdicts to sniper subscribers
  if (token.aiVerdict !== 'BUY') return;

  const msg = formatSniperAlert(token);
  for (const [chatId, subs] of subscriptions) {
    if (subs.has('sniper')) {
      try {
        await bot.telegram.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
      } catch (err) {
        console.error(`[TelegramBot] Failed to send to ${chatId}:`, err);
      }
    }
  }
}

export async function broadcastWhaleAlert(data: Parameters<typeof formatWhaleAlert>[0], isKOL = false) {
  const msg = formatWhaleAlert(data);
  const subType: SubType = isKOL ? 'kols' : 'whales';

  for (const [chatId, subs] of subscriptions) {
    if (subs.has(subType)) {
      try {
        await bot.telegram.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
      } catch (err) {
        console.error(`[TelegramBot] Failed to send to ${chatId}:`, err);
      }
    }
  }
}

// ─── Start bot ────────────────────────────────────────────────────────────

bot.launch(() => {
  console.log('[TelegramBot] ORCA bot started. Waiting for commands...');
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
