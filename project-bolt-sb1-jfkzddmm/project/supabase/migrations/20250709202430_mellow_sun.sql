/*
  # Fix EAN13 Barcode Default Value

  1. Changes
    - Update the default value for ean13Barcode column from '1234567890123' to '1234567890128'
    - Update existing records that have the old invalid default value
  
  2. Details
    - The old default '1234567890123' is not a valid EAN13 barcode (fails checksum)
    - The new default '1234567890128' is a valid EAN13 barcode with correct checksum
*/

-- Update the default value for the ean13Barcode column
ALTER TABLE app_settings ALTER COLUMN "ean13Barcode" SET DEFAULT '1234567890128';

-- Update any existing records that have the old invalid default value
UPDATE app_settings 
SET "ean13Barcode" = '1234567890128', 
    "updatedAt" = NOW()
WHERE "ean13Barcode" = '1234567890123';