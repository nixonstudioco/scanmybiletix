/*
  # Update app_settings table structure

  1. Table Updates
    - Ensure ticketPrice column exists with proper type
    - Ensure ean13Barcode column has proper type
    - Add any missing columns with defaults

  2. Data
    - Update existing settings with default values if needed
    - Ensure all required fields are present

  3. Security
    - Maintain existing RLS policies
    - Ensure proper column constraints
*/

-- Add ticketPrice column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'app_settings' AND column_name = 'ticketPrice'
  ) THEN
    ALTER TABLE app_settings ADD COLUMN "ticketPrice" INTEGER DEFAULT 50;
  END IF;
END $$;

-- Ensure ean13Barcode has proper type and constraint
DO $$
BEGIN
  -- Check if column exists and update if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'app_settings' AND column_name = 'ean13Barcode'
  ) THEN
    -- Update existing column to TEXT type if it's not already
    ALTER TABLE app_settings ALTER COLUMN "ean13Barcode" TYPE TEXT USING "ean13Barcode"::TEXT;
  ELSE
    -- Add column if it doesn't exist
    ALTER TABLE app_settings ADD COLUMN "ean13Barcode" TEXT DEFAULT '1234567890128';
  END IF;
END $$;

-- Update any existing settings that might be missing values
UPDATE app_settings 
SET 
  "ticketPrice" = COALESCE("ticketPrice", 50),
  "ean13Barcode" = COALESCE("ean13Barcode", '1234567890128')
WHERE id = 'settings';

-- Ensure there's a default settings record
INSERT INTO app_settings (
  id, 
  "clubName", 
  "ticketPrice", 
  "ean13Barcode", 
  "logoUrl", 
  "createdAt", 
  "updatedAt"
)
VALUES (
  'settings',
  'Famous Summer Club',
  50,
  '1234567890128',
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  "ticketPrice" = COALESCE(app_settings."ticketPrice", 50),
  "ean13Barcode" = COALESCE(app_settings."ean13Barcode", '1234567890128'),
  "updatedAt" = NOW();