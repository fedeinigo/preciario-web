-- Alterations to support won deal classification
CREATE TYPE "public"."WonDealType" AS ENUM ('NEW_CUSTOMER', 'UPSELL');

ALTER TABLE "public"."ManualWonDeal"
ADD COLUMN "wonType" "public"."WonDealType" NOT NULL DEFAULT 'NEW_CUSTOMER';

ALTER TABLE "public"."Proposal"
ADD COLUMN "wonType" "public"."WonDealType";

UPDATE "public"."Proposal"
SET "wonType" = 'NEW_CUSTOMER'
WHERE "status" = 'WON' AND "wonType" IS NULL;
