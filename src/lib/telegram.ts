/**
 * Telegram sender — works with user's own bot token + chat ID
 * Token and chat ID come from env OR user's localStorage-stored settings
 * passed via API header
 */

export async function sendTelegram(
  message: string,
  botToken: string,
  chatId: string
): Promise<boolean> {
  if (!botToken || !chatId) return false;

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
        }),
      }
    );
    const data = await res.json();
    if (!data.ok) {
      console.error('[Telegram] Send failed:', data.description);
      return false;
    }
    return true;
  } catch (e: any) {
    console.error('[Telegram] Error:', e.message);
    return false;
  }
}

export function formatSniperAlert(alert: {
  tokenSymbol: string;
  tokenName: string;
  verdict: string;
  aiScore: number;
  liquidityUsd: number;
  volume24h: number;
  priceChange1h: number;
  priceChange24h: number;
  dexUrl: string;
  tokenAddress: string;
}): string {
  const verdictEmoji = alert.verdict === 'BUY' ? '✅' : alert.verdict === 'WATCH' ? '⚠️' : '❌';
  const fmt = (n: number) => n >= 1_000_000 ? `$${(n/1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${(n/1_000).toFixed(0)}K` : `$${n.toFixed(0)}`;

  return [
    `🎯 *ORCA SNIPER ALERT*`,
    ``,
    `${verdictEmoji} *$${alert.tokenSymbol}* — ${alert.tokenName}`,
    `Score: *${alert.aiScore}/100* | Verdict: *${alert.verdict}*`,
    ``,
    `💧 Liquidity: ${fmt(alert.liquidityUsd)}`,
    `📊 Volume 24h: ${fmt(alert.volume24h)}`,
    `📈 1h: ${alert.priceChange1h > 0 ? '+' : ''}${alert.priceChange1h.toFixed(1)}% | 24h: ${alert.priceChange24h > 0 ? '+' : ''}${alert.priceChange24h.toFixed(1)}%`,
    ``,
    `🔗 [DexScreener](${alert.dexUrl})`,
    `📍 \`${alert.tokenAddress}\``,
  ].join('\n');
}
