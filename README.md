# QR Code Scanner with Supabase Integration

This application is a QR code scanner for ticket validation that uses Supabase for online data storage and syncing.

## Features

- Scan QR codes using device camera
- Validate tickets against a database
- Track remaining entries for each ticket
- Import tickets from CSV files
- Works online (with Supabase) and offline (with IndexedDB)
- Automatic data syncing when online
- Responsive design for mobile and desktop

## Setup

1. Clone this repository
2. Install dependencies with `npm install`
3. **IMPORTANT - QZ Tray Setup (Required for Direct Printing):**
   - Download QZ Tray from https://qz.io/download/
   - Install the QZ Tray desktop application
   - **Start QZ Tray** before using the app (it runs in system tray)
   - The app will automatically connect to QZ Tray for direct printing
4. **IMPORTANT**: Create your own Supabase project at https://supabase.com
5. Create a `.env` file with your OWN Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY-HERE
   ```
   **WARNING**: Do NOT use shared/demo credentials as you will see data from other users!
6. Set up the required Supabase SQL functions (see SQL Functions section below)
7. Run the development server with `npm run dev`

## QZ Tray Direct Printing Setup

**QZ Tray enables direct, silent printing without browser dialogs.**

### Installation Steps:
1. **Download:** Go to https://qz.io/download/
2. **Install:** Run the QZ Tray installer for your operating system
3. **Start:** Launch QZ Tray (it will run in your system tray)
4. **Verify:** The app will show "QZ Tray Connected" in printer settings when working

### Features with QZ Tray:
- ⚡ **Zero print dialogs** - Prints directly to selected printer
- 🖨️ **All printer types** - Thermal, inkjet, laser printers supported  
- 📏 **ESC/POS commands** - Advanced thermal printer formatting
- 🔒 **Digital signatures** - Trusted printing without user prompts
- 🚀 **Production ready** - Professional POS system behavior

### Troubleshooting:
- **"Connection blocked by client"** - QZ Tray is not running, start the application
- **"QZ Tray not available"** - QZ Tray is not installed or browser cache needs refresh
- **No printers showing** - Check QZ Tray is running and has printer access permissions

### Without QZ Tray:
The app will still work but printing will use browser print dialogs instead of direct printing.

## Supabase Setup

You need to create two SQL functions in your Supabase project to create the necessary tables:

### SQL Functions

#### Create Tickets Table Function

```sql
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
```

#### Create Scan History Table Function

```sql
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
```

-- Function to create app_settings table
CREATE OR REPLACE FUNCTION create_settings_table()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS app_settings (
    id TEXT PRIMARY KEY,
    "logoUrl" TEXT,
    "clubName" TEXT NOT NULL,
    "ticketPrice" INTEGER DEFAULT 50,
    "ean13Barcode" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
  );
  
  -- Insert default settings if not exists
  INSERT INTO app_settings (id, "clubName", "ticketPrice", "ean13Barcode", "createdAt", "updatedAt")
  VALUES ('settings', 'Famous Summer Club', 50, '1234567890128', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
END;
$$;

#### Create FiscalNet Settings Table Function

```sql
-- Function to create fiscalnet_settings table
CREATE OR REPLACE FUNCTION create_fiscalnet_settings_table()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS fiscalnet_settings (
    id TEXT PRIMARY KEY DEFAULT 'settings',
    "saveDirectory" TEXT NOT NULL DEFAULT 'C:\FiscalNet',
    "fiscalnetEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  );
  
  -- Enable RLS
  ALTER TABLE fiscalnet_settings ENABLE ROW LEVEL SECURITY;
  
  -- Create policy for public access
  CREATE POLICY "Allow public access to fiscalnet_settings" 
    ON fiscalnet_settings FOR ALL TO public USING (true);
  
  -- Insert default settings if not exists
  INSERT INTO fiscalnet_settings (id, "saveDirectory", "fiscalnetEnabled", "createdAt", "updatedAt")
  VALUES ('settings', 'C:\FiscalNet', false, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
END;
$$;
```

After creating these functions, you can use the "Create Database Tables" button in the Settings page to create the actual tables.

## CSV Format

The CSV for importing tickets should have the following format:

```
qrCode,entryName,entriesRemaining
TICKET001,Regular Entry,1
TICKET002,VIP Access,3
TICKET003,Backstage Pass,2
```

## Building and Deploying

Build the application for production:

```bash
npm run build
```

The built files will be in the `dist` directory, ready to be deployed to your hosting service of choice.