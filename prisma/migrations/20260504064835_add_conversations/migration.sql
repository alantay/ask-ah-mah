-- CreateTable
CREATE TABLE "public"."conversations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conversations_userId_archived_updatedAt_idx" ON "public"."conversations"("userId", "archived", "updatedAt");

-- AlterTable: add nullable conversationId
ALTER TABLE "public"."messages" ADD COLUMN "conversationId" TEXT;

-- Backfill: for each distinct userId, create a conversation and link messages
DO $$
DECLARE
  u TEXT;
  conv_id TEXT;
  earliest TIMESTAMP(3);
BEGIN
  FOR u IN SELECT DISTINCT "userId" FROM "public"."messages" LOOP
    SELECT MIN("createdAt") INTO earliest FROM "public"."messages" WHERE "userId" = u;
    conv_id := gen_random_uuid()::text;
    INSERT INTO "public"."conversations" ("id", "userId", "title", "archived", "createdAt", "updatedAt")
    VALUES (conv_id, u, NULL, false, earliest, earliest);
    UPDATE "public"."messages" SET "conversationId" = conv_id WHERE "userId" = u;
  END LOOP;
END $$;

-- AlterTable: make conversationId NOT NULL
ALTER TABLE "public"."messages" ALTER COLUMN "conversationId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "public"."conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "messages_conversationId_createdAt_idx" ON "public"."messages"("conversationId", "createdAt");
