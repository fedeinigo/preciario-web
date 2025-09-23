/*
  Warnings:

  - A unique constraint covering the columns `[externalId]` on the table `Proposal` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."CreatedChannel" AS ENUM ('WEB', 'API', 'WHATSAPP');

-- AlterTable
ALTER TABLE "public"."Proposal" ADD COLUMN     "createdByExternalId" TEXT,
ADD COLUMN     "createdChannel" "public"."CreatedChannel" NOT NULL DEFAULT 'API',
ADD COLUMN     "externalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_externalId_key" ON "public"."Proposal"("externalId");

-- CreateIndex
CREATE INDEX "Proposal_createdChannel_idx" ON "public"."Proposal"("createdChannel");

-- CreateIndex
CREATE INDEX "Proposal_createdByExternalId_idx" ON "public"."Proposal"("createdByExternalId");
