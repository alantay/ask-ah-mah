BEGIN;
SET LOCAL lock_timeout = '5s';
ALTER TABLE "messages" ADD COLUMN "photo" TEXT;
COMMIT;
