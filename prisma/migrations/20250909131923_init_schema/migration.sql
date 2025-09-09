-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('superadmin', 'lider', 'usuario');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "team" TEXT,
    "role" "public"."Role" NOT NULL DEFAULT 'usuario',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."Item" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "devHours" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Proposal" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "subsidiary" TEXT NOT NULL,
    "subsidiaryId" TEXT NOT NULL,
    "totalAmount" DECIMAL(14,2) NOT NULL,
    "totalHours" INTEGER NOT NULL,
    "oneShot" DECIMAL(14,2) NOT NULL,
    "docUrl" TEXT,
    "docId" TEXT,
    "userEmail" TEXT,
    "seq" SERIAL NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProposalItem" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "devHours" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "itemId" TEXT NOT NULL,

    CONSTRAINT "ProposalItem_pkey" PRIMARY KEY ("id")
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
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FilialCountry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TeamCatalog" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "public"."Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "public"."Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "public"."VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "public"."VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Item_sku_key" ON "public"."Item"("sku");

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
CREATE INDEX "ProposalItem_itemId_idx" ON "public"."ProposalItem"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "GlossaryLink_label_url_key" ON "public"."GlossaryLink"("label", "url");

-- CreateIndex
CREATE UNIQUE INDEX "FilialGroup_title_key" ON "public"."FilialGroup"("title");

-- CreateIndex
CREATE INDEX "FilialCountry_groupId_idx" ON "public"."FilialCountry"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "FilialCountry_groupId_name_key" ON "public"."FilialCountry"("groupId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "TeamCatalog_name_key" ON "public"."TeamCatalog"("name");

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProposalItem" ADD CONSTRAINT "ProposalItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProposalItem" ADD CONSTRAINT "ProposalItem_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "public"."Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FilialCountry" ADD CONSTRAINT "FilialCountry_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."FilialGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
