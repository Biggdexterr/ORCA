// ============================================================
// Claude AI — Token Analysis Service
// Uses claude-sonnet-4-20250514 for token scoring/verdicts
//
// PROMPT ENGINEERING NOTES:
// - System prompt positions Claude as a Solana memecoin analyst
// - We explicitly request JSON-only output to allow reliable parsing
// - Verdict thresholds: BUY ≥70, WATCH 40-69, AVOID <40
// - Reasoning limited to 3 bullets for Telegram card formatting
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import { AIAnalysis, Token } from '@/types';

let anthropicClient: Anthropic | null = null;

function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('[AI] ANTHROPIC_API_KEY not set — using mock analysis');
    return null;
  }
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

// ─── System Prompt ─────────────────────────────────────────────
// Keeps Claude focused on objective token metrics, not speculation.
// JSON-only output prevents markdown wrapping issues during parsing.
const SYSTEM_PROMPT = `You are a crypto token analyst specializing in Solana memecoins and token launches.
Analyze the following token metrics and return ONLY valid JSON with these exact keys:
- verdict: one of "BUY", "AVOID", or "WATCH"
- score: integer 0-100 representing overall quality/opportunity score
- reasoning: array of exactly 3 strings — concise bullet-point analysis
- riskFlags: array of strings — specific risk factors identified
- catalysts: array of strings — positive factors supporting the verdict

Be decisive. Prioritize: liquidity depth, dev wallet concentration, holder distribution, and volume authenticity.
Do not include markdown, explanations, or any text outside the JSON object.`;

// ─── Fallback Mock Analysis ────────────────────────────────────
// Generates realistic-looking analysis without API key
function generateMockAnalysis(metrics: TokenMetrics): AIAnalysis {
  const liquidityScore = Math.min(metrics.liquidityUsd / 1000, 40);
  const holderScore = Math.min(metrics.holderCount / 100, 25);
  const devScore = Math.max(25 - metrics.devWalletPercent, 0);
  const concentrationPenalty = Math.max(metrics.top10HolderPercent - 30, 0) * 0.5;
  const score = Math.round(Math.min(liquidityScore + holderScore + devScore - concentrationPenalty, 100));

  const verdict: AIAnalysis['verdict'] = score >= 70 ? 'BUY' : score >= 40 ? 'WATCH' : 'AVOID';

  return {
    verdict,
    score,
    reasoning: [
      `Liquidity at $${(metrics.liquidityUsd / 1000).toFixed(0)}K — ${metrics.liquidityUsd > 100000 ? 'healthy depth' : 'thin market, high slippage risk'}`,
      `Dev wallet at ${metrics.devWalletPercent.toFixed(1)}% — ${metrics.devWalletPercent < 5 ? 'safe concentration level' : 'elevated rug risk'}`,
      `Top 10 holders control ${metrics.top10HolderPercent.toFixed(0)}% — ${metrics.top10HolderPercent < 40 ? 'reasonable distribution' : 'whale-concentrated supply'}`,
    ],
    riskFlags: [
      ...(metrics.devWalletPercent > 10 ? ['High dev wallet concentration'] : []),
      ...(metrics.top10HolderPercent > 60 ? ['Whale-dominated supply'] : []),
      ...(metrics.liquidityUsd < 50000 ? ['Low liquidity — high slippage'] : []),
    ],
    catalysts: [
      ...(metrics.liquidityUsd > 200000 ? ['Deep liquidity supports entry'] : []),
      ...(metrics.holderCount > 1000 ? ['Large and growing holder base'] : []),
      ...(metrics.socialScore > 70 ? ['High social engagement signal'] : []),
    ],
  };
}

export interface TokenMetrics {
  address: string;
  name: string;
  symbol: string;
  liquidityUsd: number;
  marketCapUsd: number;
  devWalletPercent: number;
  holderCount: number;
  top10HolderPercent: number;
  volume24h: number;
  priceUsd: number;
  socialScore: number;
}

// ─── Main Analysis Function ────────────────────────────────────
export async function analyzeToken(metrics: TokenMetrics): Promise<AIAnalysis> {
  const client = getClient();

  if (!client) {
    // Simulate API latency
    await new Promise(r => setTimeout(r, 200));
    return generateMockAnalysis(metrics);
  }

  const userMessage = `Analyze this Solana token launch:

Token: ${metrics.name} ($${metrics.symbol})
Address: ${metrics.address}

METRICS:
- Liquidity: $${metrics.liquidityUsd.toLocaleString()}
- Market Cap: $${metrics.marketCapUsd.toLocaleString()}
- Price: $${metrics.priceUsd.toFixed(8)}
- 24h Volume: $${metrics.volume24h.toLocaleString()}
- Holder Count: ${metrics.holderCount.toLocaleString()}
- Top 10 Holders: ${metrics.top10HolderPercent.toFixed(1)}%
- Dev Wallet: ${metrics.devWalletPercent.toFixed(1)}%
- Social Score: ${metrics.socialScore.toFixed(0)}/100

Return only the JSON analysis object.`;

  try {
    const response = await client.messages.create({
      model: process.env.AI_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    // Strip any accidental markdown fences
    const cleaned = textBlock.text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned) as AIAnalysis;

    // Validate required fields
    if (!parsed.verdict || parsed.score === undefined) {
      throw new Error('Invalid AI response structure');
    }

    return parsed;
  } catch (err) {
    console.error('[AI] analyzeToken error:', err);
    // Fallback to mock on API error
    return generateMockAnalysis(metrics);
  }
}

// ─── Batch Analysis for Historical Accuracy ────────────────────
export async function analyzeMultipleTokens(
  tokens: TokenMetrics[]
): Promise<Map<string, AIAnalysis>> {
  const results = new Map<string, AIAnalysis>();

  // Process in batches of 3 to respect rate limits
  for (let i = 0; i < tokens.length; i += 3) {
    const batch = tokens.slice(i, i + 3);
    const analyses = await Promise.all(batch.map(t => analyzeToken(t)));
    batch.forEach((t, idx) => results.set(t.address, analyses[idx]));

    if (i + 3 < tokens.length) {
      await new Promise(r => setTimeout(r, 1000)); // Rate limit buffer
    }
  }

  return results;
}
