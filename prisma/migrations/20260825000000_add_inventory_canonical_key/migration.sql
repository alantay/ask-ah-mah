-- Pantry identity moves from the display name to a derived canonical key
-- (ADR-0029), so "Shallot" and "Shallots" stop occupying two rows.
--
-- Nullable for now. The key is computed by the app's tokenizer, which SQL
-- cannot reproduce, so scripts/backfill-canonical-key.ts fills it and merges
-- collisions before the unique constraint lands in a later migration.
ALTER TABLE "inventory_items" ADD COLUMN "canonicalKey" TEXT;
