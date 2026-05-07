DELETE FROM "public"."conversations"
WHERE "archived" = true;

DROP INDEX IF EXISTS "public"."conversations_userId_archived_updatedAt_idx";

ALTER TABLE "public"."conversations"
DROP COLUMN "archived";

CREATE INDEX "conversations_userId_updatedAt_idx"
ON "public"."conversations"("userId", "updatedAt");
