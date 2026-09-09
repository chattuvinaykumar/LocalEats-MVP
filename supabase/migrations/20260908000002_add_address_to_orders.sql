-- Add address_id FK to orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS address_id text REFERENCES addresses(id) ON DELETE SET NULL;

-- Ensure orders RLS accounts for address access via user_id matching
-- (No policy changes here — handled in hardened RLS migration)
