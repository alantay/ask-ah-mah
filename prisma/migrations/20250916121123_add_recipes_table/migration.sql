-- CreateTable
CREATE TABLE "public"."recipes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recipes_userId_idx" ON "public"."recipes"("userId");
