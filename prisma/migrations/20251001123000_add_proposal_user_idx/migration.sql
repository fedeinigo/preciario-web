-- Crea un índice no destructivo para acelerar filtros por usuario en Proposal
CREATE INDEX IF NOT EXISTS "Proposal_userId_idx" ON "Proposal"("userId");
