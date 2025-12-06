/*
  # Clean trailing newlines from ticket data
  
  1. Changes
    - Trim trailing newlines and whitespace from qrCode field in tickets table
    - Trim trailing newlines and whitespace from entryName field in tickets table
    - Trim trailing newlines and whitespace from club field in tickets table
    
  2. Why
    - Some CSV imports have resulted in tickets with trailing newlines (\n) in various fields
    - This causes validation failures because scanned codes don't match database records
    - This cleanup ensures all existing tickets are properly formatted
    
  3. Impact
    - One-time update to clean existing data
    - No structural changes to the database schema
    - Future imports will also trim data via application code
*/

-- Clean up tickets table
UPDATE tickets
SET 
  "qrCode" = TRIM("qrCode"),
  "entryName" = TRIM("entryName"),
  club = TRIM(club)
WHERE 
  "qrCode" != TRIM("qrCode") OR
  "entryName" != TRIM("entryName") OR
  club != TRIM(club);