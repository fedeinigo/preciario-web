-- CreateTable
CREATE TABLE "public"."ManualWonDeal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "monthlyFee" DECIMAL(14,2) NOT NULL,
    "proposalUrl" TEXT,
    "year" INTEGER NOT NULL,
    "quarter" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManualWonDeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WonDealBilling" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT,
    "manualWonDealId" TEXT,
    "billedAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WonDealBilling_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ManualWonDeal_userId_year_quarter_idx" ON "public"."ManualWonDeal"("userId", "year", "quarter");

-- CreateIndex
CREATE INDEX "ManualWonDeal_createdAt_idx" ON "public"."ManualWonDeal"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WonDealBilling_proposalId_key" ON "public"."WonDealBilling"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "WonDealBilling_manualWonDealId_key" ON "public"."WonDealBilling"("manualWonDealId");

-- AddForeignKey
ALTER TABLE "public"."ManualWonDeal" ADD CONSTRAINT "ManualWonDeal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ManualWonDeal" ADD CONSTRAINT "ManualWonDeal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WonDealBilling" ADD CONSTRAINT "WonDealBilling_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "public"."Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WonDealBilling" ADD CONSTRAINT "WonDealBilling_manualWonDealId_fkey" FOREIGN KEY ("manualWonDealId") REFERENCES "public"."ManualWonDeal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
