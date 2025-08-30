-- Añadimos ambas columnas con default para backfill de filas existentes
ALTER TABLE "public"."User"
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP NOT NULL DEFAULT NOW();

ALTER TABLE "public"."User"
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW();
