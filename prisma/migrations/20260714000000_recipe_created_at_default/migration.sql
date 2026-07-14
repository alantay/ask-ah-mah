-- Default createdAt so newly saved recipes carry a real timestamp
-- (previously null, which left the cookbook unsortable by save time).
ALTER TABLE "recipes" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- Backfill legacy rows that were saved before the default existed.
UPDATE "recipes" SET "createdAt" = CURRENT_TIMESTAMP WHERE "createdAt" IS NULL;
