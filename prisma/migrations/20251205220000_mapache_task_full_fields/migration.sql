-- Añade columnas extendidas a MapacheTask y crea MapacheTaskDeliverable

-- Enums necesarios para los nuevos campos
CREATE TYPE "MapacheTaskSubstatus" AS ENUM ('BACKLOG', 'WAITING_CLIENT', 'BLOCKED');
CREATE TYPE "Directness" AS ENUM ('DIRECT', 'PARTNER');
CREATE TYPE "MapacheNeedFromTeam" AS ENUM ('QUOTE_SCOPE', 'QUOTE', 'SCOPE', 'PRESENTATION', 'OTHER');
CREATE TYPE "IntegrationType" AS ENUM ('REST', 'GRAPHQL', 'SDK', 'OTHER');
CREATE TYPE "IntegrationOwner" AS ENUM ('OWN', 'THIRD_PARTY');
CREATE TYPE "MapacheSignalOrigin" AS ENUM ('GOOGLE_FORM', 'GENERATOR', 'API', 'MANUAL', 'OTHER');
CREATE TYPE "MapacheDeliverableType" AS ENUM ('SCOPE', 'QUOTE', 'SCOPE_AND_QUOTE', 'OTHER');

-- Nuevas columnas en MapacheTask
ALTER TABLE "MapacheTask"
  ADD COLUMN "substatus" "MapacheTaskSubstatus" NOT NULL DEFAULT 'BACKLOG',
  ADD COLUMN "assigneeId" TEXT,
  ADD COLUMN "requesterEmail" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "clientName" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "presentationDate" TIMESTAMP(3),
  ADD COLUMN "interlocutorRole" TEXT,
  ADD COLUMN "clientWebsiteUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "directness" "Directness" NOT NULL DEFAULT 'DIRECT',
  ADD COLUMN "pipedriveDealUrl" TEXT,
  ADD COLUMN "needFromTeam" "MapacheNeedFromTeam" NOT NULL DEFAULT 'OTHER',
  ADD COLUMN "clientPain" TEXT,
  ADD COLUMN "productKey" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "managementType" TEXT,
  ADD COLUMN "docsCountApprox" INTEGER,
  ADD COLUMN "docsLengthApprox" TEXT,
  ADD COLUMN "integrationType" "IntegrationType",
  ADD COLUMN "integrationOwner" "IntegrationOwner",
  ADD COLUMN "integrationName" TEXT,
  ADD COLUMN "integrationDocsUrl" TEXT,
  ADD COLUMN "avgMonthlyConversations" INTEGER,
  ADD COLUMN "origin" "MapacheSignalOrigin" NOT NULL DEFAULT 'MANUAL';

-- Eliminamos el default automático del array para que coincida con Prisma (sin default explícito)
ALTER TABLE "MapacheTask" ALTER COLUMN "clientWebsiteUrls" DROP DEFAULT;

-- Índices y relaciones adicionales
CREATE INDEX "MapacheTask_assigneeId_idx" ON "MapacheTask"("assigneeId");
CREATE INDEX "MapacheTask_requesterEmail_idx" ON "MapacheTask"("requesterEmail");
CREATE INDEX "MapacheTask_clientName_idx" ON "MapacheTask"("clientName");
CREATE INDEX "MapacheTask_origin_idx" ON "MapacheTask"("origin");

ALTER TABLE "MapacheTask"
  ADD CONSTRAINT "MapacheTask_assigneeId_fkey"
  FOREIGN KEY ("assigneeId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Tabla de entregables vinculada a MapacheTask
CREATE TABLE "MapacheTaskDeliverable" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "type" "MapacheDeliverableType" NOT NULL DEFAULT 'SCOPE_AND_QUOTE',
  "title" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "addedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MapacheTaskDeliverable_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MapacheTaskDeliverable_taskId_idx" ON "MapacheTaskDeliverable"("taskId");
CREATE INDEX "MapacheTaskDeliverable_addedById_idx" ON "MapacheTaskDeliverable"("addedById");

ALTER TABLE "MapacheTaskDeliverable"
  ADD CONSTRAINT "MapacheTaskDeliverable_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "MapacheTask"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MapacheTaskDeliverable"
  ADD CONSTRAINT "MapacheTaskDeliverable_addedById_fkey"
  FOREIGN KEY ("addedById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
