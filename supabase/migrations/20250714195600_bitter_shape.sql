/*
  # Fix FiscalNet Settings RLS Policies

  1. Security
    - Enable RLS on fiscalnet_settings table
    - Add proper policies for public access
    - Ensure anonymous users can read and write settings

  2. Permissions
    - Allow SELECT, INSERT, UPDATE for public role
    - Maintain data integrity with proper constraints
*/

-- Enable RLS on fiscalnet_settings table
ALTER TABLE fiscalnet_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public access to fiscalnet_settings" ON fiscalnet_settings;
DROP POLICY IF EXISTS "Allow authenticated users to read fiscalnet_settings" ON fiscalnet_settings;
DROP POLICY IF EXISTS "Allow authenticated users to insert fiscalnet_settings" ON fiscalnet_settings;
DROP POLICY IF EXISTS "Allow authenticated users to update fiscalnet_settings" ON fiscalnet_settings;

-- Create comprehensive policies for public access
CREATE POLICY "Allow public read access to fiscalnet_settings"
  ON fiscalnet_settings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to fiscalnet_settings"
  ON fiscalnet_settings
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to fiscalnet_settings"
  ON fiscalnet_settings
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Ensure default settings record exists
INSERT INTO fiscalnet_settings (id, "saveDirectory", "fiscalnetEnabled", "createdAt", "updatedAt")
VALUES ('settings', 'C:\FiscalNet', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  "updatedAt" = NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fiscalnet_settings_id ON fiscalnet_settings(id);