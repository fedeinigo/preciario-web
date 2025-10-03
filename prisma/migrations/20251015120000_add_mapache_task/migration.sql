-- Crea tabla y enum para gestionar tareas internas del equipo Mapaches
CREATE TYPE "MapacheTaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DONE');

CREATE TABLE "MapacheTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "MapacheTaskStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "MapacheTask_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MapacheTask_createdById_idx" ON "MapacheTask"("createdById");

ALTER TABLE "MapacheTask"
    ADD CONSTRAINT "MapacheTask_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
