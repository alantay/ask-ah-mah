-- Dedupe existing rows before adding unique constraint.
-- Keeps the row with the smallest id for each (userId, name, type) group.
DELETE FROM "inventory_items" a
USING "inventory_items" b
WHERE a.id > b.id
  AND a."userId" = b."userId"
  AND lower(btrim(a.name)) = lower(btrim(b.name))
  AND a.type = b.type;

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_userId_name_type_key" ON "inventory_items"("userId", "name", "type");
