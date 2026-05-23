/**
 * One-time migration: encode existing plaintext Member.name and
 * Transaction.title / Transaction.notes values to Base64.
 *
 * Run ONCE against each environment BEFORE deploying the server code
 * that uses the new codec. Running it a second time would double-encode.
 *
 *   npx tsx scripts/migrate-encode-fields.ts
 *
 * Requires DATABASE_URL to be set in the environment (same as the server).
 */

import { PrismaClient } from "@prisma/client";

function encode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64");
}

const db = new PrismaClient();

async function main() {
  // --- Members ---
  const members = await db.member.findMany({ select: { id: true, name: true } });
  console.log(`Encoding ${members.length} member(s)…`);
  for (const m of members) {
    await db.member.update({
      where: { id: m.id },
      data: { name: encode(m.name) },
    });
  }

  // --- Transactions ---
  const transactions = await db.transaction.findMany({
    select: { id: true, title: true, notes: true },
  });
  console.log(`Encoding ${transactions.length} transaction(s)…`);
  for (const tx of transactions) {
    await db.transaction.update({
      where: { id: tx.id },
      data: {
        title: encode(tx.title),
        notes: tx.notes != null ? encode(tx.notes) : undefined,
      },
    });
  }

  console.log("Migration complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

