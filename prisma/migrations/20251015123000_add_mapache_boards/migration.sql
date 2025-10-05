-- Create tables for Mapache boards and their columns
CREATE TABLE "MapacheBoard" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MapacheBoard_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MapacheBoardColumn" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "filters" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MapacheBoardColumn_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MapacheBoardColumn_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "MapacheBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "MapacheBoard_position_idx" ON "MapacheBoard"("position");

CREATE INDEX "MapacheBoardColumn_boardId_position_idx" ON "MapacheBoardColumn"("boardId", "position");
