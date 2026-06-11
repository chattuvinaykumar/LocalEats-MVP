/*
  # Create orders and order_items tables
  
  1. New Tables
    - `orders`
      - `id` (text, primary key)
      - `restaurant_id` (text, foreign key to restaurants)
      - `user_id` (text) - references the customer (auth.users id or fallback UUID/email)
      - `customer_name` (text)
      - `total_price` (numeric)
      - `status` (text) - 'pending', 'preparing', 'ready', 'delivered', 'cancelled'
      - `created_at` (timestamptz, default now())
    - `order_items`
      - `id` (text, primary key)
      - `order_id` (text, foreign key to orders)
      - `menu_item_id` (text, foreign key to menu_items)
      - `name` (text)
      - `quantity` (integer)
      - `price` (numeric)
      
  2. Security
    - Enable RLS on both tables
    - Read, write, and update policies for public & authenticated access
*/

CREATE TABLE IF NOT EXISTS orders (
  id text PRIMARY KEY,
  restaurant_id text NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  customer_name text NOT NULL,
  total_price numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public & Authenticated can view orders"
  ON orders FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public & Authenticated can insert orders"
  ON orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public & Authenticated can update orders"
  ON orders FOR UPDATE
  TO anon, authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS order_items (
  id text PRIMARY KEY,
  order_id text NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id text NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  name text NOT NULL,
  quantity integer NOT NULL,
  price numeric NOT NULL
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public & Authenticated can view order items"
  ON order_items FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public & Authenticated can insert order items"
  ON order_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
