/*
  # Add club field to tickets table

  1. Changes
    - Add `club` column to `tickets` table
    - Set default value for existing tickets
    - Update any existing tickets with a default club name

  2. Security
    - Maintain existing RLS policies
    - No changes to permissions
*/

-- Add the club column to tickets table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'club'
  ) THEN
    ALTER TABLE tickets ADD COLUMN "club" TEXT DEFAULT 'Default Club';
  END IF;
END $$;

-- Update existing tickets that don't have a club assigned
UPDATE tickets 
SET "club" = 'Default Club' 
WHERE "club" IS NULL OR "club" = '';

-- Set the column to not null after setting defaults
ALTER TABLE tickets ALTER COLUMN "club" SET NOT NULL;

-- Add an index for better query performance when filtering by club
CREATE INDEX IF NOT EXISTS idx_tickets_club ON tickets("club");

-- Add a comment to document the new column
COMMENT ON COLUMN tickets."club" IS 'The club or organization that this ticket belongs to (e.g., Capricci, Intooit)';