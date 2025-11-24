/*
  # Update FiscalNet settings to always be enabled
  
  1. Changes
    - Set all existing fiscalnet_settings to enabled=true
    - Update the default value for fiscalnetEnabled to true
    - Add a note that this field is now always true
  
  2. Security
    - Maintains existing RLS policies
    - No changes to permissions
*/

-- Update all existing settings to be enabled
UPDATE fiscalnet_settings 
SET 
  "fiscalnetEnabled" = true,
  "updatedAt" = NOW()
WHERE id = 'settings';

-- Insert default settings if none exist (with fiscalnetEnabled = true)
INSERT INTO fiscalnet_settings (id, "saveDirectory", "fiscalnetEnabled", "createdAt", "updatedAt")
VALUES ('settings', 'C:\FiscalNet', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  "fiscalnetEnabled" = true,
  "updatedAt" = NOW();

-- Add a comment to the table to document this change
COMMENT ON COLUMN fiscalnet_settings."fiscalnetEnabled" IS 'Always true - FiscalNet integration is always enabled for card payments';