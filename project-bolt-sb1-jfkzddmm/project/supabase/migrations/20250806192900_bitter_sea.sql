/*
  # Add Admin PIN to App Settings

  1. Changes
    - Add `adminPin` column to `app_settings` table
    - Set default PIN to '123456'
    - Update existing settings record with default PIN

  2. Security
    - Maintain existing RLS policies
    - PIN is stored in plain text for simplicity (can be enhanced later)
*/

-- Add the adminPin column to app_settings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_settings' AND column_name = 'adminPin'
  ) THEN
    ALTER TABLE app_settings ADD COLUMN "adminPin" TEXT DEFAULT '123456';
  END IF;
END $$;

-- Update existing settings record with default PIN if it doesn't have one
UPDATE app_settings 
SET 
  "adminPin" = COALESCE("adminPin", '123456'),
  "updatedAt" = NOW()
WHERE id = 'settings' AND ("adminPin" IS NULL OR "adminPin" = '');

-- Ensure there's a settings record with the PIN
INSERT INTO app_settings (
  id, 
  "clubName", 
  "adminPin",
  "ticketPrice", 
  "ean13Barcode", 
  "logoUrl", 
  "createdAt", 
  "updatedAt"
)
VALUES (
  'settings',
  'Famous Summer Club',
  '123456',
  50,
  '1234567890128',
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  "adminPin" = COALESCE(app_settings."adminPin", '123456'),
  "updatedAt" = NOW();