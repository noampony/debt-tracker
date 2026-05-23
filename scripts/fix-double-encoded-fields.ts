/**
 * Fix for double-encoded rows.
 * If the migration ran AFTER the new server code was already deployed,
 * records created by the new server were encoded once, then the migration
 * encoded them again → double-encoded in DB, one decode on read → still Base64 in UI.
 *
 * This script decodes every value once unconditionally, leaving all rows
 * single-encoded (what the server expects).
 *
 * Run against the affected environment, then verify the app looks correct.
 *
 *   # production:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/fix-double-encoded-fields.ts
 *
 *   # local:
 *   npx tsx scripts/fix-double-encoded-fields.ts
 */

import { PrismaClient } from "@prisma/client";

function decode(value: string): string {
  return Buffer.from(value, "base64").toString("utf8");
}

const db = new PrismaClient();

async function main() {
  // --- Members ---
  const members = await db.member.findMany({ select: { id: true, name: true } });
  console.log(`Processing ${members.length} member(s)…`);
  for (const m of members) {
    await db.member.update({
      where: { id: m.id },
      data: { name: decode(m.name) },
    });
  }

  // --- Transactions ---
  const transactions = await db.transaction.findMany({
    select: { id: true, title: true, notes: true },
  });
  console.log(`Processing ${transactions.length} transaction(s)…`);
  for (const tx of transactions) {
    await db.transaction.update({
      where: { id: tx.id },
      data: {
        title: decode(tx.title),
        notes: tx.notes != null ? decode(tx.notes) : undefined,
      },
    });
  }

  console.log("Done — all rows are now single-encoded.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

