/*
  Warnings:

  - You are about to drop the column `discountPct` on the `ProposalItem` table. All the data in the column will be lost.
  - You are about to drop the column `targetUsd` on the `QuarterlyGoal` table. All the data in the column will be lost.
  - Added the required column `amount` to the `QuarterlyGoal` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Proposal_wonAt_idx";

-- AlterTable
ALTER TABLE "public"."ProposalItem" DROP COLUMN "discountPct";

-- AlterTable
ALTER TABLE "public"."QuarterlyGoal" DROP COLUMN "targetUsd",
ADD COLUMN     "amount" DECIMAL(14,2) NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."QuarterlyGoal" ADD CONSTRAINT "QuarterlyGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
