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
END;
$$;

-- Run these functions to create the tables
SELECT create_tickets_table();
SELECT create_scan_history_table();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scan_history_qrcode ON scan_history("qrCode");
CREATE INDEX IF NOT EXISTS idx_scan_history_timestamp ON scan_history(timestamp);