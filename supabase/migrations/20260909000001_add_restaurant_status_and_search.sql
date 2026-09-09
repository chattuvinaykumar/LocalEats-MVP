-- Add operating_status to restaurants and create text search indexes

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS operating_status text DEFAULT 'OPEN';

-- Restrict values
ALTER TABLE restaurants
  ADD CONSTRAINT restaurants_operating_status_check CHECK (operating_status IN ('OPEN','CLOSED','BUSY')) NOT DEFERRABLE;

-- Create GIN index on to_tsvector for restaurant name + cuisine
CREATE INDEX IF NOT EXISTS restaurants_search_idx ON restaurants USING GIN (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(cuisine, '')));

-- Create GIN index for menu_items name + description
CREATE INDEX IF NOT EXISTS menu_items_search_idx ON menu_items USING GIN (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')));

-- Ensure restaurants are selectable publicly (policy already exists)
