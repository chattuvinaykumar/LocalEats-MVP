/*
  # Create restaurants and menu_items tables

  1. New Tables
    - `restaurants`
      - `id` (text, primary key) - matches existing mock data IDs
      - `name` (text, not null)
      - `cuisine` (text, not null)
      - `rating` (numeric, default 0)
      - `review_count` (integer, default 0)
      - `delivery_time` (text, default '')
      - `delivery_fee` (numeric, default 0)
      - `price_range` (text, default '')
      - `image` (text, default '')
      - `tags` (text[], default '{}')
      - `featured` (boolean, default false)
      - `city` (text, default '')
      - `created_at` (timestamptz, default now())
    - `menu_items`
      - `id` (text, primary key) - matches existing mock data IDs
      - `restaurant_id` (text, foreign key to restaurants)
      - `name` (text, not null)
      - `description` (text, default '')
      - `price` (numeric, default 0)
      - `image` (text, default '')
      - `category` (text, default '')
      - `popular` (boolean, default false)
      - `created_at` (timestamptz, default now())
  2. Security
    - Enable RLS on both tables
    - Public read policies for both tables
    - No write policies (admin-only in future)
  3. Seed Data
    - All 8 restaurants from mock data
    - All 28 menu items from mock data
*/

CREATE TABLE IF NOT EXISTS restaurants (
  id text PRIMARY KEY,
  name text NOT NULL,
  cuisine text NOT NULL,
  rating numeric DEFAULT 0,
  review_count integer DEFAULT 0,
  delivery_time text DEFAULT '',
  delivery_fee numeric DEFAULT 0,
  price_range text DEFAULT '',
  image text DEFAULT '',
  tags text[] DEFAULT '{}',
  featured boolean DEFAULT false,
  city text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view restaurants"
  ON restaurants FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS menu_items (
  id text PRIMARY KEY,
  restaurant_id text NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  price numeric DEFAULT 0,
  image text DEFAULT '',
  category text DEFAULT '',
  popular boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view menu items"
  ON menu_items FOR SELECT
  TO anon, authenticated
  USING (true);

INSERT INTO restaurants (id, name, cuisine, rating, review_count, delivery_time, delivery_fee, price_range, image, tags, featured, city) VALUES
('1', 'Paradise Biryani', 'Hyderabadi Biryani', 4.8, 324, '25-35', 40, 'Budget', 'https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['Biryani', 'Hyderabadi', 'Non-Veg'], true, 'Hyderabad'),
('2', 'Mehfil', 'North Indian & Mughlai', 4.9, 512, '30-40', 50, 'Premium', 'https://images.pexels.com/photos/2474660/pexels-photo-2474660.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['Mughlai', 'North Indian', 'Biryani'], true, 'Hyderabad'),
('3', 'Sri Kanya', 'South Indian', 4.6, 198, '15-25', 30, 'Budget', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['Dosa', 'Idli', 'South Indian'], false, 'Bengaluru'),
('4', 'Bawarchi', 'Andhra Cuisine', 4.7, 287, '20-30', 45, 'Mid Range', 'https://images.pexels.com/photos/2316904/pexels-photo-2316904.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['Biryani', 'Andhra', 'Spicy'], true, 'Hyderabad'),
('5', 'Pista House', 'Hyderabadi & Desserts', 4.5, 156, '20-30', 40, 'Mid Range', 'https://images.pexels.com/photos/2915282/pexels-photo-2915282.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['Biryani', 'Haleem', 'Halwa'], false, 'Hyderabad'),
('6', 'Chutneys', 'South Indian', 4.4, 203, '18-28', 35, 'Budget', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['Dosa', 'Idli', 'Uttapam'], false, 'Bengaluru'),
('7', 'Kritunga', 'South Indian Meals', 4.6, 178, '25-35', 45, 'Mid Range', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['Meals', 'Biryani', 'South Indian'], false, 'Chennai'),
('8', 'Spice Route', 'North Indian Curries', 4.9, 421, '20-30', 40, 'Mid Range', 'https://images.pexels.com/photos/2474660/pexels-photo-2474660.jpeg?auto=compress&cs=tinysrgb&w=600', ARRAY['Paneer', 'Curry', 'Naan'], false, 'Mumbai')
ON CONFLICT (id) DO NOTHING;

INSERT INTO menu_items (id, restaurant_id, name, description, price, image, category, popular) VALUES
('m1', '1', 'Chicken Biryani', 'Fragrant basmati rice with tender chicken', 250, 'https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg?auto=compress&cs=tinysrgb&w=400', 'Biryani', true),
('m2', '1', 'Mutton Biryani', 'Slow-cooked mutton with aromatic spices', 320, 'https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg?auto=compress&cs=tinysrgb&w=400', 'Biryani', true),
('m3', '1', 'Paneer Biryani', 'Aromatic rice with paneer and vegetables', 220, 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', 'Biryani', false),
('m4', '1', 'Raita', 'Cool yogurt with cucumber and spices', 60, 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', 'Fast Food', false),
('m5', '2', 'Paneer Butter Masala', 'Creamy tomato curry with soft paneer', 280, 'https://images.pexels.com/photos/2474660/pexels-photo-2474660.jpeg?auto=compress&cs=tinysrgb&w=400', 'North Indian', true),
('m6', '2', 'Butter Naan', 'Soft flatbread brushed with butter', 60, 'https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg?auto=compress&cs=tinysrgb&w=400', 'Breads', true),
('m7', '2', 'Dum Ka Chicken', 'Slow-cooked chicken in traditional style', 320, 'https://images.pexels.com/photos/2474660/pexels-photo-2474660.jpeg?auto=compress&cs=tinysrgb&w=400', 'North Indian', false),
('m8', '2', 'Mutton Haleem', 'Slow-cooked mutton with lentils and spices', 280, 'https://images.pexels.com/photos/2474660/pexels-photo-2474660.jpeg?auto=compress&cs=tinysrgb&w=400', 'North Indian', false),
('m9', '3', 'Idli', 'Steamed rice cakes served with sambar', 80, 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', 'South Indian', true),
('m10', '3', 'Masala Dosa', 'Crispy crepe with potato and spices', 120, 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', 'South Indian', true),
('m11', '3', 'Pesarattu', 'Green moong crepe with onions and ginger', 100, 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', 'South Indian', false),
('m12', '3', 'Sambar Vada', 'Fried lentil cake in sambar gravy', 90, 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', 'South Indian', false),
('m13', '4', 'Andhra Chicken Biryani', 'Spicy biryani with Andhra spices', 280, 'https://images.pexels.com/photos/2316904/pexels-photo-2316904.jpeg?auto=compress&cs=tinysrgb&w=400', 'Biryani', true),
('m14', '4', 'Chikhalwala Biryani', 'Traditional Andhra meat biryani', 300, 'https://images.pexels.com/photos/2316904/pexels-photo-2316904.jpeg?auto=compress&cs=tinysrgb&w=400', 'Biryani', false),
('m15', '4', 'Curd Rice', 'Yogurt rice with carrots and peas', 100, 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', 'Fast Food', false),
('m16', '5', 'Chicken Biryani', 'Classic Hyderabadi chicken biryani', 260, 'https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg?auto=compress&cs=tinysrgb&w=400', 'Biryani', true),
('m17', '5', 'Double Ka Meetha', 'Bread pudding with khoya and dry fruits', 120, 'https://images.pexels.com/photos/2915282/pexels-photo-2915282.jpeg?auto=compress&cs=tinysrgb&w=400', 'Desserts', true),
('m18', '5', 'Halwa', 'Wheat halwa with ghee and nuts', 80, 'https://images.pexels.com/photos/2915282/pexels-photo-2915282.jpeg?auto=compress&cs=tinysrgb&w=400', 'Desserts', false),
('m19', '6', 'Dosa', 'Crispy crepe with potato filling', 100, 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', 'South Indian', true),
('m20', '6', 'Uttapam', 'Savory pancake with vegetables', 110, 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', 'South Indian', false),
('m21', '6', 'Idli Sambar', 'Steamed rice cakes with sambar', 80, 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', 'South Indian', false),
('m22', '7', 'South Indian Meals', 'Rice, sambar, rasam, and curries', 150, 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', 'South Indian', true),
('m23', '7', 'Veg Fried Rice', 'Fried rice with fresh vegetables', 140, 'https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg?auto=compress&cs=tinysrgb&w=400', 'Chinese', false),
('m24', '7', 'Chicken Noodles', 'Stir-fried noodles with chicken', 160, 'https://images.pexels.com/photos/2474660/pexels-photo-2474660.jpeg?auto=compress&cs=tinysrgb&w=400', 'Chinese', false),
('m25', '8', 'Paneer Butter Masala', 'Creamy tomato curry with soft paneer', 290, 'https://images.pexels.com/photos/2474660/pexels-photo-2474660.jpeg?auto=compress&cs=tinysrgb&w=400', 'North Indian', true),
('m26', '8', 'Butter Chicken', 'Tender chicken in creamy tomato sauce', 320, 'https://images.pexels.com/photos/2474660/pexels-photo-2474660.jpeg?auto=compress&cs=tinysrgb&w=400', 'North Indian', true),
('m27', '8', 'Garlic Naan', 'Flatbread with garlic butter', 70, 'https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg?auto=compress&cs=tinysrgb&w=400', 'Breads', false),
('m28', '8', 'Gulab Jamun', 'Milk solids in sugar syrup', 90, 'https://images.pexels.com/photos/2915282/pexels-photo-2915282.jpeg?auto=compress&cs=tinysrgb&w=400', 'Desserts', false)
ON CONFLICT (id) DO NOTHING;
