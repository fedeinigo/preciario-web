/*
  Warnings:

  - You are about to drop the column `order` on the `FilialCountry` table. All the data in the column will be lost.
  - You are about to drop the column `itemsJson` on the `Proposal` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[groupId,name]` on the table `FilialCountry` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `FilialCountry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userEmail` to the `Proposal` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Proposal" DROP CONSTRAINT "Proposal_userId_fkey";

-- DropIndex
DROP INDEX "public"."FilialCountry_groupId_idx";

-- DropIndex
DROP INDEX "public"."FilialCountry_name_idx";

-- DropIndex
DROP INDEX "public"."GlossaryLink_label_idx";

-- DropIndex
DROP INDEX "public"."Item_category_idx";

-- DropIndex
DROP INDEX "public"."Item_name_idx";

-- DropIndex
DROP INDEX "public"."Proposal_createdAt_idx";

-- DropIndex
DROP INDEX "public"."Proposal_userId_idx";

-- AlterTable
ALTER TABLE "public"."FilialCountry" DROP COLUMN "order",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."Item" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "unitPrice" SET DEFAULT 0,
ALTER COLUMN "devHours" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."Proposal" DROP COLUMN "itemsJson",
ADD COLUMN     "userEmail" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."ProposalItem" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "devHours" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ProposalItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FilialCountry_groupId_name_key" ON "public"."FilialCountry"("groupId", "name");

-- AddForeignKey
ALTER TABLE "public"."ProposalItem" ADD CONSTRAINT "ProposalItem_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "public"."Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
