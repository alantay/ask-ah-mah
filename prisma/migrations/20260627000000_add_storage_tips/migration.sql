-- CreateTable
CREATE TABLE "storage_tips" (
    "key" TEXT NOT NULL,
    "tip" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storage_tips_pkey" PRIMARY KEY ("key")
);
