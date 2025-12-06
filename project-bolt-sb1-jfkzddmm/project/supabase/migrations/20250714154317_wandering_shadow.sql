/*
  # Create fiscalnet_settings table

  1. New Tables
    - `fiscalnet_settings` 
      - `id` (text, primary key)
      - `saveDirectory` (text, not null)
      - `fiscalnetEnabled` (boolean, not null)
      - `createdAt` (timestamp with time zone, not null)
      - `updatedAt` (timestamp with time zone, not null)
  
  2. Security
    - Enable RLS on `fiscalnet_settings` table
    - Add policy for authenticated users to manage their settings
*/

-- Function to create fiscalnet_settings table
CREATE OR REPLACE FUNCTION create_fiscalnet_settings_table()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS fiscalnet_settings (
    id TEXT PRIMARY KEY DEFAULT 'settings',
    "saveDirectory" TEXT NOT NULL,
    "fiscalnetEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
  );
  
  -- Insert default settings if not exists
  INSERT INTO fiscalnet_settings (id, "saveDirectory", "fiscalnetEnabled", "createdAt", "updatedAt")
  VALUES ('settings', 'C:\FiscalNet', true, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  
  -- Enable Row Level Security
  ALTER TABLE fiscalnet_settings ENABLE ROW LEVEL SECURITY;
  
  -- Create a policy that allows authorized users to select
  CREATE POLICY "Users can view fiscalnet settings" 
    ON fiscalnet_settings FOR SELECT 
    USING (auth.role() = 'authenticated');
  
  -- Create a policy that allows authorized users to update
  CREATE POLICY "Users can update fiscalnet settings" 
    ON fiscalnet_settings FOR UPDATE 
    USING (auth.role() = 'authenticated');
END;
$$;