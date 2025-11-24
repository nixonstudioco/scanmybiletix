/*
  # Add printer settings table

  1. New Tables
    - `printer_settings`
      - `id` (text, primary key, default 'settings')
      - `selectedPrinter` (text) - ID of the selected printer
      - `printerName` (text) - Display name of the selected printer
      - `printerType` (text) - Type of printer (thermal, pos, etc.)
      - `printEnabled` (boolean) - Whether printing is enabled
      - `autoprint` (boolean) - Whether to auto-print on successful scans
      - `paperSize` (text) - Paper size (80mm, 58mm, etc.)
      - `settings` (jsonb) - Additional printer-specific settings
      - `createdAt` (timestamp)
      - `updatedAt` (timestamp)

  2. Security
    - Enable RLS on `printer_settings` table
    - Add policies for public access (since this is a single-user app)

  3. Indexes
    - Add index on id for faster queries
*/

-- Create printer_settings table
CREATE TABLE IF NOT EXISTS printer_settings (
  id TEXT PRIMARY KEY DEFAULT 'settings',
  "selectedPrinter" TEXT,
  "printerName" TEXT,
  "printerType" TEXT DEFAULT 'thermal',
  "printEnabled" BOOLEAN NOT NULL DEFAULT true,
  "autoprint" BOOLEAN NOT NULL DEFAULT true,
  "paperSize" TEXT DEFAULT '80mm',
  "settings" JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE printer_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public insert access to printer_settings"
  ON printer_settings
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public read access to printer_settings"
  ON printer_settings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public update access to printer_settings"
  ON printer_settings
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to printer_settings"
  ON printer_settings
  FOR DELETE
  TO public
  USING (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_printer_settings_id ON printer_settings(id);

-- Insert default settings
INSERT INTO printer_settings (id, "selectedPrinter", "printerName", "printerType", "printEnabled", "autoprint", "paperSize", "settings")
VALUES ('settings', NULL, NULL, 'thermal', true, true, '80mm', '{}')
ON CONFLICT (id) DO NOTHING;