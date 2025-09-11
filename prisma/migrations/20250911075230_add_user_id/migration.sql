/*
  Warnings:

  - Added the required column `userId` to the `inventory_items` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_inventory_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER,
    "unit" TEXT,
    "dateAdded" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" DATETIME NOT NULL,
    "userId" TEXT NOT NULL
);
INSERT INTO "new_inventory_items" ("dateAdded", "id", "lastUpdated", "name", "quantity", "type", "unit") SELECT "dateAdded", "id", "lastUpdated", "name", "quantity", "type", "unit" FROM "inventory_items";
DROP TABLE "inventory_items";
ALTER TABLE "new_inventory_items" RENAME TO "inventory_items";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
