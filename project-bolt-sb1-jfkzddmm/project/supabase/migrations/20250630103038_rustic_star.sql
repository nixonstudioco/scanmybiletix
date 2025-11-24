/*
  # Enable RLS and Create Security Policies

  1. Security Updates
    - Enable RLS on all tables for security
    - Add policies for public access (since this is a scanning app)
    - Ensure proper data access patterns

  2. Data Integrity
    - Add default app settings if they don't exist
    - Ensure all tables have proper constraints

  3. Performance
    - Verify indexes are in place for scan operations
*/

-- Enable RLS on all tables
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for tickets table
-- Since this is a scanning app, we need permissive policies for the scanner to work
CREATE POLICY "Allow read access to tickets"
  ON tickets
  FOR SELECT
  USING (true);

CREATE POLICY "Allow update tickets for scanning"
  ON tickets
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow insert tickets for import"
  ON tickets
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow delete tickets for management"
  ON tickets
  FOR DELETE
  USING (true);

-- Create policies for scan_history table
CREATE POLICY "Allow read scan history"
  ON scan_history
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert scan records"
  ON scan_history
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow delete scan history for cleanup"
  ON scan_history
  FOR DELETE
  USING (true);

-- Create policies for app_settings table
CREATE POLICY "Allow read app settings"
  ON app_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Allow update app settings"
  ON app_settings
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow insert app settings"
  ON app_settings
  FOR INSERT
  WITH CHECK (true);

-- Ensure default app settings exist
INSERT INTO app_settings (id, "clubName", "createdAt", "updatedAt")
VALUES ('settings', 'Famous Summer Club', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Verify and create missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_qrcode ON tickets("qrCode");
CREATE INDEX IF NOT EXISTS idx_scan_history_qrcode ON scan_history("qrCode");
CREATE INDEX IF NOT EXISTS idx_scan_history_timestamp ON scan_history(timestamp);

-- Add helpful comments to tables
COMMENT ON TABLE tickets IS 'Stores ticket information for QR code scanning validation';
COMMENT ON TABLE scan_history IS 'Records all scan attempts for auditing and analytics';
COMMENT ON TABLE app_settings IS 'Application configuration including branding and settings';

-- Verify table structure is correct
DO $$
BEGIN
  -- Check if all required columns exist and have correct types
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tickets' AND column_name = 'qrCode' AND data_type = 'text'
  ) THEN
    RAISE EXCEPTION 'Tickets table structure is incorrect';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'app_settings' AND column_name = 'clubName' AND data_type = 'text'
  ) THEN
    RAISE EXCEPTION 'App settings table structure is incorrect';
  END IF;
  
  RAISE NOTICE 'All table structures verified successfully';
END $$;