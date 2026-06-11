/*
  # Create offers table and setup RLS rules
  
  1. New Tables
    - `offers`
      - `id` (text, primary key)
      - `restaurant_id` (text, foreign key to restaurants, cascade delete)
      - `title` (text)
      - `description` (text)
      - `discount_percentage` (integer)
      - `start_date` (text)
      - `end_date` (text)
      - `banner_image` (text)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on offers
    - Select query rule for all users
    - Insert/Update/Delete rule for anon & authenticated
*/

CREATE TABLE IF NOT EXISTS offers (
  id text PRIMARY KEY,
  restaurant_id text NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  discount_percentage integer NOT NULL,
  start_date text NOT NULL,
  end_date text NOT NULL,
  banner_image text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view offers"
  ON offers FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public & Authenticated can insert offers"
  ON offers FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public & Authenticated can update offers"
  ON offers FOR UPDATE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public & Authenticated can delete offers"
  ON offers FOR DELETE
  TO anon, authenticated
  USING (true);

-- Seed some initial offers for existing restaurants so developers/users can test instantly
INSERT INTO offers (id, restaurant_id, title, description, discount_percentage, start_date, end_date, banner_image, is_active) VALUES
('o1', '1', 'Super Biryani Feast', 'Save majorly on authentic chicken & mutton biryanis today!', 20, '2026-06-01', '2026-12-31', 'https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg?auto=compress&cs=tinysrgb&w=600', true),
('o2', '2', 'Mehfil Royal Discount', 'Flat 15% discount on all Mughlai curries and delicious Naans!', 15, '2026-06-01', '2026-12-31', 'https://images.pexels.com/photos/2474660/pexels-photo-2474660.jpeg?auto=compress&cs=tinysrgb&w=600', true),
('o3', '3', 'South Indian Sunrise', '10% OFF on hot crispy Dosas & Idlis every morning!', 10, '2026-06-01', '2026-12-31', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=600', true),
('o4', '4', 'Andhra Spicy Rush', 'Up to 25% OFF on fire-spicy Andhra combo platters!', 25, '2026-06-01', '2026-12-31', 'https://images.pexels.com/photos/2316904/pexels-photo-2316904.jpeg?auto=compress&cs=tinysrgb&w=600', true)
ON CONFLICT (id) DO NOTHING;
