/*
  # Create FiscalNet Settings table

  1. New Tables
    - `fiscalnet_settings`
      - `id` (text, primary key)
      - `saveDirectory` (text)
      - `fiscalnetEnabled` (boolean)
      - `createdAt` (timestamp)
      - `updatedAt` (timestamp)
  
  2. Security
    - Enable RLS on `fiscalnet_settings` table
    - Add policies for authenticated users to read/update/insert
*/

-- Function to create fiscalnet_settings table
CREATE OR REPLACE FUNCTION create_fiscalnet_settings_table()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS fiscalnet_settings (
    id TEXT PRIMARY KEY,
    "saveDirectory" TEXT NOT NULL DEFAULT 'C:\FiscalNet',
    "fiscalnetEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  );
  
  -- Enable RLS on the table
  ALTER TABLE fiscalnet_settings ENABLE ROW LEVEL SECURITY;
  
  -- Create policies for the table
  CREATE POLICY "Allow authenticated users to read fiscalnet_settings"
    ON fiscalnet_settings FOR SELECT
    TO authenticated
    USING (true);
  
  CREATE POLICY "Allow authenticated users to insert fiscalnet_settings"
    ON fiscalnet_settings FOR INSERT
    TO authenticated
    WITH CHECK (true);
  
  CREATE POLICY "Allow authenticated users to update fiscalnet_settings"
    ON fiscalnet_settings FOR UPDATE
    TO authenticated
    USING (true);
  
  -- Insert default settings if not exists
  INSERT INTO fiscalnet_settings (id, "saveDirectory", "fiscalnetEnabled")
  VALUES ('settings', 'C:\FiscalNet', false)
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- Execute the function to create the table
SELECT create_fiscalnet_settings_table();