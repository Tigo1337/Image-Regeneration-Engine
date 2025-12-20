-- Migration: Replace base64 image columns with URL columns
-- This migration drops the old base64 columns and adds new URL columns

-- Step 1: Add new URL columns (if they don't exist)
ALTER TABLE "generated_designs" ADD COLUMN IF NOT EXISTS "original_image_url" text;
ALTER TABLE "generated_designs" ADD COLUMN IF NOT EXISTS "generated_image_url" text;

-- Step 2: Drop old base64 columns (these were too large to view in Neon console)
ALTER TABLE "generated_designs" DROP COLUMN IF EXISTS "original_image";
ALTER TABLE "generated_designs" DROP COLUMN IF EXISTS "generated_image";

-- Step 3: Make the new columns required (for future inserts)
-- Note: We first need to delete any existing rows or provide default values
-- Since old data had base64 strings we can't migrate, we'll clear and make them required
DELETE FROM "generated_designs" WHERE "original_image_url" IS NULL OR "generated_image_url" IS NULL;
ALTER TABLE "generated_designs" ALTER COLUMN "original_image_url" SET NOT NULL;
ALTER TABLE "generated_designs" ALTER COLUMN "generated_image_url" SET NOT NULL;
