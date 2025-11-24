-- Function to create tickets table
CREATE OR REPLACE FUNCTION create_tickets_table()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS tickets (
    "qrCode" TEXT PRIMARY KEY,
    "entryName" TEXT NOT NULL,
    "entriesRemaining" INTEGER NOT NULL,
    "lastScanned" TIMESTAMP WITH TIME ZONE
  );
END;
$$;

-- Function to create scan_history table
CREATE OR REPLACE FUNCTION create_scan_history_table()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS scan_history (
    id SERIAL PRIMARY KEY,
    "qrCode" TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    success BOOLEAN NOT NULL,
    message TEXT NOT NULL
  );
  
  -- Create indices for better query performance
  CREATE INDEX IF NOT EXISTS idx_scan_history_qrcode ON scan_history("qrCode");
  CREATE INDEX IF NOT EXISTS idx_scan_history_timestamp ON scan_history(timestamp);
END;
$$;

-- Function to create app_settings table
CREATE OR REPLACE FUNCTION create_settings_table()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS app_settings (
    id TEXT PRIMARY KEY,
    "logoUrl" TEXT,
    "clubName" TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
  );
  
  -- Insert default settings if not exists
  INSERT INTO app_settings (id, "clubName", "createdAt", "updatedAt")
  VALUES ('settings', 'Famous Summer Club', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
END;
$$;