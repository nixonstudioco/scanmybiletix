/*
  # Create FiscalNet Settings Table

  1. New Tables
    - `fiscalnet_settings`
      - `id` (text, primary key, default 'settings')
      - `saveDirectory` (text, default 'C:\FiscalNet')
      - `fiscalnetEnabled` (boolean, default true)
      - `createdAt` (timestamp with time zone)
      - `updatedAt` (timestamp with time zone)

  2. Security
    - Enable RLS on `fiscalnet_settings` table
    - Add policies for public access to read, insert, update

  3. Default Data
    - Insert default settings record
*/

-- Create the fiscalnet_settings table
CREATE TABLE IF NOT EXISTS fiscalnet_settings (
  id TEXT PRIMARY KEY DEFAULT 'settings',
  "saveDirectory" TEXT NOT NULL DEFAULT 'C:\FiscalNet',
  "fiscalnetEnabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE fiscalnet_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
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

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_fiscalnet_settings_id ON fiscalnet_settings(id);

-- Insert default settings
INSERT INTO fiscalnet_settings (id, "saveDirectory", "fiscalnetEnabled", "createdAt", "updatedAt")
VALUES ('settings', 'C:\FiscalNet', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;