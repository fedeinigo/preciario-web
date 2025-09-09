/*
  Warnings:

  - You are about to alter the column `unitPrice` on the `Item` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `devHours` on the `Item` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `totalAmount` on the `Proposal` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,2)`.
  - You are about to alter the column `totalHours` on the `Proposal` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `oneShot` on the `Proposal` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,2)`.
  - You are about to alter the column `unitPrice` on the `ProposalItem` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `devHours` on the `ProposalItem` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to drop the column `emailVerified` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[title]` on the table `FilialGroup` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[label,url]` on the table `GlossaryLink` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[seq]` on the table `Proposal` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Proposal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ProposalItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Item" ALTER COLUMN "unitPrice" DROP DEFAULT,
ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "devHours" DROP DEFAULT,
ALTER COLUMN "devHours" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "public"."Proposal" ADD COLUMN     "seq" SERIAL NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "totalAmount" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "totalHours" SET DATA TYPE INTEGER,
ALTER COLUMN "oneShot" SET DATA TYPE DECIMAL(14,2);

-- AlterTable
ALTER TABLE "public"."ProposalItem" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "devHours" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "emailVerified";

-- CreateIndex
CREATE INDEX "FilialCountry_groupId_idx" ON "public"."FilialCountry"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "FilialGroup_title_key" ON "public"."FilialGroup"("title");

-- CreateIndex
CREATE UNIQUE INDEX "GlossaryLink_label_url_key" ON "public"."GlossaryLink"("label", "url");

-- CreateIndex
CREATE INDEX "Item_category_name_idx" ON "public"."Item"("category", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_seq_key" ON "public"."Proposal"("seq");

-- CreateIndex
CREATE INDEX "Proposal_createdAt_idx" ON "public"."Proposal"("createdAt");

-- CreateIndex
CREATE INDEX "Proposal_userEmail_idx" ON "public"."Proposal"("userEmail");

-- CreateIndex
CREATE INDEX "ProposalItem_proposalId_idx" ON "public"."ProposalItem"("proposalId");

-- CreateIndex
CREATE INDEX "ProposalItem_sku_idx" ON "public"."ProposalItem"("sku");
