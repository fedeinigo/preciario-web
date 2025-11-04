-- CreateEnum
CREATE TYPE "PortalKey" AS ENUM ('DIRECT', 'MAPACHE', 'PARTNER', 'MARKETING');

-- CreateTable
CREATE TABLE "PortalAccess" (
    "userId" TEXT NOT NULL,
    "portal" "PortalKey" NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PortalAccess_pkey" PRIMARY KEY ("userId","portal")
);

-- CreateIndex
CREATE INDEX "PortalAccess_portal_idx" ON "PortalAccess"("portal");

-- AddForeignKey
ALTER TABLE "PortalAccess" ADD CONSTRAINT "PortalAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
