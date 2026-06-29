-- AlterTable
ALTER TABLE "recipes" ADD COLUMN "shareToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "recipes_shareToken_key" ON "recipes"("shareToken");
