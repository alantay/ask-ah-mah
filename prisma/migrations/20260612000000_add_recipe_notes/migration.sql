-- AlterTable
ALTER TABLE "recipes" ADD COLUMN "notes" TEXT[] DEFAULT ARRAY[]::TEXT[];
