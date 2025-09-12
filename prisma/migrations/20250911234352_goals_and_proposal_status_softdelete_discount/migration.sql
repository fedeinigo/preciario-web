-- CreateEnum
CREATE TYPE "public"."ProposalStatus" AS ENUM ('OPEN', 'WON', 'LOST');

-- AlterTable
ALTER TABLE "public"."Proposal" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "status" "public"."ProposalStatus" NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "wonAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."ProposalItem" ADD COLUMN     "discountPct" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."QuarterlyGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "quarter" INTEGER NOT NULL,
    "targetUsd" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuarterlyGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuarterlyGoal_userId_year_quarter_key" ON "public"."QuarterlyGoal"("userId", "year", "quarter");

-- CreateIndex
CREATE INDEX "Proposal_status_idx" ON "public"."Proposal"("status");

-- CreateIndex
CREATE INDEX "Proposal_wonAt_idx" ON "public"."Proposal"("wonAt");

-- CreateIndex
CREATE INDEX "Proposal_deletedAt_idx" ON "public"."Proposal"("deletedAt");
