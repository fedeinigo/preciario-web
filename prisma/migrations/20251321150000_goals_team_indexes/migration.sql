-- Adds composite indexes to speed up proposal filters and manual won deal reporting
CREATE INDEX IF NOT EXISTS "proposal_status_deletedAt_createdAt_idx" ON "Proposal"("status", "deletedAt", "createdAt");

CREATE INDEX IF NOT EXISTS "proposal_userEmail_deletedAt_createdAt_idx" ON "Proposal"("userEmail", "deletedAt", "createdAt");

CREATE INDEX IF NOT EXISTS "manualWonDeal_user_year_quarter_createdAt_idx" ON "ManualWonDeal"("userId", "year", "quarter", "createdAt");
