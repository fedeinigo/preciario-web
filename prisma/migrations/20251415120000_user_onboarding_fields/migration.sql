-- Add onboarding related fields to User
ALTER TABLE "User"
ADD COLUMN "positionName" TEXT,
ADD COLUMN "leaderEmail" TEXT;
