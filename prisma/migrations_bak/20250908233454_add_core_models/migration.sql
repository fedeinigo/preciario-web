-- DropIndex
DROP INDEX "public"."Account_userId_idx";

-- DropIndex
DROP INDEX "public"."Session_userId_idx";

-- CreateTable
CREATE TABLE "public"."Item" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "devHours" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GlossaryLink" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlossaryLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FilialGroup" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FilialGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FilialCountry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "FilialCountry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Proposal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "subsidiary" TEXT NOT NULL,
    "subsidiaryId" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "totalHours" DOUBLE PRECISION NOT NULL,
    "oneShot" DOUBLE PRECISION NOT NULL,
    "docUrl" TEXT,
    "docId" TEXT,
    "itemsJson" JSONB NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Item_sku_key" ON "public"."Item"("sku");

-- CreateIndex
CREATE INDEX "Item_category_idx" ON "public"."Item"("category");

-- CreateIndex
CREATE INDEX "Item_name_idx" ON "public"."Item"("name");

-- CreateIndex
CREATE INDEX "GlossaryLink_label_idx" ON "public"."GlossaryLink"("label");

-- CreateIndex
CREATE INDEX "FilialCountry_groupId_idx" ON "public"."FilialCountry"("groupId");

-- CreateIndex
CREATE INDEX "FilialCountry_name_idx" ON "public"."FilialCountry"("name");

-- CreateIndex
CREATE INDEX "Proposal_userId_idx" ON "public"."Proposal"("userId");

-- CreateIndex
CREATE INDEX "Proposal_createdAt_idx" ON "public"."Proposal"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."FilialCountry" ADD CONSTRAINT "FilialCountry_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."FilialGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Proposal" ADD CONSTRAINT "Proposal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
