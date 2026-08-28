/**
 * Populates InventoryItem.canonicalKey and merges rows that collide once it is
 * computed (ADR-0029). Run once, between the migration that adds the column and
 * the migration that makes it unique.
 *
 * Merge rule: within a (userId, canonicalKey, type) group the oldest row by
 * dateAdded survives as-is and the rest are deleted. No field-level
 * reconciliation — quantity and unit carry no product weight.
 *
 * Idempotent: safe to run repeatedly.
 *
 * Usage: pnpm tsx scripts/backfill-canonical-key.ts
 */
import { PrismaClient } from "../src/generated/prisma";
import { canonicalKey } from "../src/lib/ingredients";

// Its own client, imported relatively: `@/lib/db` would drag the `@/*` path
// alias into a plain tsx run for no benefit.
const prisma = new PrismaClient();

async function main() {
  // Selected explicitly, never `findMany()` bare: when this runs, the schema
  // already types canonicalKey as non-null but the column is still nullable and
  // every existing row holds null. Reading it would fail the conversion before
  // the backfill could write a single key.
  const rows = await prisma.inventoryItem.findMany({
    orderBy: { dateAdded: "asc" },
    select: { id: true, name: true, userId: true, type: true },
  });
  console.log(`Read ${rows.length} inventory rows.`);

  const survivors = new Map<string, string>(); // group key -> surviving row id
  const doomed: string[] = [];

  for (const row of rows) {
    const key = canonicalKey(row.name);
    const group = `${row.userId}\u0000${key}\u0000${row.type}`;

    if (survivors.has(group)) {
      doomed.push(row.id);
      console.log(`  merge: "${row.name}" -> keeping earlier row for key "${key}"`);
      continue;
    }

    survivors.set(group, row.id);
    await prisma.inventoryItem.update({
      where: { id: row.id },
      data: { canonicalKey: key },
    });
  }

  if (doomed.length > 0) {
    await prisma.inventoryItem.deleteMany({ where: { id: { in: doomed } } });
  }

  console.log(`Backfilled ${survivors.size} rows, merged away ${doomed.length}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
