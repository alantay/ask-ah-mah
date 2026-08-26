-- Identity moves onto the canonical key (ADR-0029). Rows were backfilled and
-- merged by scripts/backfill-canonical-key.ts before this ran; on a fresh
-- database the table is empty and the backfill is a no-op.

-- Safety net: fold any rows the backfill missed, keeping the oldest.
-- Mirrors 20260505000000, which did the same before the name-based index.
DELETE FROM "inventory_items" a
USING "inventory_items" b
WHERE a."dateAdded" > b."dateAdded"
  AND a."userId" = b."userId"
  AND a."canonicalKey" = b."canonicalKey"
  AND a.type = b.type;

ALTER TABLE "inventory_items" ALTER COLUMN "canonicalKey" SET NOT NULL;

DROP INDEX "inventory_items_userId_name_type_key";

CREATE UNIQUE INDEX "inventory_items_userId_canonicalKey_type_key"
  ON "inventory_items"("userId", "canonicalKey", "type");
