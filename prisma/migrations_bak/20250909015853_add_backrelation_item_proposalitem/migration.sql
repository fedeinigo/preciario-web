/*
  Warnings:

  - You are about to drop the column `category` on the `ProposalItem` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `ProposalItem` table. All the data in the column will be lost.
  - You are about to drop the column `sku` on the `ProposalItem` table. All the data in the column will be lost.
  - Added the required column `itemId` to the `ProposalItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."ProposalItem_sku_idx";

-- AlterTable
ALTER TABLE "public"."Proposal" ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "countryId" DROP NOT NULL,
ALTER COLUMN "subsidiary" DROP NOT NULL,
ALTER COLUMN "subsidiaryId" DROP NOT NULL,
ALTER COLUMN "userEmail" DROP NOT NULL,
ALTER COLUMN "seq" DROP DEFAULT;
DROP SEQUENCE "Proposal_seq_seq";

-- AlterTable
ALTER TABLE "public"."ProposalItem" DROP COLUMN "category",
DROP COLUMN "name",
DROP COLUMN "sku",
ADD COLUMN     "itemId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "ProposalItem_itemId_idx" ON "public"."ProposalItem"("itemId");

-- AddForeignKey
ALTER TABLE "public"."ProposalItem" ADD CONSTRAINT "ProposalItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
