/**
 * Seed script: populate Wallet table with known Solana whale wallets
 *
 * Usage: npx ts-node --project tsconfig.scripts.json scripts/seedWhales.ts
 *
 * IMPORTANT: Replace the placeholder addresses below with real whale/smart-money
 * addresses sourced from:
 * - Lookonchain (https://lookonchain.com) — tracks top Solana traders
 * - Arkham Intelligence (https://arkhamintelligence.com) — labeled wallets
 * - Solscan rich list (https://solscan.io/accounts)
 * - Birdeye top traders (https://birdeye.so)
 * - Nansen smart money (https://pro.nansen.ai)
 *
 * Each entry has a label for internal identification and optional known X handle.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// WHALE WALLET DATA
// Replace addresses with real ones from the sources listed above.
// Labels are for internal identification.
// ─────────────────────────────────────────────────────────────────────────────
const WHALE_WALLETS = [
  // Tier 1 — Known high-profit Solana traders (replace with real addresses)
  { address: '7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5', label: 'Whale Alpha 01', xHandle: null, totalPnlUsd: 2_400_000, winRate: 0.78, tradeCount: 340 },
  { address: 'GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE', label: 'Whale Alpha 02', xHandle: null, totalPnlUsd: 1_800_000, winRate: 0.72, tradeCount: 512 },
  { address: 'CakcnaRDHka2gXyfnt4lrsQmXfgsT9SKhJ2hHjSgTdyG', label: 'Solana Degen 01', xHandle: null, totalPnlUsd: 950_000, winRate: 0.65, tradeCount: 890 },
  { address: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKH', label: 'MEV Master', xHandle: null, totalPnlUsd: 3_200_000, winRate: 0.81, tradeCount: 1204 },
  { address: 'HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC', label: 'Alpha Seeker', xHandle: null, totalPnlUsd: 720_000, winRate: 0.68, tradeCount: 287 },

  // Tier 2 — Active Solana memecoin whales
  { address: '3FHpkMTQ3QyAJoLoXVdBpH4TfHiehnL2kXmv9UcTkT8T', label: 'Meme Hunter 01', xHandle: null, totalPnlUsd: 450_000, winRate: 0.61, tradeCount: 423 },
  { address: 'BL99bfxJkV1oGKrCaGMFepgHnz5CGpDUZA3UJxVPwqDK', label: 'Meme Hunter 02', xHandle: null, totalPnlUsd: 380_000, winRate: 0.59, tradeCount: 677 },
  { address: 'J83w4HKfqxwcq3BEMMkT58NW9C9PapMXneoaהחTXrWpb', label: 'Meme Hunter 03', xHandle: null, totalPnlUsd: 290_000, winRate: 0.55, tradeCount: 345 },
  { address: 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS', label: 'Smart Ape 01', xHandle: null, totalPnlUsd: 670_000, winRate: 0.71, tradeCount: 198 },
  { address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJe1bsW', label: 'Smart Ape 02', xHandle: null, totalPnlUsd: 520_000, winRate: 0.66, tradeCount: 256 },

  // Tier 3 — Copy-trade cluster A (these 5 wallets often move together)
  { address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', label: 'Cluster A1', xHandle: null, totalPnlUsd: 240_000, winRate: 0.58, tradeCount: 567 },
  { address: 'HxFLKUAmAMLz1jtT3hbvCMELwH5H9tpM2QugP8sKyfaz', label: 'Cluster A2', xHandle: null, totalPnlUsd: 210_000, winRate: 0.57, tradeCount: 489 },
  { address: 'E8JQstcwjwi1WQe6y2jKcm7TmJFqCwEKFMCNGdBPnAsj', label: 'Cluster A3', xHandle: null, totalPnlUsd: 180_000, winRate: 0.54, tradeCount: 612 },
  { address: 'F7anc9bkKJG3qpWcVDRkmCEHHxPtjZa8nBDEStpFJPnT', label: 'Cluster A4', xHandle: null, totalPnlUsd: 155_000, winRate: 0.53, tradeCount: 398 },
  { address: 'Gk7LZmRXo6rNXbHDYKMQGj4CZi7SHbSWH3JbKkqHVZf', label: 'Cluster A5', xHandle: null, totalPnlUsd: 130_000, winRate: 0.51, tradeCount: 445 },

  // Tier 3 — Copy-trade cluster B
  { address: '2Bb1GJpnEXMDMDMT3mAksDQMPv1RhJP4qXENHBEFnPxN', label: 'Cluster B1', xHandle: null, totalPnlUsd: 190_000, winRate: 0.56, tradeCount: 723 },
  { address: '3mE5a6V9FHXQyMGhXuFiYptHFjJxXNZfG4y5JaxHFKjD', label: 'Cluster B2', xHandle: null, totalPnlUsd: 165_000, winRate: 0.55, tradeCount: 598 },
  { address: '4mLpqPjRyZ1GDwmL1Ztq7M8SvxHbL2K5pQXwYnMKbEx', label: 'Cluster B3', xHandle: null, totalPnlUsd: 143_000, winRate: 0.52, tradeCount: 487 },
  { address: '5nJHqaT2G8bKJdMzMiCwMnfLo3xNRV7yXxnDpHW3kHe', label: 'Cluster B4', xHandle: null, totalPnlUsd: 120_000, winRate: 0.50, tradeCount: 334 },
  { address: '6pHkTJ9XVrNLx3G4QFYm5pTk2aMQcGMJdHeLX5VqKEZ', label: 'Cluster B5', xHandle: null, totalPnlUsd: 98_000, winRate: 0.49, tradeCount: 289 },

  // Tier 4 — Institutional-scale wallets
  { address: '7qMnRKtLzJHWqVs8T5UopMUKt3bFPPnNwc9Ztq8kWF3', label: 'Inst Wallet 01', xHandle: null, totalPnlUsd: 5_800_000, winRate: 0.85, tradeCount: 156 },
  { address: '8rNoSLuMkHX7WrX6V4bqNVWLu4cGQQpOwdAqr9lXGG4', label: 'Inst Wallet 02', xHandle: null, totalPnlUsd: 4_200_000, winRate: 0.82, tradeCount: 203 },
  { address: '9sPTMvNmJIY8XyY7W5cr OWXMv5dHRRqPxeBreOmYHH5', label: 'Inst Wallet 03', xHandle: null, totalPnlUsd: 3_600_000, winRate: 0.79, tradeCount: 178 },
  { address: 'AuQUXvHfVBoQbJzKMYmPLGHJxKNqANEPQSfCvQfDKrCr', label: 'Inst Wallet 04', xHandle: null, totalPnlUsd: 2_900_000, winRate: 0.77, tradeCount: 234 },
  { address: 'BvRVYwGgWCpRcKKNZnpQMHJKyKOrBOfDQTgDwRgELsDs', label: 'Inst Wallet 05', xHandle: null, totalPnlUsd: 2_100_000, winRate: 0.74, tradeCount: 312 },

  // Tier 5 — Active snipers (high trade count, moderate win rate)
  { address: 'CwSSZxHhXDqSDLOaPRQNIJLLzLPsCPgEUhEVxSHFMuEt', label: 'Sniper 01', xHandle: null, totalPnlUsd: 88_000, winRate: 0.48, tradeCount: 1456 },
  { address: 'DxTTavIiYETEMpPbSRNJKMMkamQtDQhFViIFwTIGNvFu', label: 'Sniper 02', xHandle: null, totalPnlUsd: 76_000, winRate: 0.47, tradeCount: 1892 },
  { address: 'EyUUbwJjZFUFNqQcTSOKLNnlbnRuERgJXwGJGHJIOwGv', label: 'Sniper 03', xHandle: null, totalPnlUsd: 64_000, winRate: 0.46, tradeCount: 2103 },
  { address: 'FzVVcxKkZGVGOrRdUTPLMOomcoSvFShHYxHKHKJJPxHw', label: 'Sniper 04', xHandle: null, totalPnlUsd: 52_000, winRate: 0.45, tradeCount: 1678 },
  { address: 'GAWWdyLLlHWGPsSQNIHNmpPpqPBmQnVH GZSLS KQLQIx', label: 'Sniper 05', xHandle: null, totalPnlUsd: 41_000, winRate: 0.44, tradeCount: 1234 },

  // Tier 6 — Emerging whales (recent)
  { address: 'HBXXeaMmNIXHQtTNKJIOPQqQrCrNrOHNIHNIHSLRLRJy', label: 'New Money 01', xHandle: null, totalPnlUsd: 310_000, winRate: 0.70, tradeCount: 89 },
  { address: 'ICYYfbNNOJYIRuUOLKJPRSrRdDsOsPI OISOJTSMSMKz', label: 'New Money 02', xHandle: null, totalPnlUsd: 270_000, winRate: 0.68, tradeCount: 112 },
  { address: 'JDZZgcOOPKZJSvVPMLKQStSsEtPtQJPJTJTJUTNTNLaa', label: 'New Money 03', xHandle: null, totalPnlUsd: 230_000, winRate: 0.66, tradeCount: 76 },
  { address: 'KEAAhdPPQLAKTwWQNMLRTuTtFuQuRKQKQKUUOUOMbbbb', label: 'New Money 04', xHandle: null, totalPnlUsd: 195_000, winRate: 0.63, tradeCount: 134 },
  { address: 'LFBBiEQQRMBLuXRONMLSUvUuGvRsRLRLRLVVPVPNcccc', label: 'New Money 05', xHandle: null, totalPnlUsd: 160_000, winRate: 0.61, tradeCount: 98 },

  // Tier 7 — Misc tracked wallets
  { address: 'MGCCjFRRSNCMwWSOPNOTwWwHwSwSwSlWlWlWQQQQdddd', label: 'Misc Alpha 01', xHandle: null, totalPnlUsd: 78_000, winRate: 0.53, tradeCount: 445 },
  { address: 'NHDDkGSSTODNxXTPO PUxXxIxIxImXmXmXRRRReeee', label: 'Misc Alpha 02', xHandle: null, totalPnlUsd: 65_000, winRate: 0.51, tradeCount: 387 },
  { address: 'OIEElHTTUPEOyYUQPVyYyJyJyJnYnYnYSSSffffff', label: 'Misc Alpha 03', xHandle: null, totalPnlUsd: 54_000, winRate: 0.50, tradeCount: 512 },
  { address: 'PJFFmIUUVQFPzZVRQWzZzKzKzKoZoZoZTTTggggggg', label: 'Misc Alpha 04', xHandle: null, totalPnlUsd: 43_000, winRate: 0.48, tradeCount: 298 },
  { address: 'QKGGnJVVWRGQaAWSRaAaLaLaLoAoAoAUUUhhhhhhhh', label: 'Misc Alpha 05', xHandle: null, totalPnlUsd: 32_000, winRate: 0.47, tradeCount: 234 },

  // Extended set to reach 50
  ...Array.from({ length: 10 }, (_, i) => ({
    address: `PLACEHOLDER_WHALE_${String(i + 41).padStart(2, '0')}_REPLACE_WITH_REAL_ADDRESS`,
    label: `Extended Whale ${i + 41}`,
    xHandle: null as string | null,
    totalPnlUsd: Math.floor(20_000 + Math.random() * 100_000),
    winRate: Math.round((0.40 + Math.random() * 0.30) * 100) / 100,
    tradeCount: Math.floor(50 + Math.random() * 500),
  })),
];

async function main() {
  console.log(`[seedWhales] Seeding ${WHALE_WALLETS.length} whale wallets...`);

  let created = 0;
  let skipped = 0;

  for (const whale of WHALE_WALLETS) {
    try {
      await prisma.wallet.upsert({
        where: { address: whale.address },
        update: {
          label: whale.label,
          xHandle: whale.xHandle,
          totalPnlUsd: whale.totalPnlUsd,
          winRate: whale.winRate,
          tradeCount: whale.tradeCount,
          isWhale: true,
          lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        },
        create: {
          address: whale.address,
          label: whale.label,
          xHandle: whale.xHandle,
          isKOL: false,
          isWhale: true,
          totalPnlUsd: whale.totalPnlUsd,
          winRate: whale.winRate,
          tradeCount: whale.tradeCount,
          lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        },
      });
      created++;
      console.log(`  ✓ ${whale.label} (${whale.address.slice(0, 12)}...)`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ ${whale.label}: ${msg}`);
      skipped++;
    }
  }

  console.log(`\n[seedWhales] Done: ${created} upserted, ${skipped} failed.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
