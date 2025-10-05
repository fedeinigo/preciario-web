-- Crea tabla de estados y migra MapacheTask a FK
CREATE TABLE "MapacheStatus" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MapacheStatus_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MapacheStatus_key_key" ON "MapacheStatus"("key");

INSERT INTO "MapacheStatus" ("id", "key", "label", "order", "createdAt", "updatedAt")
VALUES
    ('mapache_status_pending', 'PENDING', 'Pendiente', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('mapache_status_in_progress', 'IN_PROGRESS', 'En progreso', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('mapache_status_done', 'DONE', 'Completada', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

ALTER TABLE "MapacheTask" ADD COLUMN "statusId" TEXT;

UPDATE "MapacheTask" AS mt
SET "statusId" = ms."id"
FROM "MapacheStatus" AS ms
WHERE ms."key" = mt."status";

UPDATE "MapacheTask"
SET "statusId" = 'mapache_status_pending'
WHERE "statusId" IS NULL;

ALTER TABLE "MapacheTask" ALTER COLUMN "statusId" SET NOT NULL;

DROP INDEX IF EXISTS "MapacheTask_status_idx";

ALTER TABLE "MapacheTask" DROP COLUMN "status";

CREATE INDEX "MapacheTask_statusId_idx" ON "MapacheTask"("statusId");

ALTER TABLE "MapacheTask"
    ADD CONSTRAINT "MapacheTask_statusId_fkey"
    FOREIGN KEY ("statusId") REFERENCES "MapacheStatus"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

DROP TYPE "MapacheTaskStatus";
