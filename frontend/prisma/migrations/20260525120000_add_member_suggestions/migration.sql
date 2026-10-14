-- CreateEnum
CREATE TYPE "SuggestionCategory" AS ENUM ('PROGRAMMATION', 'ACCUEIL', 'ESPACES', 'COMMUNICATION', 'AUTRE');

-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('NEW', 'READ', 'RESOLVED');

-- AlterEnum
ALTER TYPE "ActivityType" ADD VALUE 'SUGGESTION_SUBMIT';

-- CreateTable
CREATE TABLE "member_suggestion" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "SuggestionCategory" NOT NULL,
    "message" TEXT NOT NULL,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "member_suggestion_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE INDEX "member_suggestion_userId_createdAt_idx" ON "member_suggestion"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "member_suggestion_status_createdAt_idx" ON "member_suggestion"("status", "createdAt");

-- CreateIndex
CREATE INDEX "member_suggestion_category_createdAt_idx" ON "member_suggestion"("category", "createdAt");

-- AddForeignKey
ALTER TABLE "member_suggestion" ADD CONSTRAINT "member_suggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
