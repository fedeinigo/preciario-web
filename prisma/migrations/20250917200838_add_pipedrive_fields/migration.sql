-- CreateEnum
CREATE TYPE "public"."PipedriveSyncStatus" AS ENUM ('OK', 'ERROR');

-- AlterTable
ALTER TABLE "public"."Proposal" ADD COLUMN     "pipedriveDealId" TEXT,
ADD COLUMN     "pipedriveLink" TEXT,
ADD COLUMN     "pipedriveSyncNote" TEXT,
ADD COLUMN     "pipedriveSyncStatus" "public"."PipedriveSyncStatus",
ADD COLUMN     "pipedriveSyncedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Proposal_pipedriveDealId_idx" ON "public"."Proposal"("pipedriveDealId");
