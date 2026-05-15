/**
 * Seed script: populate Wallet table with known KOL (Key Opinion Leader) wallets
 *
 * Usage: npx ts-node --project tsconfig.scripts.json scripts/seedKOLs.ts
 *
 * IMPORTANT: The X handles and wallet addresses below are PLACEHOLDER data.
 * Replace with real KOL wallet addresses sourced from:
 * - Lookonchain Twitter (@lookonchain) — frequently posts KOL wallet discoveries
 * - Arkham Intelligence — many CT KOLs have labeled wallets
 * - ZachXBT investigations — often reveals KOL wallet addresses
 * - Nansen "Smart Money" list — tracks CT influencer wallets
 * - Manual research: KOLs sometimes share their addresses publicly for airdrop claims
 *
 * DO NOT use this data in production without verifying addresses.
 * Incorrectly labeling a wallet as a KOL is a legal/reputational risk.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// KOL WALLET DATA
// Replace addresses and handles with verified real data.
// xProfileUrl should be the direct Twitter/X profile URL.
// ─────────────────────────────────────────────────────────────────────────────
const KOL_WALLETS = [
  // Tier 1 — High-follower Solana-focused KOLs
  {
    address: 'KOL_PLACEHOLDER_01_REPLACE_WITH_REAL_ADDRESS_HERE',
    label: 'Solana Alpha Caller',
    xHandle: '@SolAlpha_PLACEHOLDER',
    xProfileUrl: 'https://x.com/SolAlpha_PLACEHOLDER',
    avatarUrl: null,
    totalPnlUsd: 890_000,
    winRate: 0.72,
    tradeCount: 234,
  },
  {
    address: 'KOL_PLACEHOLDER_02_REPLACE_WITH_REAL_ADDRESS_HERE',
    label: 'Meme CT Degen',
    xHandle: '@MemeDegen_PLACEHOLDER',
    xProfileUrl: 'https://x.com/MemeDegen_PLACEHOLDER',
    avatarUrl: null,
    totalPnlUsd: 650_000,
    winRate: 0.68,
    tradeCount: 567,
  },
  {
    address: 'KOL_PLACEHOLDER_03_REPLACE_WITH_REAL_ADDRESS_HERE',
    label: 'NFT to DeFi Crossover',
    xHandle: '@NFTtoDeFi_PLACEHOLDER',
    xProfileUrl: 'https://x.com/NFTtoDeFi_PLACEHOLDER',
    avatarUrl: null,
    totalPnlUsd: 1_200_000,
    winRate: 0.75,
    tradeCount: 189,
  },
  {
    address: 'KOL_PLACEHOLDER_04_REPLACE_WITH_REAL_ADDRESS_HERE',
    label: 'Solana OG Builder',
    xHandle: '@SolOG_PLACEHOLDER',
    xProfileUrl: 'https://x.com/SolOG_PLACEHOLDER',
    avatarUrl: null,
    totalPnlUsd: 2_300_000,
    winRate: 0.80,
    tradeCount: 98,
  },
  {
    address: 'KOL_PLACEHOLDER_05_REPLACE_WITH_REAL_ADDRESS_HERE',
    label: 'Crypto Twitter Whale',
    xHandle: '@CTWhale_PLACEHOLDER',
    xProfileUrl: 'https://x.com/CTWhale_PLACEHOLDER',
    avatarUrl: null,
    totalPnlUsd: 3_100_000,
    winRate: 0.83,
    tradeCount: 145,
  },

  // Tier 2 — Mid-tier KOLs
  {
    address: 'KOL_PLACEHOLDER_06_REPLACE_WITH_REAL_ADDRESS_HERE',
    label: 'DeFi Research Analyst',
    xHandle: '@DeFiResearch_PLACEHOLDER',
    xProfileUrl: 'https://x.com/DeFiResearch_PLACEHOLDER',
    avatarUrl: null,
    totalPnlUsd: 420_000,
    winRate: 0.64,
    tradeCount: 312,
  },
  {
    address: 'KOL_PLACEHOLDER_07_REPLACE_WITH_REAL_ADDRESS_HERE',
    label: 'Gem Hunter',
    xHandle: '@GemHunter_PLACEHOLDER',
    xProfileUrl: 'https://x.com/GemHunter_PLACEHOLDER',
    avatarUrl: null,
    totalPnlUsd: 380_000,
    winRate: 0.62,
    tradeCount: 489,
  },
  {
    address: 'KOL_PLACEHOLDER_08_REPLACE_WITH_REAL_ADDRESS_HERE',
    label: 'Alpha Group Admin',
    xHandle: '@AlphaGroup_PLACEHOLDER',
    xProfileUrl: 'https://x.com/AlphaGroup_PLACEHOLDER',
    avatarUrl: null,
    totalPnlUsd: 290_000,
    winRate: 0.59,
    tradeCount: 678,
  },
  {
    address: 'KOL_PLACEHOLDER_09_REPLACE_WITH_REAL_ADDRESS_HERE',
    label: 'On-Chain Detective',
    xHandle: '@OnChainDet_PLACEHOLDER',
    xProfileUrl: 'https://x.com/OnChainDet_PLACEHOLDER',
    avatarUrl: null,
    totalPnlUsd: 560_000,
    winRate: 0.70,
    tradeCount: 223,
  },
  {
    address: 'KOL_PLACEHOLDER_10_REPLACE_WITH_REAL_ADDRESS_HERE',
    label: 'Solana Ecosystem Dev',
    xHandle: '@SolEcoDev_PLACEHOLDER',
    xProfileUrl: 'https://x.com/SolEcoDev_PLACEHOLDER',
    avatarUrl: null,
    totalPnlUsd: 720_000,
    winRate: 0.73,
    tradeCount: 167,
  },

  // Tier 3 — Niche/emerging KOLs
  ...Array.from({ length: 20 }, (_, i) => ({
    address: `KOL_PLACEHOLDER_${String(i + 11).padStart(2, '0')}_REPLACE_WITH_REAL_ADDRESS_HERE`,
    label: `KOL Placeholder ${i + 11}`,
    xHandle: `@KOL_Placeholder_${i + 11}`,
    xProfileUrl: `https://x.com/KOL_Placeholder_${i + 11}`,
    avatarUrl: null as string | null,
    totalPnlUsd: Math.floor(50_000 + Math.random() * 300_000),
    winRate: Math.round((0.45 + Math.random() * 0.30) * 100) / 100,
    tradeCount: Math.floor(30 + Math.random() * 400),
  })),
];

async function main() {
  console.log(`[seedKOLs] Seeding ${KOL_WALLETS.length} KOL wallets...`);

  let created = 0;
  let skipped = 0;

  for (const kol of KOL_WALLETS) {
    try {
      await prisma.wallet.upsert({
        where: { address: kol.address },
        update: {
          label: kol.label,
          xHandle: kol.xHandle,
          xProfileUrl: kol.xProfileUrl,
          avatarUrl: kol.avatarUrl,
          totalPnlUsd: kol.totalPnlUsd,
          winRate: kol.winRate,
          tradeCount: kol.tradeCount,
          isKOL: true,
          lastActive: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000),
        },
        create: {
          address: kol.address,
          label: kol.label,
          xHandle: kol.xHandle,
          xProfileUrl: kol.xProfileUrl,
          avatarUrl: kol.avatarUrl,
          isKOL: true,
          isWhale: false,
          totalPnlUsd: kol.totalPnlUsd,
          winRate: kol.winRate,
          tradeCount: kol.tradeCount,
          lastActive: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000),
        },
      });
      created++;
      console.log(`  ✓ ${kol.label} (${kol.xHandle})`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ ${kol.label}: ${msg}`);
      skipped++;
    }
  }

  console.log(`\n[seedKOLs] Done: ${created} upserted, ${skipped} failed.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
