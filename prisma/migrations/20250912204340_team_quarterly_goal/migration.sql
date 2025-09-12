-- CreateTable
CREATE TABLE "public"."TeamQuarterlyGoal" (
    "id" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "quarter" INTEGER NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamQuarterlyGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamQuarterlyGoal_team_year_quarter_key" ON "public"."TeamQuarterlyGoal"("team", "year", "quarter");
