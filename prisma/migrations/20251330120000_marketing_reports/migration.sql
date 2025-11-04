-- CreateTable
CREATE TABLE "MarketingReport" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "country" TEXT,
    "segment" TEXT,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "MarketingReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketingReport_documentId_key" ON "MarketingReport"("documentId");

-- CreateIndex
CREATE INDEX "MarketingReport_createdById_createdAt_idx" ON "MarketingReport"("createdById", "createdAt");

-- CreateIndex
CREATE INDEX "MarketingReport_createdAt_idx" ON "MarketingReport"("createdAt");

-- AddForeignKey
ALTER TABLE "MarketingReport" ADD CONSTRAINT "MarketingReport_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
