-- Create table for Mapache insights snapshots
CREATE TABLE "MapacheInsightsSnapshot" (
  "id" TEXT NOT NULL,
  "bucket" TEXT NOT NULL,
  "scope" TEXT NOT NULL DEFAULT 'all',
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "total" INTEGER NOT NULL,
  "dueSoonCount" INTEGER NOT NULL,
  "overdueCount" INTEGER NOT NULL,
  "statusTotals" JSONB NOT NULL,
  "substatusTotals" JSONB NOT NULL,
  "needTotals" JSONB NOT NULL,
  CONSTRAINT "MapacheInsightsSnapshot_pkey" PRIMARY KEY ("id")
);

-- Ensure buckets are unique to allow upserts based on this field
CREATE UNIQUE INDEX "MapacheInsightsSnapshot_bucket_key"
  ON "MapacheInsightsSnapshot"("bucket");

-- Support querying snapshots by scope and capture date
CREATE INDEX "MapacheInsightsSnapshot_scope_capturedAt_idx"
  ON "MapacheInsightsSnapshot"("scope", "capturedAt");
