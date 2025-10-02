-- Create enum for item translations locales
CREATE TYPE "LanguageCode" AS ENUM ('es', 'en', 'pt');

-- Add translation table for catalog items
CREATE TABLE "ItemTranslation" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "locale" "LanguageCode" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ItemTranslation_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ItemTranslation_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ItemTranslation_itemId_locale_key" ON "ItemTranslation"("itemId", "locale");
CREATE INDEX "ItemTranslation_locale_idx" ON "ItemTranslation"("locale");

-- Seed existing catalog rows so every item has translations for all locales
INSERT INTO "ItemTranslation" ("id", "itemId", "locale", "name", "description", "category")
SELECT 'seed-' || "id" || '-es', "id", 'es', "name", COALESCE("description", ''), COALESCE("category", '')
FROM "Item";

INSERT INTO "ItemTranslation" ("id", "itemId", "locale", "name", "description", "category")
SELECT 'seed-' || "id" || '-en', "id", 'en', "name", COALESCE("description", ''), COALESCE("category", '')
FROM "Item"
WHERE NOT EXISTS (
    SELECT 1 FROM "ItemTranslation" it WHERE it."itemId" = "Item"."id" AND it."locale" = 'en'
);

INSERT INTO "ItemTranslation" ("id", "itemId", "locale", "name", "description", "category")
SELECT 'seed-' || "id" || '-pt', "id", 'pt', "name", COALESCE("description", ''), COALESCE("category", '')
FROM "Item"
WHERE NOT EXISTS (
    SELECT 1 FROM "ItemTranslation" it WHERE it."itemId" = "Item"."id" AND it."locale" = 'pt'
);
