/*
  # Add ean13Barcode column to app_settings table

  1. Changes
    - Add `ean13Barcode` column to `app_settings` table
    - Set default value for existing records
    - Update existing record if it exists

  2. Security
    - No RLS changes needed as table already has RLS enabled
*/

-- Add the missing ean13Barcode column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_settings' AND column_name = 'ean13Barcode'
  ) THEN
    ALTER TABLE app_settings ADD COLUMN "ean13Barcode" TEXT;
  END IF;
END $$;

-- Set default value for existing records
UPDATE app_settings 
SET "ean13Barcode" = '1234567890123' 
WHERE "ean13Barcode" IS NULL;

-- Ensure the column is not null going forward
ALTER TABLE app_settings ALTER COLUMN "ean13Barcode" SET NOT NULL;

-- Set default value for new records
ALTER TABLE app_settings ALTER COLUMN "ean13Barcode" SET DEFAULT '1234567890123';