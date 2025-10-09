-- Crea tabla para presets de filtros del portal Mapache
-- CreateTable
CREATE TABLE "public"."MapacheFilterPreset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "MapacheFilterPreset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MapacheFilterPreset_createdById_idx" ON "public"."MapacheFilterPreset"("createdById");

-- CreateIndex
CREATE INDEX "MapacheFilterPreset_createdAt_idx" ON "public"."MapacheFilterPreset"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."MapacheFilterPreset" ADD CONSTRAINT "MapacheFilterPreset_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

